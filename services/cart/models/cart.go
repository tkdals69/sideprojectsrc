package models

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

type Cart struct {
	ID        uuid.UUID  `json:"id" db:"id"`
	UserID    uuid.UUID  `json:"user_id" db:"user_id"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt time.Time  `json:"updated_at" db:"updated_at"`
	Items     []CartItem `json:"items,omitempty"`
}

type CartItem struct {
	ID        uuid.UUID `json:"id" db:"id"`
	CartID    uuid.UUID `json:"cart_id" db:"cart_id"`
	ProductID uuid.UUID `json:"product_id" db:"product_id"`
	Quantity  int       `json:"quantity" db:"quantity"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

type CartWithItems struct {
	Cart
	Items []CartItemWithProduct `json:"items"`
}

type CartItemWithProduct struct {
	CartItem
	ProductName  string  `json:"product_name" db:"product_name"`
	ProductPrice float64 `json:"product_price" db:"product_price"`
	ProductImage string  `json:"product_image" db:"product_image"`
}

type AddItemRequest struct {
	ProductID uuid.UUID `json:"product_id" binding:"required"`
	Quantity  int       `json:"quantity" binding:"required,min=1"`
}

type UpdateItemRequest struct {
	Quantity int `json:"quantity" binding:"required,min=1"`
}

type CartRepository struct {
	db *sql.DB
}

func NewCartRepository(db *sql.DB) *CartRepository {
	return &CartRepository{db: db}
}

func (r *CartRepository) GetOrCreateCart(userID uuid.UUID) (*Cart, error) {
	// Try to get existing cart
	cart, err := r.GetCartByUserID(userID)
	if err == nil && cart != nil {
		return cart, nil
	}

	// Create new cart if not found
	cartID := uuid.New()
	query := `
		INSERT INTO cart_service.carts (id, user_id)
		VALUES ($1, $2)
		RETURNING id, user_id, created_at, updated_at
	`

	var cart Cart
	err = r.db.QueryRow(query, cartID, userID).Scan(
		&cart.ID, &cart.UserID, &cart.CreatedAt, &cart.UpdatedAt,
	)
	if err != nil {
		logrus.Error("Failed to create cart:", err)
		return nil, err
	}

	return &cart, nil
}

func (r *CartRepository) GetCartByUserID(userID uuid.UUID) (*Cart, error) {
	query := `
		SELECT id, user_id, created_at, updated_at
		FROM cart_service.carts
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT 1
	`

	var cart Cart
	err := r.db.QueryRow(query, userID).Scan(
		&cart.ID, &cart.UserID, &cart.CreatedAt, &cart.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		logrus.Error("Failed to get cart:", err)
		return nil, err
	}

	return &cart, nil
}

func (r *CartRepository) GetCartWithItems(userID uuid.UUID) (*CartWithItems, error) {
	// Get cart
	cart, err := r.GetCartByUserID(userID)
	if err != nil {
		return nil, err
	}
	if cart == nil {
		// Create new cart if not exists
		cart, err = r.GetOrCreateCart(userID)
		if err != nil {
			return nil, err
		}
	}

	// Get cart items with product details
	query := `
		SELECT 
			ci.id, ci.cart_id, ci.product_id, ci.quantity, ci.created_at, ci.updated_at,
			p.name as product_name, p.price as product_price, p.image_url as product_image
		FROM cart_service.cart_items ci
		LEFT JOIN catalog_service.products p ON ci.product_id = p.id
		WHERE ci.cart_id = $1
		ORDER BY ci.created_at
	`

	rows, err := r.db.Query(query, cart.ID)
	if err != nil {
		logrus.Error("Failed to get cart items:", err)
		return nil, err
	}
	defer rows.Close()

	var items []CartItemWithProduct
	for rows.Next() {
		var item CartItemWithProduct
		err := rows.Scan(
			&item.ID, &item.CartID, &item.ProductID, &item.Quantity,
			&item.CreatedAt, &item.UpdatedAt,
			&item.ProductName, &item.ProductPrice, &item.ProductImage,
		)
		if err != nil {
			logrus.Error("Failed to scan cart item:", err)
			return nil, err
		}
		items = append(items, item)
	}

	return &CartWithItems{
		Cart:  *cart,
		Items: items,
	}, nil
}

func (r *CartRepository) AddItem(cartID, productID uuid.UUID, quantity int) error {
	// Check if item already exists
	var existingQuantity int
	checkQuery := `
		SELECT quantity FROM cart_service.cart_items
		WHERE cart_id = $1 AND product_id = $2
	`
	err := r.db.QueryRow(checkQuery, cartID, productID).Scan(&existingQuantity)

	if err == sql.ErrNoRows {
		// Insert new item
		insertQuery := `
			INSERT INTO cart_service.cart_items (id, cart_id, product_id, quantity)
			VALUES ($1, $2, $3, $4)
		`
		_, err = r.db.Exec(insertQuery, uuid.New(), cartID, productID, quantity)
	} else if err == nil {
		// Update existing item
		updateQuery := `
			UPDATE cart_service.cart_items
			SET quantity = quantity + $1, updated_at = NOW()
			WHERE cart_id = $2 AND product_id = $3
		`
		_, err = r.db.Exec(updateQuery, quantity, cartID, productID)
	}

	if err != nil {
		logrus.Error("Failed to add cart item:", err)
		return err
	}

	// Update cart timestamp
	updateCartQuery := `UPDATE cart_service.carts SET updated_at = NOW() WHERE id = $1`
	_, err = r.db.Exec(updateCartQuery, cartID)
	return err
}

func (r *CartRepository) UpdateItem(itemID uuid.UUID, quantity int) error {
	query := `
		UPDATE cart_service.cart_items
		SET quantity = $1, updated_at = NOW()
		WHERE id = $2
	`
	result, err := r.db.Exec(query, quantity, itemID)
	if err != nil {
		logrus.Error("Failed to update cart item:", err)
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}

func (r *CartRepository) RemoveItem(itemID uuid.UUID) error {
	query := `DELETE FROM cart_service.cart_items WHERE id = $1`
	result, err := r.db.Exec(query, itemID)
	if err != nil {
		logrus.Error("Failed to remove cart item:", err)
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}

func (r *CartRepository) ClearCart(cartID uuid.UUID) error {
	query := `DELETE FROM cart_service.cart_items WHERE cart_id = $1`
	_, err := r.db.Exec(query, cartID)
	if err != nil {
		logrus.Error("Failed to clear cart:", err)
		return err
	}

	// Update cart timestamp
	updateCartQuery := `UPDATE cart_service.carts SET updated_at = NOW() WHERE id = $1`
	_, err = r.db.Exec(updateCartQuery, cartID)
	return err
}

func (r *CartRepository) GetCartItemCount(userID uuid.UUID) (int, error) {
	query := `
		SELECT COUNT(*)
		FROM cart_service.cart_items ci
		JOIN cart_service.carts c ON ci.cart_id = c.id
		WHERE c.user_id = $1
	`

	var count int
	err := r.db.QueryRow(query, userID).Scan(&count)
	if err != nil {
		logrus.Error("Failed to get cart item count:", err)
		return 0, err
	}

	return count, nil
}

func (r *CartRepository) GetCartItemsForCheckout(userID uuid.UUID) ([]CartItemWithProduct, error) {
	query := `
		SELECT 
			ci.id, ci.cart_id, ci.product_id, ci.quantity, ci.created_at, ci.updated_at,
			p.name as product_name, p.price as product_price, p.image_url as product_image
		FROM cart_service.cart_items ci
		JOIN cart_service.carts c ON ci.cart_id = c.id
		LEFT JOIN catalog_service.products p ON ci.product_id = p.id
		WHERE c.user_id = $1
		ORDER BY ci.created_at
	`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		logrus.Error("Failed to get cart items for checkout:", err)
		return nil, err
	}
	defer rows.Close()

	var items []CartItemWithProduct
	for rows.Next() {
		var item CartItemWithProduct
		err := rows.Scan(
			&item.ID, &item.CartID, &item.ProductID, &item.Quantity,
			&item.CreatedAt, &item.UpdatedAt,
			&item.ProductName, &item.ProductPrice, &item.ProductImage,
		)
		if err != nil {
			logrus.Error("Failed to scan cart item:", err)
			return nil, err
		}
		items = append(items, item)
	}

	return items, nil
}
