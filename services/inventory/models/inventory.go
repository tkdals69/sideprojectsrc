package models

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

type Inventory struct {
	ID                uuid.UUID `json:"id" db:"id"`
	ProductID         uuid.UUID `json:"product_id" db:"product_id"`
	AvailableQuantity int       `json:"available_quantity" db:"available_quantity"`
	ReservedQuantity  int       `json:"reserved_quantity" db:"reserved_quantity"`
	TotalQuantity     int       `json:"total_quantity" db:"total_quantity"`
	CreatedAt         time.Time `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time `json:"updated_at" db:"updated_at"`
}

type Reservation struct {
	ID        uuid.UUID  `json:"id" db:"id"`
	OrderID   uuid.UUID  `json:"order_id" db:"order_id"`
	ProductID uuid.UUID  `json:"product_id" db:"product_id"`
	Quantity  int        `json:"quantity" db:"quantity"`
	Status    string     `json:"status" db:"status"`
	ExpiresAt *time.Time `json:"expires_at" db:"expires_at"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt time.Time  `json:"updated_at" db:"updated_at"`
}

type InventoryRequest struct {
	ProductID uuid.UUID `json:"product_id" binding:"required"`
	Quantity  int       `json:"quantity" binding:"required,min=1"`
}

type ReservationRequest struct {
	OrderID uuid.UUID          `json:"order_id" binding:"required"`
	Items   []InventoryRequest `json:"items" binding:"required"`
}

type ReservationResponse struct {
	ReservationID uuid.UUID         `json:"reservation_id"`
	Reservations  []ReservationData `json:"reservations"`
}

type ReservationData struct {
	ProductID uuid.UUID `json:"product_id"`
	Quantity  int       `json:"quantity"`
	Status    string    `json:"status"`
}

type ConfirmationRequest struct {
	OrderID uuid.UUID `json:"order_id" binding:"required"`
}

type ReleaseRequest struct {
	OrderID uuid.UUID `json:"order_id" binding:"required"`
}

type StockUpdateRequest struct {
	Quantity int `json:"quantity" binding:"required"`
}

type InventoryRepository struct {
	db *sql.DB
}

func NewInventoryRepository(db *sql.DB) *InventoryRepository {
	return &InventoryRepository{db: db}
}

func (r *InventoryRepository) GetInventory() ([]Inventory, error) {
	query := `
		SELECT id, product_id, available_quantity, reserved_quantity, total_quantity, created_at, updated_at
		FROM inventory_service.inventory
		ORDER BY product_id
	`

	rows, err := r.db.Query(query)
	if err != nil {
		logrus.Error("Failed to get inventory:", err)
		return nil, err
	}
	defer rows.Close()

	var inventory []Inventory
	for rows.Next() {
		var item Inventory
		err := rows.Scan(
			&item.ID, &item.ProductID, &item.AvailableQuantity,
			&item.ReservedQuantity, &item.TotalQuantity,
			&item.CreatedAt, &item.UpdatedAt,
		)
		if err != nil {
			logrus.Error("Failed to scan inventory item:", err)
			return nil, err
		}
		inventory = append(inventory, item)
	}

	return inventory, nil
}

func (r *InventoryRepository) GetProductInventory(productID uuid.UUID) (*Inventory, error) {
	query := `
		SELECT id, product_id, available_quantity, reserved_quantity, total_quantity, created_at, updated_at
		FROM inventory_service.inventory
		WHERE product_id = $1
	`

	var item Inventory
	err := r.db.QueryRow(query, productID).Scan(
		&item.ID, &item.ProductID, &item.AvailableQuantity,
		&item.ReservedQuantity, &item.TotalQuantity,
		&item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		logrus.Error("Failed to get product inventory:", err)
		return nil, err
	}

	return &item, nil
}

func (r *InventoryRepository) ReserveInventory(orderID uuid.UUID, items []InventoryRequest) (*ReservationResponse, error) {
	tx, err := r.db.Begin()
	if err != nil {
		logrus.Error("Failed to begin transaction:", err)
		return nil, err
	}
	defer tx.Rollback()

	reservationID := uuid.New()
	var reservations []ReservationData

	for _, item := range items {
		// Check available quantity
		var availableQuantity int
		checkQuery := `
			SELECT available_quantity 
			FROM inventory_service.inventory 
			WHERE product_id = $1
		`
		err := tx.QueryRow(checkQuery, item.ProductID).Scan(&availableQuantity)
		if err != nil {
			if err == sql.ErrNoRows {
				return nil, &InventoryError{Code: "PRODUCT_NOT_FOUND", Message: "Product not found in inventory"}
			}
			logrus.Error("Failed to check inventory:", err)
			return nil, err
		}

		if availableQuantity < item.Quantity {
			return nil, &InventoryError{Code: "INSUFFICIENT_STOCK", Message: "Insufficient stock available"}
		}

		// Update inventory
		updateQuery := `
			UPDATE inventory_service.inventory 
			SET available_quantity = available_quantity - $1,
			    reserved_quantity = reserved_quantity + $1,
			    updated_at = NOW()
			WHERE product_id = $2
		`
		result, err := tx.Exec(updateQuery, item.Quantity, item.ProductID)
		if err != nil {
			logrus.Error("Failed to update inventory:", err)
			return nil, err
		}

		rowsAffected, err := result.RowsAffected()
		if err != nil {
			return nil, err
		}
		if rowsAffected == 0 {
			return nil, &InventoryError{Code: "UPDATE_FAILED", Message: "Failed to update inventory"}
		}

		// Create reservation record
		reservationQuery := `
			INSERT INTO inventory_service.reservations (id, order_id, product_id, quantity, status, expires_at)
			VALUES ($1, $2, $3, $4, $5, $6)
		`
		expiresAt := time.Now().Add(30 * time.Minute) // 30 minutes expiry
		_, err = tx.Exec(reservationQuery, uuid.New(), orderID, item.ProductID, item.Quantity, "reserved", expiresAt)
		if err != nil {
			logrus.Error("Failed to create reservation:", err)
			return nil, err
		}

		reservations = append(reservations, ReservationData{
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
			Status:    "reserved",
		})
	}

	if err := tx.Commit(); err != nil {
		logrus.Error("Failed to commit transaction:", err)
		return nil, err
	}

	return &ReservationResponse{
		ReservationID: reservationID,
		Reservations:  reservations,
	}, nil
}

func (r *InventoryRepository) ConfirmReservation(orderID uuid.UUID) error {
	query := `
		UPDATE inventory_service.reservations 
		SET status = 'confirmed', updated_at = NOW()
		WHERE order_id = $1 AND status = 'reserved'
	`

	result, err := r.db.Exec(query, orderID)
	if err != nil {
		logrus.Error("Failed to confirm reservation:", err)
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return &InventoryError{Code: "NO_RESERVATIONS", Message: "No reservations found for order"}
	}

	return nil
}

func (r *InventoryRepository) ReleaseReservation(orderID uuid.UUID) error {
	tx, err := r.db.Begin()
	if err != nil {
		logrus.Error("Failed to begin transaction:", err)
		return err
	}
	defer tx.Rollback()

	// Get reservations to release
	query := `
		SELECT product_id, quantity 
		FROM inventory_service.reservations 
		WHERE order_id = $1 AND status IN ('reserved', 'confirmed')
	`

	rows, err := tx.Query(query, orderID)
	if err != nil {
		logrus.Error("Failed to get reservations:", err)
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var productID uuid.UUID
		var quantity int
		err := rows.Scan(&productID, &quantity)
		if err != nil {
			logrus.Error("Failed to scan reservation:", err)
			return err
		}

		// Update inventory
		updateQuery := `
			UPDATE inventory_service.inventory 
			SET available_quantity = available_quantity + $1,
			    reserved_quantity = reserved_quantity - $1,
			    updated_at = NOW()
			WHERE product_id = $2
		`
		_, err = tx.Exec(updateQuery, quantity, productID)
		if err != nil {
			logrus.Error("Failed to update inventory:", err)
			return err
		}
	}

	// Update reservation status
	updateReservationQuery := `
		UPDATE inventory_service.reservations 
		SET status = 'released', updated_at = NOW()
		WHERE order_id = $1
	`
	_, err = tx.Exec(updateReservationQuery, orderID)
	if err != nil {
		logrus.Error("Failed to update reservation status:", err)
		return err
	}

	if err := tx.Commit(); err != nil {
		logrus.Error("Failed to commit transaction:", err)
		return err
	}

	return nil
}

func (r *InventoryRepository) UpdateStock(productID uuid.UUID, quantity int) error {
	query := `
		UPDATE inventory_service.inventory 
		SET available_quantity = $1, updated_at = NOW()
		WHERE product_id = $2
	`

	result, err := r.db.Exec(query, quantity, productID)
	if err != nil {
		logrus.Error("Failed to update stock:", err)
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return &InventoryError{Code: "PRODUCT_NOT_FOUND", Message: "Product not found in inventory"}
	}

	return nil
}

func (r *InventoryRepository) GetStockStatus(productID uuid.UUID) (string, error) {
	query := `
		SELECT available_quantity 
		FROM inventory_service.inventory 
		WHERE product_id = $1
	`

	var availableQuantity int
	err := r.db.QueryRow(query, productID).Scan(&availableQuantity)
	if err != nil {
		if err == sql.ErrNoRows {
			return "not_found", nil
		}
		logrus.Error("Failed to get stock status:", err)
		return "", err
	}

	if availableQuantity == 0 {
		return "out_of_stock", nil
	} else if availableQuantity < 10 {
		return "low_stock", nil
	} else {
		return "in_stock", nil
	}
}

// Custom error type
type InventoryError struct {
	Code    string
	Message string
}

func (e *InventoryError) Error() string {
	return e.Message
}
