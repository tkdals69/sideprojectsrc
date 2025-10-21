from fastapi import FastAPI, HTTPException, Depends, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import structlog
import uvicorn
import os
from contextlib import asynccontextmanager
from typing import List, Optional
import asyncio

from database.connection import get_database
from models.product import ProductCreate, ProductUpdate, ProductResponse
from routes.products import router as products_router
from middleware.logging import setup_logging
from middleware.metrics import setup_metrics

# Configure structured logging
setup_logging()
logger = structlog.get_logger()

# Global database connection
db_connection = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global db_connection
    
    # Startup
    logger.info("Starting catalog service")
    try:
        db_connection = await get_database()
        logger.info("Database connection established")
    except Exception as e:
        logger.error("Failed to connect to database", error=str(e))
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down catalog service")
    if db_connection:
        await db_connection.close()
        logger.info("Database connection closed")

# Create FastAPI application
app = FastAPI(
    title="Catalog Service",
    description="Product catalog microservice for Mini Commerce",
    version="1.0.0",
    lifespan=lifespan
)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["*"]  # Configure appropriately for production
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup metrics
setup_metrics(app)

# Include routers
app.include_router(products_router, prefix="/api/catalog", tags=["products"])

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        if db_connection:
            await db_connection.fetchval("SELECT 1")
            db_status = "healthy"
        else:
            db_status = "unhealthy"
    except Exception as e:
        logger.error("Database health check failed", error=str(e))
        db_status = "unhealthy"
    
    return {
        "status": "healthy" if db_status == "healthy" else "unhealthy",
        "service": "catalog-service",
        "database": db_status,
        "timestamp": "2025-10-19T10:30:00Z"
    }

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "catalog-service",
        "version": "1.0.0",
        "status": "running"
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(
        "Unhandled exception",
        path=request.url.path,
        method=request.method,
        error=str(exc),
        exc_info=True
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred",
            "timestamp": "2025-10-19T10:30:00Z"
        }
    )

if __name__ == "__main__":
    port = int(os.getenv("PORT", 3002))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=os.getenv("ENVIRONMENT") == "development",
        log_level="info"
    )
