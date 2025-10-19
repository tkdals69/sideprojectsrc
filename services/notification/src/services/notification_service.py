import uuid
from datetime import datetime
from typing import List, Optional
import structlog
from models.notification import (
    NotificationCreate, NotificationResponse, NotificationListResponse,
    NotificationStats, NotificationSearchParams, NotificationStatus
)

logger = structlog.get_logger()

class NotificationService:
    def __init__(self, db):
        self.db = db
    
    async def create_notification(self, notification_data: NotificationCreate) -> NotificationResponse:
        """Create a new notification"""
        try:
            query = """
                INSERT INTO notification_service.notifications 
                (id, user_id, order_id, type, title, message, channel, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id, user_id, order_id, type, title, message, channel, status, created_at, sent_at
            """
            
            notification_id = uuid.uuid4()
            values = [
                notification_id,
                notification_data.user_id,
                notification_data.order_id,
                notification_data.type.value,
                notification_data.title,
                notification_data.message,
                notification_data.channel.value,
                notification_data.status.value
            ]
            
            row = await self.db.fetchrow(query, *values)
            
            return NotificationResponse(
                id=row['id'],
                user_id=row['user_id'],
                order_id=row['order_id'],
                type=row['type'],
                title=row['title'],
                message=row['message'],
                channel=row['channel'],
                status=row['status'],
                created_at=row['created_at'],
                sent_at=row['sent_at']
            )
        except Exception as e:
            logger.error("Failed to create notification", error=str(e))
            raise
    
    async def get_notification_by_id(self, notification_id: uuid.UUID) -> Optional[NotificationResponse]:
        """Get notification by ID"""
        try:
            query = """
                SELECT id, user_id, order_id, type, title, message, channel, status, created_at, sent_at
                FROM notification_service.notifications 
                WHERE id = $1
            """
            
            row = await self.db.fetchrow(query, notification_id)
            if not row:
                return None
            
            return NotificationResponse(
                id=row['id'],
                user_id=row['user_id'],
                order_id=row['order_id'],
                type=row['type'],
                title=row['title'],
                message=row['message'],
                channel=row['channel'],
                status=row['status'],
                created_at=row['created_at'],
                sent_at=row['sent_at']
            )
        except Exception as e:
            logger.error("Failed to get notification by ID", notification_id=str(notification_id), error=str(e))
            raise
    
    async def get_notifications(self, search_params: NotificationSearchParams) -> NotificationListResponse:
        """Get paginated notifications with filtering"""
        try:
            # Build WHERE clause
            where_conditions = []
            params = []
            param_count = 0
            
            if search_params.user_id:
                param_count += 1
                where_conditions.append(f"user_id = ${param_count}")
                params.append(search_params.user_id)
            
            if search_params.order_id:
                param_count += 1
                where_conditions.append(f"order_id = ${param_count}")
                params.append(search_params.order_id)
            
            if search_params.type:
                param_count += 1
                where_conditions.append(f"type = ${param_count}")
                params.append(search_params.type.value)
            
            if search_params.status:
                param_count += 1
                where_conditions.append(f"status = ${param_count}")
                params.append(search_params.status.value)
            
            if search_params.channel:
                param_count += 1
                where_conditions.append(f"channel = ${param_count}")
                params.append(search_params.channel.value)
            
            where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
            
            # Get total count
            count_query = f"""
                SELECT COUNT(*) 
                FROM notification_service.notifications 
                WHERE {where_clause}
            """
            total = await self.db.fetchval(count_query, *params)
            
            # Calculate pagination
            offset = (search_params.page - 1) * search_params.per_page
            total_pages = (total + search_params.per_page - 1) // search_params.per_page
            
            # Get notifications
            notifications_query = f"""
                SELECT id, user_id, order_id, type, title, message, channel, status, created_at, sent_at
                FROM notification_service.notifications 
                WHERE {where_clause}
                ORDER BY {search_params.sort_by} {search_params.sort_order.upper()}
                LIMIT ${param_count + 1} OFFSET ${param_count + 2}
            """
            params.extend([search_params.per_page, offset])
            
            rows = await self.db.fetch(notifications_query, *params)
            
            notifications = []
            for row in rows:
                notifications.append(NotificationResponse(
                    id=row['id'],
                    user_id=row['user_id'],
                    order_id=row['order_id'],
                    type=row['type'],
                    title=row['title'],
                    message=row['message'],
                    channel=row['channel'],
                    status=row['status'],
                    created_at=row['created_at'],
                    sent_at=row['sent_at']
                ))
            
            return NotificationListResponse(
                notifications=notifications,
                total=total,
                page=search_params.page,
                per_page=search_params.per_page,
                total_pages=total_pages
            )
        except Exception as e:
            logger.error("Failed to get notifications", error=str(e))
            raise
    
    async def update_notification(
        self, 
        notification_id: uuid.UUID, 
        status: Optional[NotificationStatus] = None,
        sent_at: Optional[datetime] = None
    ) -> NotificationResponse:
        """Update notification"""
        try:
            update_fields = []
            params = []
            param_count = 0
            
            if status is not None:
                param_count += 1
                update_fields.append(f"status = ${param_count}")
                params.append(status.value)
            
            if sent_at is not None:
                param_count += 1
                update_fields.append(f"sent_at = ${param_count}")
                params.append(sent_at)
            
            if not update_fields:
                raise ValueError("No fields to update")
            
            param_count += 1
            params.append(notification_id)
            
            query = f"""
                UPDATE notification_service.notifications 
                SET {', '.join(update_fields)}
                WHERE id = ${param_count}
                RETURNING id, user_id, order_id, type, title, message, channel, status, created_at, sent_at
            """
            
            row = await self.db.fetchrow(query, *params)
            if not row:
                raise ValueError("Notification not found")
            
            return NotificationResponse(
                id=row['id'],
                user_id=row['user_id'],
                order_id=row['order_id'],
                type=row['type'],
                title=row['title'],
                message=row['message'],
                channel=row['channel'],
                status=row['status'],
                created_at=row['created_at'],
                sent_at=row['sent_at']
            )
        except Exception as e:
            logger.error("Failed to update notification", notification_id=str(notification_id), error=str(e))
            raise
    
    async def delete_notification(self, notification_id: uuid.UUID) -> bool:
        """Delete notification"""
        try:
            query = "DELETE FROM notification_service.notifications WHERE id = $1"
            result = await self.db.execute(query, notification_id)
            return result == "DELETE 1"
        except Exception as e:
            logger.error("Failed to delete notification", notification_id=str(notification_id), error=str(e))
            raise
    
    async def send_notification(self, notification_id: uuid.UUID) -> NotificationResponse:
        """Send notification (simulate sending)"""
        try:
            # Get notification
            notification = await self.get_notification_by_id(notification_id)
            if not notification:
                raise ValueError("Notification not found")
            
            # Simulate sending (in real implementation, this would call external services)
            await self.simulate_sending(notification)
            
            # Update status to sent
            updated_notification = await self.update_notification(
                notification_id,
                status=NotificationStatus.SENT,
                sent_at=datetime.now()
            )
            
            logger.info("Notification sent", notification_id=str(notification_id))
            return updated_notification
        except Exception as e:
            logger.error("Failed to send notification", notification_id=str(notification_id), error=str(e))
            # Update status to failed
            await self.update_notification(notification_id, status=NotificationStatus.FAILED)
            raise
    
    async def create_bulk_notifications(self, notifications: List[NotificationCreate]) -> List[NotificationResponse]:
        """Create multiple notifications"""
        try:
            created_notifications = []
            
            for notification_data in notifications:
                notification = await self.create_notification(notification_data)
                created_notifications.append(notification)
            
            logger.info("Bulk notifications created", count=len(created_notifications))
            return created_notifications
        except Exception as e:
            logger.error("Failed to create bulk notifications", error=str(e))
            raise
    
    async def get_notification_stats(self) -> NotificationStats:
        """Get notification statistics"""
        try:
            query = """
                SELECT 
                    COUNT(*) as total_notifications,
                    COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_notifications,
                    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_notifications,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_notifications,
                    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_notifications
                FROM notification_service.notifications
            """
            
            stats = await self.db.fetchrow(query)
            
            total = stats['total_notifications']
            sent = stats['sent_notifications']
            failed = stats['failed_notifications']
            pending = stats['pending_notifications']
            delivered = stats['delivered_notifications']
            
            success_rate = (sent / total * 100) if total > 0 else 0
            failure_rate = (failed / total * 100) if total > 0 else 0
            
            return NotificationStats(
                total_notifications=total,
                sent_notifications=sent,
                failed_notifications=failed,
                pending_notifications=pending,
                delivered_notifications=delivered,
                success_rate=round(success_rate, 2),
                failure_rate=round(failure_rate, 2)
            )
        except Exception as e:
            logger.error("Failed to get notification stats", error=str(e))
            raise
    
    async def simulate_sending(self, notification: NotificationResponse):
        """Simulate sending notification (replace with actual implementation)"""
        # Simulate different sending mechanisms based on channel
        if notification.channel == "email":
            await self.simulate_email_sending(notification)
        elif notification.channel == "sms":
            await self.simulate_sms_sending(notification)
        elif notification.channel == "push":
            await self.simulate_push_sending(notification)
        elif notification.channel == "in_app":
            await self.simulate_in_app_sending(notification)
        
        # Simulate processing delay
        import asyncio
        await asyncio.sleep(0.1)  # 100ms delay
    
    async def simulate_email_sending(self, notification: NotificationResponse):
        """Simulate email sending"""
        logger.info("Simulating email sending", notification_id=str(notification.id))
        # In real implementation, this would call email service
    
    async def simulate_sms_sending(self, notification: NotificationResponse):
        """Simulate SMS sending"""
        logger.info("Simulating SMS sending", notification_id=str(notification.id))
        # In real implementation, this would call SMS service
    
    async def simulate_push_sending(self, notification: NotificationResponse):
        """Simulate push notification sending"""
        logger.info("Simulating push notification sending", notification_id=str(notification.id))
        # In real implementation, this would call push notification service
    
    async def simulate_in_app_sending(self, notification: NotificationResponse):
        """Simulate in-app notification sending"""
        logger.info("Simulating in-app notification sending", notification_id=str(notification.id))
        # In real implementation, this would store in database for in-app display
