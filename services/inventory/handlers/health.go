package handlers

import (
	"net/http"

	"inventory-service/models"

	"github.com/gin-gonic/gin"
)

// HealthCheck returns the health status of the service
func HealthCheck(c *gin.Context) {
	// Test database connection
	if err := models.DB.Ping(); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":   "unhealthy",
			"service":  "inventory-service",
			"database": "unhealthy",
			"error":    err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":   "healthy",
		"service":  "inventory-service",
		"database": "healthy",
	})
}
