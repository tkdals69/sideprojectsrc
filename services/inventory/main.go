package main

import (
	"log"
	"os"

	"inventory-service/handlers"
	"inventory-service/middleware"
	"inventory-service/models"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/sirupsen/logrus"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Setup logging
	logrus.SetFormatter(&logrus.JSONFormatter{})
	logrus.SetLevel(logrus.InfoLevel)

	// Initialize database
	db, err := models.InitDB()
	if err != nil {
		logrus.Fatal("Failed to initialize database:", err)
	}
	defer db.Close()

	// Setup Gin router
	router := setupRouter()

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	logrus.Info("Inventory service starting on port ", port)
	if err := router.Run(":" + port); err != nil {
		logrus.Fatal("Failed to start server:", err)
	}
}

func setupRouter() *gin.Engine {
	// Set Gin mode
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()

	// Middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	router.Use(middleware.CORS())
	router.Use(middleware.RequestLogger())
	router.Use(middleware.Metrics())

	// Health check
	router.GET("/health", handlers.HealthCheck)
	router.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// API routes
	api := router.Group("/api/inventory")
	{
		// Inventory management
		api.GET("/", handlers.GetInventory)
		api.GET("/:productId", handlers.GetProductInventory)
		api.POST("/reserve", handlers.ReserveInventory)
		api.POST("/confirm", handlers.ConfirmReservation)
		api.POST("/release", handlers.ReleaseReservation)

		// Inventory operations
		api.PUT("/:productId/stock", handlers.UpdateStock)
		api.GET("/:productId/status", handlers.GetStockStatus)
	}

	return router
}
