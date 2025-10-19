from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
import uuid

class ProductBase(BaseModel):
    """Base product model with common fields"""
    name: str = Field(..., min_length=1, max_length=255, description="Product name")
    description: Optional[str] = Field(None, max_length=2000, description="Product description")
    price: Decimal = Field(..., gt=0, decimal_places=2, description="Product price")
    image_url: Optional[str] = Field(None, max_length=500, description="Product image URL")
    category: Optional[str] = Field(None, max_length=100, description="Product category")
    brand: Optional[str] = Field(None, max_length=100, description="Product brand")
    sku: Optional[str] = Field(None, max_length=100, description="Product SKU")
    is_active: bool = Field(True, description="Product active status")

    @validator('price')
    def validate_price(cls, v):
        if v <= 0:
            raise ValueError('Price must be greater than 0')
        return v

    @validator('image_url')
    def validate_image_url(cls, v):
        if v and not v.startswith(('http://', 'https://')):
            raise ValueError('Image URL must be a valid HTTP/HTTPS URL')
        return v

class ProductCreate(ProductBase):
    """Model for creating a new product"""
    pass

class ProductUpdate(BaseModel):
    """Model for updating a product"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    price: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    image_url: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = Field(None, max_length=100)
    brand: Optional[str] = Field(None, max_length=100)
    sku: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None

    @validator('price')
    def validate_price(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Price must be greater than 0')
        return v

    @validator('image_url')
    def validate_image_url(cls, v):
        if v and not v.startswith(('http://', 'https://')):
            raise ValueError('Image URL must be a valid HTTP/HTTPS URL')
        return v

class ProductResponse(ProductBase):
    """Model for product response"""
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            uuid.UUID: str,
            datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v)
        }

class ProductListResponse(BaseModel):
    """Model for paginated product list response"""
    products: List[ProductResponse]
    total: int
    page: int
    per_page: int
    total_pages: int

class ProductSearchParams(BaseModel):
    """Model for product search parameters"""
    query: Optional[str] = Field(None, description="Search query")
    category: Optional[str] = Field(None, description="Filter by category")
    brand: Optional[str] = Field(None, description="Filter by brand")
    min_price: Optional[Decimal] = Field(None, ge=0, description="Minimum price")
    max_price: Optional[Decimal] = Field(None, ge=0, description="Maximum price")
    is_active: Optional[bool] = Field(None, description="Filter by active status")
    page: int = Field(1, ge=1, description="Page number")
    per_page: int = Field(20, ge=1, le=100, description="Items per page")
    sort_by: Optional[str] = Field("created_at", description="Sort field")
    sort_order: Optional[str] = Field("desc", regex="^(asc|desc)$", description="Sort order")

    @validator('min_price', 'max_price')
    def validate_price_range(cls, v):
        if v is not None and v < 0:
            raise ValueError('Price must be non-negative')
        return v

    @validator('sort_by')
    def validate_sort_by(cls, v):
        allowed_fields = ['name', 'price', 'created_at', 'updated_at']
        if v not in allowed_fields:
            raise ValueError(f'Sort field must be one of: {", ".join(allowed_fields)}')
        return v

class ProductStats(BaseModel):
    """Model for product statistics"""
    total_products: int
    active_products: int
    inactive_products: int
    categories: List[str]
    brands: List[str]
    average_price: float
    min_price: float
    max_price: float
