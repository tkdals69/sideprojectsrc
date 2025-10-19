-- Mini Commerce Database Schema
-- PostgreSQL with schema separation for microservices

-- Create schemas for each service
CREATE SCHEMA IF NOT EXISTS auth_service;
CREATE SCHEMA IF NOT EXISTS catalog_service;
CREATE SCHEMA IF NOT EXISTS cart_service;
CREATE SCHEMA IF NOT EXISTS order_service;
CREATE SCHEMA IF NOT EXISTS inventory_service;
CREATE SCHEMA IF NOT EXISTS payment_service;
CREATE SCHEMA IF NOT EXISTS notification_service;

-- =============================================
-- AUTH SERVICE SCHEMA
-- =============================================
CREATE TABLE auth_service.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_auth_users_email ON auth_service.users(email);
CREATE INDEX idx_auth_users_active ON auth_service.users(is_active);

-- =============================================
-- CATALOG SERVICE SCHEMA
-- =============================================
CREATE TABLE catalog_service.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    image_url VARCHAR(500),
    category VARCHAR(100),
    brand VARCHAR(100),
    sku VARCHAR(100) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_catalog_products_category ON catalog_service.products(category);
CREATE INDEX idx_catalog_products_brand ON catalog_service.products(brand);
CREATE INDEX idx_catalog_products_active ON catalog_service.products(is_active);
CREATE INDEX idx_catalog_products_sku ON catalog_service.products(sku);

-- =============================================
-- CART SERVICE SCHEMA
-- =============================================
CREATE TABLE cart_service.carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cart_service.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES cart_service.carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart_id ON cart_service.cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_service.cart_items(product_id);

-- =============================================
-- ORDER SERVICE SCHEMA
-- =============================================
CREATE TABLE order_service.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    saga_state VARCHAR(50) DEFAULT 'orchestrating' CHECK (saga_state IN ('orchestrating', 'compensating', 'completed', 'failed')),
    shipping_address JSONB,
    billing_address JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_service.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES order_service.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON order_service.orders(user_id);
CREATE INDEX idx_orders_status ON order_service.orders(status);
CREATE INDEX idx_orders_saga_state ON order_service.orders(saga_state);
CREATE INDEX idx_order_items_order_id ON order_service.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_service.order_items(product_id);

-- =============================================
-- INVENTORY SERVICE SCHEMA
-- =============================================
CREATE TABLE inventory_service.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL UNIQUE,
    available_quantity INTEGER NOT NULL DEFAULT 0 CHECK (available_quantity >= 0),
    reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    total_quantity INTEGER GENERATED ALWAYS AS (available_quantity + reserved_quantity) STORED,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE inventory_service.reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'confirmed', 'released', 'expired')),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_inventory_product_id ON inventory_service.inventory(product_id);
CREATE INDEX idx_inventory_available ON inventory_service.inventory(available_quantity);
CREATE INDEX idx_reservations_order_id ON inventory_service.reservations(order_id);
CREATE INDEX idx_reservations_product_id ON inventory_service.reservations(product_id);
CREATE INDEX idx_reservations_status ON inventory_service.reservations(status);
CREATE INDEX idx_reservations_expires ON inventory_service.reservations(expires_at);

-- =============================================
-- PAYMENT SERVICE SCHEMA
-- =============================================
CREATE TABLE payment_service.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
    payment_method VARCHAR(50) NOT NULL,
    payment_reference VARCHAR(255),
    failure_reason TEXT,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_order_id ON payment_service.transactions(order_id);
CREATE INDEX idx_payments_status ON payment_service.transactions(status);
CREATE INDEX idx_payments_method ON payment_service.transactions(payment_method);

-- =============================================
-- NOTIFICATION SERVICE SCHEMA
-- =============================================
CREATE TABLE notification_service.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    order_id UUID,
    type VARCHAR(50) NOT NULL CHECK (type IN ('order_created', 'order_processing', 'order_completed', 'order_failed', 'payment_success', 'payment_failed')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
    channel VARCHAR(50) NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'sms', 'push', 'in_app')),
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notification_service.notifications(user_id);
CREATE INDEX idx_notifications_order_id ON notification_service.notifications(order_id);
CREATE INDEX idx_notifications_type ON notification_service.notifications(type);
CREATE INDEX idx_notifications_status ON notification_service.notifications(status);
CREATE INDEX idx_notifications_channel ON notification_service.notifications(channel);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_auth_users_updated_at BEFORE UPDATE ON auth_service.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_catalog_products_updated_at BEFORE UPDATE ON catalog_service.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_carts_updated_at BEFORE UPDATE ON cart_service.carts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_service.cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON order_service.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory_service.inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON inventory_service.reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payment_service.transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- VIEWS FOR CROSS-SERVICE QUERIES
-- =============================================

-- Order details with user and product information
CREATE VIEW order_service.order_details AS
SELECT 
    o.id as order_id,
    o.user_id,
    u.email as user_email,
    u.first_name,
    u.last_name,
    o.status,
    o.total_amount,
    o.saga_state,
    o.created_at,
    oi.product_id,
    oi.product_name,
    oi.quantity,
    oi.unit_price,
    oi.total_price
FROM order_service.orders o
LEFT JOIN auth_service.users u ON o.user_id = u.id
LEFT JOIN order_service.order_items oi ON o.id = oi.order_id;

-- Inventory status with product information
CREATE VIEW inventory_service.inventory_status AS
SELECT 
    i.product_id,
    p.name as product_name,
    i.available_quantity,
    i.reserved_quantity,
    i.total_quantity,
    CASE 
        WHEN i.available_quantity = 0 THEN 'out_of_stock'
        WHEN i.available_quantity < 10 THEN 'low_stock'
        ELSE 'in_stock'
    END as stock_status
FROM inventory_service.inventory i
LEFT JOIN catalog_service.products p ON i.product_id = p.id;

-- =============================================
-- GRANTS AND PERMISSIONS
-- =============================================

-- Create application user (for production)
-- CREATE USER mini_commerce_app WITH PASSWORD 'secure_password';
-- GRANT USAGE ON SCHEMA auth_service TO mini_commerce_app;
-- GRANT USAGE ON SCHEMA catalog_service TO mini_commerce_app;
-- GRANT USAGE ON SCHEMA cart_service TO mini_commerce_app;
-- GRANT USAGE ON SCHEMA order_service TO mini_commerce_app;
-- GRANT USAGE ON SCHEMA inventory_service TO mini_commerce_app;
-- GRANT USAGE ON SCHEMA payment_service TO mini_commerce_app;
-- GRANT USAGE ON SCHEMA notification_service TO mini_commerce_app;

-- Grant table permissions
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA auth_service TO mini_commerce_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA catalog_service TO mini_commerce_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA cart_service TO mini_commerce_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA order_service TO mini_commerce_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA inventory_service TO mini_commerce_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA payment_service TO mini_commerce_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA notification_service TO mini_commerce_app;
