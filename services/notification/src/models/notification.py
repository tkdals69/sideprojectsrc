from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid

class NotificationType(str, Enum):
    ORDER_CREATED = "order_created"
    ORDER_PROCESSING = "order_processing"
    ORDER_COMPLETED = "order_completed"
    ORDER_FAILED = "order_failed"
    PAYMENT_SUCCESS = "payment_success"
    PAYMENT_FAILED = "payment_failed"
    INVENTORY_LOW = "inventory_low"
    SYSTEM_ALERT = "system_alert"

class NotificationChannel(str, Enum):
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    IN_APP = "in_app"

class NotificationStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    DELIVERED = "delivered"

class NotificationBase(BaseModel):
    """Base notification model with common fields"""
    user_id: uuid.UUID = Field(..., description="User ID")
    order_id: Optional[uuid.UUID] = Field(None, description="Order ID")
    type: NotificationType = Field(..., description="Notification type")
    title: str = Field(..., min_length=1, max_length=255, description="Notification title")
    message: str = Field(..., min_length=1, max_length=1000, description="Notification message")
    channel: NotificationChannel = Field(NotificationChannel.EMAIL, description="Notification channel")
    status: NotificationStatus = Field(NotificationStatus.PENDING, description="Notification status")

    @validator('title')
    def validate_title(cls, v):
        if not v or not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip()

    @validator('message')
    def validate_message(cls, v):
        if not v or not v.strip():
            raise ValueError('Message cannot be empty')
        return v.strip()

class NotificationCreate(NotificationBase):
    """Model for creating a new notification"""
    pass

class NotificationUpdate(BaseModel):
    """Model for updating a notification"""
    status: Optional[NotificationStatus] = None
    sent_at: Optional[datetime] = None

class NotificationResponse(NotificationBase):
    """Model for notification response"""
    id: uuid.UUID
    created_at: datetime
    sent_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_encoders = {
            uuid.UUID: str,
            datetime: lambda v: v.isoformat()
        }

class NotificationListResponse(BaseModel):
    """Model for paginated notification list response"""
    notifications: List[NotificationResponse]
    total: int
    page: int
    per_page: int
    total_pages: int

class NotificationStats(BaseModel):
    """Model for notification statistics"""
    total_notifications: int
    sent_notifications: int
    failed_notifications: int
    pending_notifications: int
    delivered_notifications: int
    success_rate: float
    failure_rate: float

class NotificationSearchParams(BaseModel):
    """Model for notification search parameters"""
    user_id: Optional[uuid.UUID] = Field(None, description="Filter by user ID")
    order_id: Optional[uuid.UUID] = Field(None, description="Filter by order ID")
    type: Optional[NotificationType] = Field(None, description="Filter by notification type")
    status: Optional[NotificationStatus] = Field(None, description="Filter by status")
    channel: Optional[NotificationChannel] = Field(None, description="Filter by channel")
    page: int = Field(1, ge=1, description="Page number")
    per_page: int = Field(20, ge=1, le=100, description="Items per page")
    sort_by: Optional[str] = Field("created_at", description="Sort field")
    sort_order: Optional[str] = Field("desc", regex="^(asc|desc)$", description="Sort order")

    @validator('sort_by')
    def validate_sort_by(cls, v):
        allowed_fields = ['created_at', 'sent_at', 'type', 'status']
        if v not in allowed_fields:
            raise ValueError(f'Sort field must be one of: {", ".join(allowed_fields)}')
        return v
