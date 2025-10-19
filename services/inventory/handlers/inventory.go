package handlers

import (
	"net/http"

	"inventory-service/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

var inventoryRepo *models.InventoryRepository

func init() {
	inventoryRepo = models.NewInventoryRepository(models.DB)
}

// GetInventory retrieves all inventory items
func GetInventory(c *gin.Context) {
	inventory, err := inventoryRepo.GetInventory()
	if err != nil {
		logrus.Error("Failed to get inventory:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve inventory"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"inventory": inventory,
	})
}

// GetProductInventory retrieves inventory for a specific product
func GetProductInventory(c *gin.Context) {
	productIDStr := c.Param("productId")
	productID, err := uuid.Parse(productIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	inventory, err := inventoryRepo.GetProductInventory(productID)
	if err != nil {
		logrus.Error("Failed to get product inventory:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve product inventory"})
		return
	}

	if inventory == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found in inventory"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"inventory": inventory,
	})
}

// ReserveInventory reserves inventory for an order
func ReserveInventory(c *gin.Context) {
	var req models.ReservationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "details": err.Error()})
		return
	}

	response, err := inventoryRepo.ReserveInventory(req.OrderID, req.Items)
	if err != nil {
		if inventoryErr, ok := err.(*models.InventoryError); ok {
			switch inventoryErr.Code {
			case "INSUFFICIENT_STOCK":
				c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient stock", "message": inventoryErr.Message})
				return
			case "PRODUCT_NOT_FOUND":
				c.JSON(http.StatusNotFound, gin.H{"error": "Product not found", "message": inventoryErr.Message})
				return
			default:
				c.JSON(http.StatusBadRequest, gin.H{"error": "Reservation failed", "message": inventoryErr.Message})
				return
			}
		}
		logrus.Error("Failed to reserve inventory:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reserve inventory"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "Inventory reserved successfully",
		"reservation_id": response.ReservationID,
		"reservations":   response.Reservations,
	})
}

// ConfirmReservation confirms a reservation
func ConfirmReservation(c *gin.Context) {
	var req models.ConfirmationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "details": err.Error()})
		return
	}

	err := inventoryRepo.ConfirmReservation(req.OrderID)
	if err != nil {
		if inventoryErr, ok := err.(*models.InventoryError); ok {
			c.JSON(http.StatusNotFound, gin.H{"error": "Reservation not found", "message": inventoryErr.Message})
			return
		}
		logrus.Error("Failed to confirm reservation:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to confirm reservation"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Reservation confirmed successfully",
	})
}

// ReleaseReservation releases a reservation
func ReleaseReservation(c *gin.Context) {
	var req models.ReleaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "details": err.Error()})
		return
	}

	err := inventoryRepo.ReleaseReservation(req.OrderID)
	if err != nil {
		logrus.Error("Failed to release reservation:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to release reservation"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Reservation released successfully",
	})
}

// UpdateStock updates stock for a product
func UpdateStock(c *gin.Context) {
	productIDStr := c.Param("productId")
	productID, err := uuid.Parse(productIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var req models.StockUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "details": err.Error()})
		return
	}

	err = inventoryRepo.UpdateStock(productID, req.Quantity)
	if err != nil {
		if inventoryErr, ok := err.(*models.InventoryError); ok {
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found", "message": inventoryErr.Message})
			return
		}
		logrus.Error("Failed to update stock:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update stock"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Stock updated successfully",
	})
}

// GetStockStatus returns stock status for a product
func GetStockStatus(c *gin.Context) {
	productIDStr := c.Param("productId")
	productID, err := uuid.Parse(productIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	status, err := inventoryRepo.GetStockStatus(productID)
	if err != nil {
		logrus.Error("Failed to get stock status:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get stock status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"product_id": productID,
		"status":     status,
	})
}
