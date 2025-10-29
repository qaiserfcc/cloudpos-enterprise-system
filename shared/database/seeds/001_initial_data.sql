-- Seed data for Cloud POS System
-- This file contains initial data for development and testing

-- Insert default tenant
INSERT INTO tenants (id, name, domain, subscription_plan, settings, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Demo Store', 'demo.cloudpos.com', 'enterprise', 
 '{"features": ["multi_store", "analytics", "loyalty", "api_access"], "limits": {"stores": 10, "employees": 100, "transactions_per_month": 50000}}', 
 true);

-- Insert default user roles
INSERT INTO user_roles (id, tenant_id, name, description, permissions, store_ids) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Admin', 'Full system access', 
 '[{"resource": "*", "actions": ["create", "read", "update", "delete", "execute"]}]', '{}'),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Manager', 'Store management access', 
 '[{"resource": "transactions", "actions": ["create", "read", "update"]}, {"resource": "inventory", "actions": ["create", "read", "update"]}, {"resource": "customers", "actions": ["create", "read", "update"]}, {"resource": "reports", "actions": ["read"]}]', '{}'),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Cashier', 'Basic POS operations', 
 '[{"resource": "transactions", "actions": ["create", "read"]}, {"resource": "customers", "actions": ["read", "update"]}, {"resource": "inventory", "actions": ["read"]}]', '{}'),
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'Inventory Manager', 'Inventory management', 
 '[{"resource": "inventory", "actions": ["create", "read", "update"]}, {"resource": "products", "actions": ["create", "read", "update"]}, {"resource": "suppliers", "actions": ["create", "read", "update"]}]', '{}');

-- Insert default admin user (password: Admin123!)
INSERT INTO users (id, tenant_id, email, username, password_hash, first_name, last_name, role_ids, is_active, email_verified) VALUES
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', 'admin@demo.cloudpos.com', 'admin', 
 '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/k0.kcBpQ6', 'System', 'Administrator', 
 '{550e8400-e29b-41d4-a716-446655440001}', true, true);

-- Insert demo stores
INSERT INTO stores (id, tenant_id, name, code, address, phone, email, timezone, currency, tax_rate) VALUES
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440000', 'Main Store', 'MAIN', 
 '{"street": "123 Main Street", "city": "New York", "state": "NY", "country": "USA", "postalCode": "10001", "coordinates": {"latitude": 40.7128, "longitude": -74.0060}}', 
 '+1-555-0123', 'main@demo.cloudpos.com', 'America/New_York', 'USD', 0.0875),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440000', 'Downtown Branch', 'DOWNTOWN', 
 '{"street": "456 Broadway", "city": "New York", "state": "NY", "country": "USA", "postalCode": "10013", "coordinates": {"latitude": 40.7217, "longitude": -74.0050}}', 
 '+1-555-0124', 'downtown@demo.cloudpos.com', 'America/New_York', 'USD', 0.0875);

-- Insert product categories
INSERT INTO product_categories (id, tenant_id, name, description, sort_order) VALUES
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440000', 'Electronics', 'Electronic devices and accessories', 1),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440000', 'Clothing', 'Apparel and fashion items', 2),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440000', 'Home & Garden', 'Home improvement and garden supplies', 3),
('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440000', 'Books', 'Books and educational materials', 4),
('550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440000', 'Food & Beverages', 'Food items and drinks', 5);

-- Insert demo products
INSERT INTO products (id, tenant_id, sku, name, description, category_id, brand, base_price, cost_price, barcode, is_trackable) VALUES
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440000', 'IPHONE15-128', 'iPhone 15 128GB', 'Latest iPhone with 128GB storage', '550e8400-e29b-41d4-a716-446655440030', 'Apple', 799.99, 650.00, '1234567890123', true),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440000', 'SAMSUNG-S24', 'Samsung Galaxy S24', 'Premium Android smartphone', '550e8400-e29b-41d4-a716-446655440030', 'Samsung', 699.99, 550.00, '1234567890124', true),
('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440000', 'TSHIRT-BLUE-M', 'Blue T-Shirt Medium', 'Cotton blue t-shirt, medium size', '550e8400-e29b-41d4-a716-446655440031', 'Generic', 24.99, 12.00, '1234567890125', true),
('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440000', 'COFFEE-PREMIUM', 'Premium Coffee Beans 1kg', 'Arabica coffee beans, premium quality', '550e8400-e29b-41d4-a716-446655440034', 'CoffeeBrand', 34.99, 18.00, '1234567890126', true),
('550e8400-e29b-41d4-a716-446655440044', '550e8400-e29b-41d4-a716-446655440000', 'BOOK-PROG', 'Programming Book', 'Learn programming fundamentals', '550e8400-e29b-41d4-a716-446655440033', 'TechBooks', 49.99, 25.00, '1234567890127', true);

-- Insert inventory for main store
INSERT INTO inventory (product_id, store_id, quantity, reorder_point, max_stock, cost_price) VALUES
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440020', 25, 5, 50, 650.00),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440020', 30, 5, 50, 550.00),
('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440020', 100, 20, 200, 12.00),
('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440020', 50, 10, 100, 18.00),
('550e8400-e29b-41d4-a716-446655440044', '550e8400-e29b-41d4-a716-446655440020', 75, 15, 150, 25.00);

-- Insert inventory for downtown store
INSERT INTO inventory (product_id, store_id, quantity, reorder_point, max_stock, cost_price) VALUES
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440021', 15, 3, 30, 650.00),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440021', 20, 3, 30, 550.00),
('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440021', 60, 15, 120, 12.00),
('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440021', 30, 8, 60, 18.00),
('550e8400-e29b-41d4-a716-446655440044', '550e8400-e29b-41d4-a716-446655440021', 45, 10, 90, 25.00);

-- Insert demo customers
INSERT INTO customers (id, tenant_id, customer_number, email, phone, first_name, last_name, date_of_birth, preferences, total_spent, total_visits) VALUES
('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440000', 'CUST001', 'john.doe@email.com', '+1-555-0201', 'John', 'Doe', '1985-06-15', 
 '{"communicationChannels": ["email", "sms"], "categories": ["Electronics", "Books"]}', 1250.75, 8),
('550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440000', 'CUST002', 'jane.smith@email.com', '+1-555-0202', 'Jane', 'Smith', '1990-03-22', 
 '{"communicationChannels": ["email"], "categories": ["Clothing", "Home & Garden"]}', 850.50, 12),
('550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440000', 'CUST003', 'bob.johnson@email.com', '+1-555-0203', 'Bob', 'Johnson', '1978-11-08', 
 '{"communicationChannels": ["sms"], "categories": ["Food & Beverages", "Electronics"]}', 350.25, 5);

-- Insert loyalty program
INSERT INTO loyalty_programs (id, tenant_id, name, description, points_per_dollar, dollar_per_point, minimum_points_redemption, tiers) VALUES
('550e8400-e29b-41d4-a716-446655440060', '550e8400-e29b-41d4-a716-446655440000', 'VIP Rewards', 'Earn points on every purchase', 1.00, 0.01, 100,
 '[{"name": "Bronze", "minimumPoints": 0, "benefits": ["Basic rewards"], "multiplier": 1.0}, 
   {"name": "Silver", "minimumPoints": 1000, "benefits": ["5% discount", "Priority support"], "multiplier": 1.2}, 
   {"name": "Gold", "minimumPoints": 5000, "benefits": ["10% discount", "Free shipping", "Exclusive offers"], "multiplier": 1.5}]');

-- Insert customer loyalty memberships
INSERT INTO customer_loyalty_memberships (customer_id, program_id, membership_number, points_balance, lifetime_points, tier_level) VALUES
('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440060', 'VIP-001', 1250, 1250, 'Silver'),
('550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440060', 'VIP-002', 850, 850, 'Bronze'),
('550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440060', 'VIP-003', 350, 350, 'Bronze');

-- Insert notification templates
INSERT INTO notification_templates (id, tenant_id, name, type, channels, subject, body, variables) VALUES
('550e8400-e29b-41d4-a716-446655440070', '550e8400-e29b-41d4-a716-446655440000', 'Transaction Receipt', 'receipt', 
 '{email,sms}', 'Your Receipt - {{receiptNumber}}', 
 'Thank you for your purchase! Receipt: {{receiptNumber}}, Total: {{totalAmount}}, Items: {{itemCount}}',
 '[{"name": "receiptNumber", "type": "string", "required": true}, {"name": "totalAmount", "type": "number", "required": true}, {"name": "itemCount", "type": "number", "required": true}]'),
('550e8400-e29b-41d4-a716-446655440071', '550e8400-e29b-41d4-a716-446655440000', 'Low Stock Alert', 'inventory_alert', 
 '{email}', 'Low Stock Alert - {{productName}}', 
 'Product {{productName}} (SKU: {{sku}}) is running low. Current stock: {{currentStock}}, Reorder point: {{reorderPoint}}',
 '[{"name": "productName", "type": "string", "required": true}, {"name": "sku", "type": "string", "required": true}, {"name": "currentStock", "type": "number", "required": true}, {"name": "reorderPoint", "type": "number", "required": true}]');

-- Insert system settings
INSERT INTO system_settings (tenant_id, key, value, description, is_public) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'company_name', '"Demo Store Inc."', 'Company name for receipts and documents', true),
('550e8400-e29b-41d4-a716-446655440000', 'default_currency', '"USD"', 'Default currency for the system', true),
('550e8400-e29b-41d4-a716-446655440000', 'default_tax_rate', '0.0875', 'Default tax rate (8.75%)', false),
('550e8400-e29b-41d4-a716-446655440000', 'loyalty_enabled', 'true', 'Enable loyalty program features', true),
('550e8400-e29b-41d4-a716-446655440000', 'receipt_footer', '"Thank you for shopping with us!"', 'Footer text for receipts', true);

-- Update sequences to avoid conflicts with seed data
SELECT setval(pg_get_serial_sequence('tenants', 'id'), (SELECT MAX(id::text)::integer FROM tenants WHERE id::text ~ '^[0-9]+$') + 1);

COMMIT;