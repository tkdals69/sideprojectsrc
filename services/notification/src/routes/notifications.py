from fastapi import APIRouter, HTTPException, Depends, Query, Path, status
from typing import List, Optional
import structlog
from datetime import datetime
import uuid

from models.notification import (
    Notification, NotificationCreate, NotificationResponse, 
    NotificationListResponse, NotificationStats, NotificationSearchParams,
    NotificationType, NotificationStatus, NotificationChannel
)
from database.connection import get_database
from middleware.auth import get_current_user
from services.notification_service import NotificationService

router = APIRouter()
logger = structlog.get_logger()

@router.post("/", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
async def create_notification(
    notification: NotificationCreate,
    db=Depends(get_database)
):
    """Create a new notification"""
    try:
        notification_service = NotificationService(db)
        created_notification = await notification_service.create_notification(notification)
        
        logger.info("Notification created", notification_id=str(created_notification.id))
        
        return created_notification
    except Exception as e:
        logger.error("Failed to create notification", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create notification"
        )

@router.get("/", response_model=NotificationListResponse)
async def get_notifications(
    user_id: Optional[uuid.UUID] = Query(None, description="Filter by user ID"),
    order_id: Optional[uuid.UUID] = Query(None, description="Filter by order ID"),
    type: Optional[NotificationType] = Query(None, description="Filter by notification type"),
    status: Optional[NotificationStatus] = Query(None, description="Filter by status"),
    channel: Optional[NotificationChannel] = Query(None, description="Filter by channel"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", regex="^(asc|desc)$", description="Sort order"),
    db=Depends(get_database)
):
    """Get paginated list of notifications with filtering"""
    try:
        notification_service = NotificationService(db)
        
        # Build search parameters
        search_params = NotificationSearchParams(
            user_id=user_id,
            order_id=order_id,
            type=type,
            status=status,
            channel=channel,
            page=page,
            per_page=per_page,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        result = await notification_service.get_notifications(search_params)
        
        logger.info("Notifications retrieved", total=result.total, page=page)
        
        return result
    except Exception as e:
        logger.error("Failed to get notifications", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve notifications"
        )

@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: uuid.UUID = Path(..., description="Notification ID"),
    db=Depends(get_database)
):
    """Get a specific notification by ID"""
    try:
        notification_service = NotificationService(db)
        notification = await notification_service.get_notification_by_id(notification_id)
        
        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        logger.info("Notification retrieved", notification_id=str(notification_id))
        
        return notification
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get notification", notification_id=str(notification_id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve notification"
        )

@router.put("/{notification_id}", response_model=NotificationResponse)
async def update_notification(
    notification_id: uuid.UUID = Path(..., description="Notification ID"),
    status: Optional[NotificationStatus] = None,
    db=Depends(get_database)
):
    """Update notification status"""
    try:
        notification_service = NotificationService(db)
        
        # Check if notification exists
        existing_notification = await notification_service.get_notification_by_id(notification_id)
        if not existing_notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        # Update notification
        updated_notification = await notification_service.update_notification(
            notification_id, 
            status=status,
            sent_at=datetime.now() if status == NotificationStatus.SENT else None
        )
        
        logger.info("Notification updated", notification_id=str(notification_id), status=status)
        
        return updated_notification
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update notification", notification_id=str(notification_id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update notification"
        )

@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: uuid.UUID = Path(..., description="Notification ID"),
    db=Depends(get_database)
):
    """Delete a notification"""
    try:
        notification_service = NotificationService(db)
        
        # Check if notification exists
        existing_notification = await notification_service.get_notification_by_id(notification_id)
        if not existing_notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        # Delete notification
        await notification_service.delete_notification(notification_id)
        
        logger.info("Notification deleted", notification_id=str(notification_id))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete notification", notification_id=str(notification_id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete notification"
        )

@router.get("/user/{user_id}", response_model=NotificationListResponse)
async def get_user_notifications(
    user_id: uuid.UUID = Path(..., description="User ID"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    db=Depends(get_database)
):
    """Get notifications for a specific user"""
    try:
        notification_service = NotificationService(db)
        
        search_params = NotificationSearchParams(
            user_id=user_id,
            page=page,
            per_page=per_page
        )
        
        result = await notification_service.get_notifications(search_params)
        
        logger.info("User notifications retrieved", user_id=str(user_id), total=result.total)
        
        return result
    except Exception as e:
        logger.error("Failed to get user notifications", user_id=str(user_id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user notifications"
        )

@router.get("/stats/overview", response_model=NotificationStats)
async def get_notification_stats(db=Depends(get_database)):
    """Get notification statistics"""
    try:
        notification_service = NotificationService(db)
        stats = await notification_service.get_notification_stats()
        
        logger.info("Notification stats retrieved")
        
        return stats
    except Exception as e:
        logger.error("Failed to get notification stats", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve notification statistics"
        )

@router.post("/send", response_model=NotificationResponse)
async def send_notification(
    notification: NotificationCreate,
    db=Depends(get_database)
):
    """Create and immediately send a notification"""
    try:
        notification_service = NotificationService(db)
        
        # Create notification
        created_notification = await notification_service.create_notification(notification)
        
        # Send notification
        sent_notification = await notification_service.send_notification(created_notification.id)
        
        logger.info("Notification sent", notification_id=str(created_notification.id))
        
        return sent_notification
    except Exception as e:
        logger.error("Failed to send notification", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send notification"
        )

@router.post("/bulk", response_model=List[NotificationResponse], status_code=status.HTTP_201_CREATED)
async def create_bulk_notifications(
    notifications: List[NotificationCreate],
    db=Depends(get_database)
):
    """Create multiple notifications at once"""
    try:
        notification_service = NotificationService(db)
        created_notifications = await notification_service.create_bulk_notifications(notifications)
        
        logger.info("Bulk notifications created", count=len(created_notifications))
        
        return created_notifications
    except Exception as e:
        logger.error("Failed to create bulk notifications", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create bulk notifications"
        )
