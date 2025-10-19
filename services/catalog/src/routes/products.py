from fastapi import APIRouter, HTTPException, Depends, Query, Path, status
from typing import List, Optional
import structlog
from datetime import datetime
import uuid

from models.product import (
    Product, ProductCreate, ProductUpdate, ProductResponse, 
    ProductListResponse, ProductSearchParams, ProductStats
)
from database.connection import get_database
from middleware.auth import get_current_user

router = APIRouter()
logger = structlog.get_logger()

@router.get("/", response_model=ProductListResponse)
async def get_products(
    query: Optional[str] = Query(None, description="Search query"),
    category: Optional[str] = Query(None, description="Filter by category"),
    brand: Optional[str] = Query(None, description="Filter by brand"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", regex="^(asc|desc)$", description="Sort order"),
    db=Depends(get_database)
):
    """Get paginated list of products with filtering and search"""
    try:
        # Build WHERE clause
        where_conditions = []
        params = []
        param_count = 0

        if query:
            param_count += 1
            where_conditions.append(f"""
                (name ILIKE ${param_count} OR description ILIKE ${param_count} OR sku ILIKE ${param_count})
            """)
            params.append(f"%{query}%")

        if category:
            param_count += 1
            where_conditions.append(f"category = ${param_count}")
            params.append(category)

        if brand:
            param_count += 1
            where_conditions.append(f"brand = ${param_count}")
            params.append(brand)

        if min_price is not None:
            param_count += 1
            where_conditions.append(f"price >= ${param_count}")
            params.append(min_price)

        if max_price is not None:
            param_count += 1
            where_conditions.append(f"price <= ${param_count}")
            params.append(max_price)

        if is_active is not None:
            param_count += 1
            where_conditions.append(f"is_active = ${param_count}")
            params.append(is_active)

        where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"

        # Validate sort field
        allowed_sort_fields = ['name', 'price', 'created_at', 'updated_at']
        if sort_by not in allowed_sort_fields:
            sort_by = 'created_at'

        # Get total count
        count_query = f"""
            SELECT COUNT(*) 
            FROM catalog_service.products 
            WHERE {where_clause}
        """
        total = await db.fetchval(count_query, *params)

        # Calculate pagination
        offset = (page - 1) * per_page
        total_pages = (total + per_page - 1) // per_page

        # Get products
        products_query = f"""
            SELECT id, name, description, price, image_url, category, brand, sku, is_active, created_at, updated_at
            FROM catalog_service.products 
            WHERE {where_clause}
            ORDER BY {sort_by} {sort_order.upper()}
            LIMIT ${param_count + 1} OFFSET ${param_count + 2}
        """
        params.extend([per_page, offset])

        rows = await db.fetch(products_query, *params)
        
        products = []
        for row in rows:
            products.append(ProductResponse(
                id=row['id'],
                name=row['name'],
                description=row['description'],
                price=row['price'],
                image_url=row['image_url'],
                category=row['category'],
                brand=row['brand'],
                sku=row['sku'],
                is_active=row['is_active'],
                created_at=row['created_at'],
                updated_at=row['updated_at']
            ))

        logger.info(
            "Products retrieved",
            total=total,
            page=page,
            per_page=per_page,
            filters={
                "query": query,
                "category": category,
                "brand": brand,
                "is_active": is_active
            }
        )

        return ProductListResponse(
            products=products,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )

    except Exception as e:
        logger.error("Failed to get products", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve products"
        )

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: uuid.UUID = Path(..., description="Product ID"),
    db=Depends(get_database)
):
    """Get a specific product by ID"""
    try:
        query = """
            SELECT id, name, description, price, image_url, category, brand, sku, is_active, created_at, updated_at
            FROM catalog_service.products 
            WHERE id = $1
        """
        row = await db.fetchrow(query, product_id)

        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )

        logger.info("Product retrieved", product_id=str(product_id))

        return ProductResponse(
            id=row['id'],
            name=row['name'],
            description=row['description'],
            price=row['price'],
            image_url=row['image_url'],
            category=row['category'],
            brand=row['brand'],
            sku=row['sku'],
            is_active=row['is_active'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get product", product_id=str(product_id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve product"
        )

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product: ProductCreate,
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    """Create a new product (admin only)"""
    try:
        # Check for duplicate SKU if provided
        if product.sku:
            existing = await db.fetchrow(
                "SELECT id FROM catalog_service.products WHERE sku = $1",
                product.sku
            )
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Product with this SKU already exists"
                )

        # Insert new product
        query = """
            INSERT INTO catalog_service.products 
            (id, name, description, price, image_url, category, brand, sku, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, name, description, price, image_url, category, brand, sku, is_active, created_at, updated_at
        """
        
        product_id = uuid.uuid4()
        row = await db.fetchrow(
            query,
            product_id,
            product.name,
            product.description,
            product.price,
            product.image_url,
            product.category,
            product.brand,
            product.sku,
            product.is_active
        )

        logger.info("Product created", product_id=str(product_id), name=product.name)

        return ProductResponse(
            id=row['id'],
            name=row['name'],
            description=row['description'],
            price=row['price'],
            image_url=row['image_url'],
            category=row['category'],
            brand=row['brand'],
            sku=row['sku'],
            is_active=row['is_active'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to create product", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create product"
        )

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: uuid.UUID = Path(..., description="Product ID"),
    product_update: ProductUpdate = ...,
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    """Update a product (admin only)"""
    try:
        # Check if product exists
        existing = await db.fetchrow(
            "SELECT id FROM catalog_service.products WHERE id = $1",
            product_id
        )
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )

        # Check for duplicate SKU if updating SKU
        if product_update.sku:
            sku_exists = await db.fetchrow(
                "SELECT id FROM catalog_service.products WHERE sku = $1 AND id != $2",
                product_update.sku, product_id
            )
            if sku_exists:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Product with this SKU already exists"
                )

        # Build update query
        update_fields = []
        params = []
        param_count = 0

        for field, value in product_update.dict(exclude_unset=True).items():
            if value is not None:
                param_count += 1
                update_fields.append(f"{field} = ${param_count}")
                params.append(value)

        if not update_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )

        # Add updated_at
        param_count += 1
        update_fields.append(f"updated_at = NOW()")
        params.extend([product_id])

        query = f"""
            UPDATE catalog_service.products 
            SET {', '.join(update_fields)}
            WHERE id = ${param_count + 1}
            RETURNING id, name, description, price, image_url, category, brand, sku, is_active, created_at, updated_at
        """

        row = await db.fetchrow(query, *params)

        logger.info("Product updated", product_id=str(product_id))

        return ProductResponse(
            id=row['id'],
            name=row['name'],
            description=row['description'],
            price=row['price'],
            image_url=row['image_url'],
            category=row['category'],
            brand=row['brand'],
            sku=row['sku'],
            is_active=row['is_active'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update product", product_id=str(product_id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update product"
        )

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: uuid.UUID = Path(..., description="Product ID"),
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    """Delete a product (admin only)"""
    try:
        # Check if product exists
        existing = await db.fetchrow(
            "SELECT id FROM catalog_service.products WHERE id = $1",
            product_id
        )
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )

        # Soft delete (set is_active to false)
        await db.execute(
            "UPDATE catalog_service.products SET is_active = false, updated_at = NOW() WHERE id = $1",
            product_id
        )

        logger.info("Product deleted", product_id=str(product_id))

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete product", product_id=str(product_id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete product"
        )

@router.get("/stats/overview", response_model=ProductStats)
async def get_product_stats(db=Depends(get_database)):
    """Get product statistics"""
    try:
        # Get basic stats
        stats_query = """
            SELECT 
                COUNT(*) as total_products,
                COUNT(CASE WHEN is_active = true THEN 1 END) as active_products,
                COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_products,
                AVG(price) as average_price,
                MIN(price) as min_price,
                MAX(price) as max_price
            FROM catalog_service.products
        """
        stats = await db.fetchrow(stats_query)

        # Get categories
        categories_query = """
            SELECT DISTINCT category 
            FROM catalog_service.products 
            WHERE category IS NOT NULL 
            ORDER BY category
        """
        categories = await db.fetch(categories_query)

        # Get brands
        brands_query = """
            SELECT DISTINCT brand 
            FROM catalog_service.products 
            WHERE brand IS NOT NULL 
            ORDER BY brand
        """
        brands = await db.fetch(brands_query)

        logger.info("Product stats retrieved")

        return ProductStats(
            total_products=stats['total_products'],
            active_products=stats['active_products'],
            inactive_products=stats['inactive_products'],
            categories=[row['category'] for row in categories],
            brands=[row['brand'] for row in brands],
            average_price=float(stats['average_price']) if stats['average_price'] else 0.0,
            min_price=float(stats['min_price']) if stats['min_price'] else 0.0,
            max_price=float(stats['max_price']) if stats['max_price'] else 0.0
        )

    except Exception as e:
        logger.error("Failed to get product stats", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve product statistics"
        )
