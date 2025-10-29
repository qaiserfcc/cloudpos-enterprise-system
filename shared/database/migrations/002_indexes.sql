-- Migration: 002_indexes.sql
-- Description: Create performance indexes for Cloud POS System
-- Created: 2025-10-26

-- Tenants indexes
CREATE INDEX idx_tenants_domain ON tenants(domain);
CREATE INDEX idx_tenants_active ON tenants(is_active);

-- Users indexes
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_last_login ON users(last_login);

-- User roles indexes
CREATE INDEX idx_user_roles_tenant_id ON user_roles(tenant_id);
CREATE INDEX idx_user_roles_name ON user_roles(tenant_id, name);

-- Stores indexes
CREATE INDEX idx_stores_tenant_id ON stores(tenant_id);
CREATE INDEX idx_stores_code ON stores(code);
CREATE INDEX idx_stores_tenant_code ON stores(tenant_id, code);
CREATE INDEX idx_stores_active ON stores(is_active);

-- Product categories indexes
CREATE INDEX idx_product_categories_tenant_id ON product_categories(tenant_id);
CREATE INDEX idx_product_categories_parent_id ON product_categories(parent_id);
CREATE INDEX idx_product_categories_active ON product_categories(is_active);

-- Products indexes
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_tenant_sku ON products(tenant_id, sku);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_barcode ON products(barcode);

-- Full-text search indexes for products
CREATE INDEX idx_products_name_gin ON products USING gin(to_tsvector('english', name));
CREATE INDEX idx_products_description_gin ON products USING gin(to_tsvector('english', description));

-- JSONB indexes for products
CREATE INDEX idx_products_attributes ON products USING gin(attributes);
CREATE INDEX idx_products_variants ON products USING gin(variants);

-- Inventory indexes
CREATE INDEX idx_inventory_product_id ON inventory(product_id);
CREATE INDEX idx_inventory_store_id ON inventory(store_id);
CREATE INDEX idx_inventory_store_product ON inventory(store_id, product_id);
CREATE INDEX idx_inventory_quantity ON inventory(quantity);
CREATE INDEX idx_inventory_reorder_point ON inventory(reorder_point);

-- Stock movements indexes
CREATE INDEX idx_stock_movements_inventory_id ON stock_movements(inventory_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(type);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id);
CREATE INDEX idx_stock_movements_employee_id ON stock_movements(employee_id);

-- Customers indexes
CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_customer_number ON customers(customer_number);
CREATE INDEX idx_customers_active ON customers(is_active);
CREATE INDEX idx_customers_last_visit ON customers(last_visit);

-- Full-text search for customers
CREATE INDEX idx_customers_name_gin ON customers USING gin(to_tsvector('english', first_name || ' ' || last_name));

-- Loyalty programs indexes
CREATE INDEX idx_loyalty_programs_tenant_id ON loyalty_programs(tenant_id);
CREATE INDEX idx_loyalty_programs_active ON loyalty_programs(is_active);

-- Customer loyalty memberships indexes
CREATE INDEX idx_customer_loyalty_customer_id ON customer_loyalty_memberships(customer_id);
CREATE INDEX idx_customer_loyalty_program_id ON customer_loyalty_memberships(program_id);
CREATE INDEX idx_customer_loyalty_membership_number ON customer_loyalty_memberships(membership_number);
CREATE INDEX idx_customer_loyalty_active ON customer_loyalty_memberships(is_active);

-- Transactions indexes
CREATE INDEX idx_transactions_store_id ON transactions(store_id);
CREATE INDEX idx_transactions_employee_id ON transactions(employee_id);
CREATE INDEX idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX idx_transactions_receipt_number ON transactions(receipt_number);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_completed_at ON transactions(completed_at);
CREATE INDEX idx_transactions_store_date ON transactions(store_id, created_at);
CREATE INDEX idx_transactions_employee_date ON transactions(employee_id, created_at);
CREATE INDEX idx_transactions_customer_date ON transactions(customer_id, created_at);

-- Transaction items indexes
CREATE INDEX idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_product_id ON transaction_items(product_id);
CREATE INDEX idx_transaction_items_sku ON transaction_items(sku);

-- Payments indexes
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_method ON payments(method);
CREATE INDEX idx_payments_gateway_transaction_id ON payments(gateway_transaction_id);
CREATE INDEX idx_payments_processed_at ON payments(processed_at);

-- Notification templates indexes
CREATE INDEX idx_notification_templates_tenant_id ON notification_templates(tenant_id);
CREATE INDEX idx_notification_templates_type ON notification_templates(type);
CREATE INDEX idx_notification_templates_active ON notification_templates(is_active);

-- Notification logs indexes
CREATE INDEX idx_notification_logs_template_id ON notification_logs(template_id);
CREATE INDEX idx_notification_logs_recipient ON notification_logs(recipient_type, recipient_id);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_created_at ON notification_logs(created_at);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- System settings indexes
CREATE INDEX idx_system_settings_tenant_id ON system_settings(tenant_id);
CREATE INDEX idx_system_settings_key ON system_settings(tenant_id, key);
CREATE INDEX idx_system_settings_public ON system_settings(is_public);

-- Composite indexes for common queries
CREATE INDEX idx_transactions_store_status_date ON transactions(store_id, status, created_at);
CREATE INDEX idx_inventory_low_stock ON inventory(store_id, quantity, reorder_point) WHERE quantity <= reorder_point;
CREATE INDEX idx_products_category_active ON products(category_id, is_active);
CREATE INDEX idx_customers_tenant_active ON customers(tenant_id, is_active);