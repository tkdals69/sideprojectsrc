import asyncpg
import os
import structlog
from typing import Optional

logger = structlog.get_logger()

# Database connection pool
_pool: Optional[asyncpg.Pool] = None

async def get_database():
    """Get database connection from pool"""
    global _pool
    
    if _pool is None:
        await create_pool()
    
    return _pool

async def create_pool():
    """Create database connection pool"""
    global _pool
    
    try:
        _pool = await asyncpg.create_pool(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "5432")),
            database=os.getenv("DB_NAME", "mini_commerce"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "password"),
            min_size=1,
            max_size=10,
            command_timeout=30
        )
        logger.info("Database connection pool created")
    except Exception as e:
        logger.error("Failed to create database pool", error=str(e))
        raise

async def close_pool():
    """Close database connection pool"""
    global _pool
    
    if _pool:
        await _pool.close()
        _pool = None
        logger.info("Database connection pool closed")
