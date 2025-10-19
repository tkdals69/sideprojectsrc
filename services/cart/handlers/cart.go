package handlers

import (
	"net/http"

	"cart-service/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

var cartRepo *models.CartRepository

func init() {
	cartRepo = models.NewCartRepository(models.DB)
}

// GetCart retrieves the user's cart with items
func GetCart(c *gin.Context) {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	cart, err := cartRepo.GetCartWithItems(userID)
	if err != nil {
		logrus.Error("Failed to get cart:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve cart"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"cart": cart,
	})
}

// AddItem adds an item to the cart
func AddItem(c *gin.Context) {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req models.AddItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "details": err.Error()})
		return
	}

	// Get or create cart
	cart, err := cartRepo.GetOrCreateCart(userID)
	if err != nil {
		logrus.Error("Failed to get or create cart:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to access cart"})
		return
	}

	// Add item to cart
	err = cartRepo.AddItem(cart.ID, req.ProductID, req.Quantity)
	if err != nil {
		logrus.Error("Failed to add item to cart:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add item to cart"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Item added to cart successfully",
	})
}

// UpdateItem updates the quantity of an item in the cart
func UpdateItem(c *gin.Context) {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	itemIDStr := c.Param("itemId")
	itemID, err := uuid.Parse(itemIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item ID"})
		return
	}

	var req models.UpdateItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "details": err.Error()})
		return
	}

	// Update item quantity
	err = cartRepo.UpdateItem(itemID, req.Quantity)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Item not found in cart"})
			return
		}
		logrus.Error("Failed to update cart item:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update item"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Item updated successfully",
	})
}

// RemoveItem removes an item from the cart
func RemoveItem(c *gin.Context) {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	itemIDStr := c.Param("itemId")
	itemID, err := uuid.Parse(itemIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item ID"})
		return
	}

	// Remove item from cart
	err = cartRepo.RemoveItem(itemID)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Item not found in cart"})
			return
		}
		logrus.Error("Failed to remove cart item:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove item"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Item removed from cart successfully",
	})
}

// ClearCart removes all items from the cart
func ClearCart(c *gin.Context) {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get cart
	cart, err := cartRepo.GetCartByUserID(userID)
	if err != nil {
		logrus.Error("Failed to get cart:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to access cart"})
		return
	}
	if cart == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Cart not found"})
		return
	}

	// Clear cart
	err = cartRepo.ClearCart(cart.ID)
	if err != nil {
		logrus.Error("Failed to clear cart:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear cart"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Cart cleared successfully",
	})
}

// CheckoutCart prepares cart for checkout
func CheckoutCart(c *gin.Context) {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get cart items for checkout
	items, err := cartRepo.GetCartItemsForCheckout(userID)
	if err != nil {
		logrus.Error("Failed to get cart items for checkout:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve cart items"})
		return
	}

	if len(items) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cart is empty"})
		return
	}

	// Calculate total
	var total float64
	for _, item := range items {
		total += item.ProductPrice * float64(item.Quantity)
	}

	c.JSON(http.StatusOK, gin.H{
		"items":   items,
		"total":   total,
		"message": "Cart ready for checkout",
	})
}

// GetCartItemCount returns the number of items in the cart
func GetCartItemCount(c *gin.Context) {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	count, err := cartRepo.GetCartItemCount(userID)
	if err != nil {
		logrus.Error("Failed to get cart item count:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get cart item count"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"count": count,
	})
}

// getUserIDFromContext extracts user ID from JWT token in context
func getUserIDFromContext(c *gin.Context) (uuid.UUID, error) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		return uuid.Nil, gin.Error{Err: nil, Type: gin.ErrorTypePublic}
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		return uuid.Nil, err
	}

	return userID, nil
}
