-- Mini Commerce Seed Data
-- Insert sample data for development and testing

-- =============================================
-- AUTH SERVICE - Sample Users
-- =============================================
INSERT INTO auth_service.users (id, email, password_hash, first_name, last_name, phone) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'john.doe@example.com', '$2b$10$rQZ8K9vL3mN4pQ5rS6tU7uV8wX9yZ0aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2yZ3', 'John', 'Doe', '+1234567890'),
('550e8400-e29b-41d4-a716-446655440002', 'jane.smith@example.com', '$2b$10$rQZ8K9vL3mN4pQ5rS6tU7uV8wX9yZ0aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2yZ3', 'Jane', 'Smith', '+1234567891'),
('550e8400-e29b-41d4-a716-446655440003', 'bob.wilson@example.com', '$2b$10$rQZ8K9vL3mN4pQ5rS6tU7uV8wX9yZ0aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2yZ3', 'Bob', 'Wilson', '+1234567892'),
('550e8400-e29b-41d4-a716-446655440004', 'demo@example.com', '$2b$12$ffeYhJLfBjShGKxtlOW8y.n1.bRTBZ/CH.e2uA77VGovSb1ruhWy6', 'Demo', 'User', '+1234567893');

-- =============================================
-- CATALOG SERVICE - Sample Products
-- =============================================
INSERT INTO catalog_service.products (id, name, description, price, image_url, category, brand, sku) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'iPhone 15 Pro', 'Latest iPhone with advanced camera system', 999.99, 'https://example.com/images/iphone15pro.jpg', 'Electronics', 'Apple', 'IPH15PRO-128'),
('650e8400-e29b-41d4-a716-446655440002', 'Samsung Galaxy S24', 'Premium Android smartphone', 899.99, 'https://example.com/images/galaxys24.jpg', 'Electronics', 'Samsung', 'GALS24-256'),
('650e8400-e29b-41d4-a716-446655440003', 'MacBook Air M3', 'Lightweight laptop with M3 chip', 1299.99, 'https://example.com/images/macbookairm3.jpg', 'Computers', 'Apple', 'MBA-M3-256'),
('650e8400-e29b-41d4-a716-446655440004', 'Nike Air Max 270', 'Comfortable running shoes', 150.00, 'https://example.com/images/nikeairmax270.jpg', 'Fashion', 'Nike', 'NAM270-BLK-10'),
('650e8400-e29b-41d4-a716-446655440005', 'Sony WH-1000XM5', 'Noise-cancelling headphones', 399.99, 'https://example.com/images/sonywh1000xm5.jpg', 'Electronics', 'Sony', 'SONY-WH1000XM5'),
('650e8400-e29b-41d4-a716-446655440006', 'Adidas Ultraboost 22', 'High-performance running shoes', 180.00, 'https://example.com/images/adidasultraboost22.jpg', 'Fashion', 'Adidas', 'ADU22-WHT-9'),
('650e8400-e29b-41d4-a716-446655440007', 'Dell XPS 13', 'Ultrabook with Intel i7', 1199.99, 'https://example.com/images/dellxps13.jpg', 'Computers', 'Dell', 'DXP13-I7-512'),
('650e8400-e29b-41d4-a716-446655440008', 'Canon EOS R6', 'Professional mirrorless camera', 2499.99, 'https://example.com/images/canoneosr6.jpg', 'Electronics', 'Canon', 'CAN-R6-BODY'),
('650e8400-e29b-41d4-a716-446655440009', 'Levi''s 501 Jeans', 'Classic straight-fit jeans', 89.99, 'https://example.com/images/levis501.jpg', 'Fashion', 'Levi''s', 'LEV501-BLU-32'),
('650e8400-e29b-41d4-a716-446655440010', 'iPad Pro 12.9"', 'Professional tablet with M2 chip', 1099.99, 'https://example.com/images/ipadpro129.jpg', 'Electronics', 'Apple', 'IPADPRO-128');

-- =============================================
-- INVENTORY SERVICE - Stock Levels
-- =============================================
INSERT INTO inventory_service.inventory (product_id, available_quantity, reserved_quantity) VALUES
('650e8400-e29b-41d4-a716-446655440001', 50, 0),   -- iPhone 15 Pro
('650e8400-e29b-41d4-a716-446655440002', 30, 0),   -- Samsung Galaxy S24
('650e8400-e29b-41d4-a716-446655440003', 25, 0),   -- MacBook Air M3
('650e8400-e29b-41d4-a716-446655440004', 100, 0),  -- Nike Air Max 270
('650e8400-e29b-41d4-a716-446655440005', 40, 0),   -- Sony WH-1000XM5
('650e8400-e29b-41d4-a716-446655440006', 80, 0),   -- Adidas Ultraboost 22
('650e8400-e29b-41d4-a716-446655440007', 15, 0),   -- Dell XPS 13
('650e8400-e29b-41d4-a716-446655440008', 10, 0),   -- Canon EOS R6
('650e8400-e29b-41d4-a716-446655440009', 200, 0),  -- Levi's 501 Jeans
('650e8400-e29b-41d4-a716-446655440010', 35, 0);   -- iPad Pro 12.9"

-- =============================================
-- CART SERVICE - Sample Carts
-- =============================================
INSERT INTO cart_service.carts (id, user_id) VALUES
('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001'), -- John's cart
('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002'); -- Jane's cart

INSERT INTO cart_service.cart_items (cart_id, product_id, quantity) VALUES
('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 1), -- John: iPhone 15 Pro
('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440005', 1), -- John: Sony Headphones
('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440003', 1), -- Jane: MacBook Air M3
('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440009', 2); -- Jane: Levi's Jeans (2 pairs)

-- =============================================
-- ORDER SERVICE - Sample Orders
-- =============================================
INSERT INTO order_service.orders (id, user_id, status, total_amount, saga_state, shipping_address, billing_address) VALUES
('850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'completed', 1399.98, 'completed', 
 '{"street": "123 Main St", "city": "New York", "state": "NY", "zip": "10001", "country": "USA"}',
 '{"street": "123 Main St", "city": "New York", "state": "NY", "zip": "10001", "country": "USA"}'),
('850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'processing', 1479.97, 'orchestrating',
 '{"street": "456 Oak Ave", "city": "Los Angeles", "state": "CA", "zip": "90210", "country": "USA"}',
 '{"street": "456 Oak Ave", "city": "Los Angeles", "state": "CA", "zip": "90210", "country": "USA"}');

INSERT INTO order_service.order_items (order_id, product_id, product_name, quantity, unit_price, total_price) VALUES
-- Order 1 items
('850e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'iPhone 15 Pro', 1, 999.99, 999.99),
('850e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440005', 'Sony WH-1000XM5', 1, 399.99, 399.99),
-- Order 2 items
('850e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440003', 'MacBook Air M3', 1, 1299.99, 1299.99),
('850e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440009', 'Levi''s 501 Jeans', 2, 89.99, 179.98);

-- =============================================
-- PAYMENT SERVICE - Sample Transactions
-- =============================================
INSERT INTO payment_service.transactions (id, order_id, amount, status, payment_method, payment_reference, processed_at) VALUES
('950e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440001', 1399.98, 'success', 'credit_card', 'TXN_CC_123456789', NOW() - INTERVAL '1 day'),
('950e8400-e29b-41d4-a716-446655440002', '850e8400-e29b-41d4-a716-446655440002', 1479.97, 'pending', 'credit_card', 'TXN_CC_987654321', NULL);

-- =============================================
-- NOTIFICATION SERVICE - Sample Notifications
-- =============================================
INSERT INTO notification_service.notifications (user_id, order_id, type, title, message, status, channel, sent_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440001', 'order_completed', 'Order Completed', 'Your order #850e8400 has been successfully completed and shipped!', 'sent', 'email', NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440002', '850e8400-e29b-41d4-a716-446655440002', 'order_processing', 'Order Processing', 'Your order #850e8400 is being processed and will be shipped soon.', 'sent', 'email', NOW() - INTERVAL '2 hours');

-- =============================================
-- INVENTORY RESERVATIONS - Sample Reservations
-- =============================================
INSERT INTO inventory_service.reservations (order_id, product_id, quantity, status, expires_at) VALUES
('850e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 1, 'confirmed', NOW() - INTERVAL '1 day'),
('850e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440005', 1, 'confirmed', NOW() - INTERVAL '1 day'),
('850e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440003', 1, 'reserved', NOW() + INTERVAL '1 hour'),
('850e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440009', 2, 'reserved', NOW() + INTERVAL '1 hour');

-- Update inventory to reflect reservations
UPDATE inventory_service.inventory 
SET available_quantity = available_quantity - 1, reserved_quantity = reserved_quantity + 1
WHERE product_id = '650e8400-e29b-41d4-a716-446655440001';

UPDATE inventory_service.inventory 
SET available_quantity = available_quantity - 1, reserved_quantity = reserved_quantity + 1
WHERE product_id = '650e8400-e29b-41d4-a716-446655440005';

UPDATE inventory_service.inventory 
SET available_quantity = available_quantity - 1, reserved_quantity = reserved_quantity + 1
WHERE product_id = '650e8400-e29b-41d4-a716-446655440003';

UPDATE inventory_service.inventory 
SET available_quantity = available_quantity - 2, reserved_quantity = reserved_quantity + 2
WHERE product_id = '650e8400-e29b-41d4-a716-446655440009';
