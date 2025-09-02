-- FoodNow Seed Data Script
-- This script populates the database with initial test data

-- Clear existing test data (be careful in production!)
TRUNCATE TABLE support_messages CASCADE;
TRUNCATE TABLE support_tickets CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE restaurant_payouts CASCADE;
TRUNCATE TABLE rider_payouts CASCADE;
TRUNCATE TABLE payment_transactions CASCADE;
TRUNCATE TABLE delivery_assignments CASCADE;
TRUNCATE TABLE rider_documents CASCADE;
TRUNCATE TABLE rider_details CASCADE;
TRUNCATE TABLE order_notes CASCADE;
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE menu_items CASCADE;
TRUNCATE TABLE restaurants CASCADE;
TRUNCATE TABLE users CASCADE;

-- Insert test users with different roles
-- Password for all test accounts: Test@123456 (you'll need to hash this properly)
INSERT INTO users (id, email, first_name, last_name, phone, user_role, is_active, is_verified, created_at) VALUES
-- Test accounts (bypass verification)
('11111111-1111-1111-1111-111111111111', 'test-customer@foodnow.com', 'Test', 'Customer', '+2341234567890', 'customer', true, true, NOW()),
('22222222-2222-2222-2222-222222222222', 'test-restaurant@foodnow.com', 'Test', 'Restaurant', '+2342234567890', 'restaurant_owner', true, true, NOW()),
('33333333-3333-3333-3333-333333333333', 'test-rider@foodnow.com', 'Test', 'Rider', '+2343234567890', 'rider', true, true, NOW()),
('44444444-4444-4444-4444-444444444444', 'test-admin@foodnow.com', 'Test', 'Admin', '+2344234567890', 'super_admin', true, true, NOW()),

-- Regular users
('55555555-5555-5555-5555-555555555555', 'john.doe@example.com', 'John', 'Doe', '+2345234567890', 'customer', true, true, NOW()),
('66666666-6666-6666-6666-666666666666', 'sarah.johnson@example.com', 'Sarah', 'Johnson', '+2346234567890', 'customer', true, true, NOW()),
('77777777-7777-7777-7777-777777777777', 'mike.adenuga@example.com', 'Mike', 'Adenuga', '+2347234567890', 'customer', true, true, NOW()),

-- Restaurant owners
('88888888-8888-8888-8888-888888888888', 'mamacass@restaurant.com', 'Mama', 'Cass', '+2348234567890', 'restaurant_owner', true, true, NOW()),
('99999999-9999-9999-9999-999999999999', 'northerntaste@restaurant.com', 'Ibrahim', 'Sani', '+2349234567890', 'restaurant_owner', true, true, NOW()),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'igbokitchen@restaurant.com', 'Chioma', 'Okafor', '+2340234567891', 'restaurant_owner', true, true, NOW()),

-- Riders
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'david.okonkwo@rider.com', 'David', 'Okonkwo', '+2341234567891', 'rider', true, true, NOW()),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'peter.ibrahim@rider.com', 'Peter', 'Ibrahim', '+2342234567891', 'rider', true, true, NOW()),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'grace.eze@rider.com', 'Grace', 'Eze', '+2343234567891', 'rider', true, false, NOW()); -- Unverified rider

-- Insert restaurants
INSERT INTO restaurants (id, owner_id, name, description, cuisine_type, address, city, state, phone, email, logo_url, cover_image_url, rating, total_reviews, is_active, opening_time, closing_time, minimum_order, delivery_fee, preparation_time, created_at) VALUES
('rest-1111', '88888888-8888-8888-8888-888888888888', 'Mama Cass Kitchen', 'Authentic Nigerian cuisine with traditional recipes passed down through generations', 'Nigerian', '15 Allen Avenue, Ikeja', 'Lagos', 'Lagos', '+2348234567890', 'info@mamacass.com', '/images/restaurants/mamacass-logo.jpg', '/images/restaurants/mamacass-cover.jpg', 4.5, 234, true, '08:00', '22:00', 2000, 500, 25, NOW()),

('rest-2222', '99999999-9999-9999-9999-999999999999', 'Northern Taste', 'Specializing in authentic Northern Nigerian delicacies', 'Northern Nigerian', '8 Garki District, Victoria Island', 'Lagos', 'Lagos', '+2349234567890', 'info@northerntaste.com', '/images/restaurants/northern-logo.jpg', '/images/restaurants/northern-cover.jpg', 4.7, 189, true, '09:00', '23:00', 2500, 500, 30, NOW()),

('rest-3333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Igbo Kitchen Delights', 'Traditional Igbo cuisine featuring authentic eastern delicacies', 'Igbo Traditional', '22 Admiralty Way, Lekki Phase 1', 'Lagos', 'Lagos', '+2340234567891', 'info@igbokitchen.com', '/images/restaurants/igbo-logo.jpg', '/images/restaurants/igbo-cover.jpg', 4.8, 156, true, '10:00', '22:00', 1500, 500, 20, NOW()),

('rest-4444', '22222222-2222-2222-2222-222222222222', 'Test Restaurant', 'Test restaurant for development', 'Multi-Cuisine', '1 Test Street, Ikoyi', 'Lagos', 'Lagos', '+2342234567890', 'test@restaurant.com', '/images/restaurants/test-logo.jpg', '/images/restaurants/test-cover.jpg', 5.0, 0, true, '00:00', '23:59', 1000, 300, 15, NOW());

-- Insert menu items for restaurants
INSERT INTO menu_items (id, restaurant_id, name, description, category, base_price, image_url, is_available, preparation_time, dietary_tags, spicy_level, created_at) VALUES
-- Mama Cass Kitchen menu
('menu-1111', 'rest-1111', 'Jollof Rice Special', 'Traditional Nigerian jollof rice with your choice of protein', 'Main Course', 3500, '/images/menu/jollof-rice.jpg', true, 25, ARRAY['Gluten-Free'], 2, NOW()),
('menu-1112', 'rest-1111', 'Pepper Soup', 'Spicy traditional pepper soup with assorted meat', 'Soup', 4200, '/images/menu/pepper-soup.jpg', true, 30, ARRAY['Gluten-Free', 'Dairy-Free'], 4, NOW()),
('menu-1113', 'rest-1111', 'Fried Rice & Chicken', 'Nigerian style fried rice with grilled chicken', 'Main Course', 4000, '/images/menu/fried-rice.jpg', true, 20, ARRAY['Contains Soy'], 1, NOW()),
('menu-1114', 'rest-1111', 'Moin Moin', 'Steamed bean pudding', 'Side', 600, '/images/menu/moin-moin.jpg', true, 15, ARRAY['Vegetarian', 'Gluten-Free'], 0, NOW()),
('menu-1115', 'rest-1111', 'Chapman', 'Refreshing Nigerian cocktail', 'Beverage', 800, '/images/menu/chapman.jpg', true, 5, ARRAY['Non-Alcoholic'], 0, NOW()),

-- Northern Taste menu
('menu-2221', 'rest-2222', 'Tuwo Shinkafa', 'Rice pudding served with miyan kuka', 'Main Course', 3000, '/images/menu/tuwo.jpg', true, 35, ARRAY['Gluten-Free'], 2, NOW()),
('menu-2222', 'rest-2222', 'Suya Platter', 'Grilled spiced meat skewers', 'Appetizer', 2500, '/images/menu/suya.jpg', true, 15, ARRAY['High-Protein'], 3, NOW()),
('menu-2223', 'rest-2222', 'Kilishi', 'Nigerian beef jerky', 'Snack', 1500, '/images/menu/kilishi.jpg', true, 10, ARRAY['High-Protein', 'Gluten-Free'], 2, NOW()),
('menu-2224', 'rest-2222', 'Masa', 'Rice cakes served with sauce', 'Breakfast', 2000, '/images/menu/masa.jpg', true, 20, ARRAY['Vegetarian'], 1, NOW()),
('menu-2225', 'rest-2222', 'Fura da Nono', 'Millet and milk drink', 'Beverage', 1000, '/images/menu/fura.jpg', true, 10, ARRAY['Contains Dairy'], 0, NOW()),

-- Igbo Kitchen menu
('menu-3331', 'rest-3333', 'Ofe Nsala', 'White soup with assorted meat', 'Soup', 5000, '/images/menu/nsala.jpg', true, 40, ARRAY['Gluten-Free'], 1, NOW()),
('menu-3332', 'rest-3333', 'Nkwobi', 'Spiced cow foot in palm oil sauce', 'Appetizer', 4500, '/images/menu/nkwobi.jpg', true, 25, ARRAY['High-Protein'], 3, NOW()),
('menu-3333', 'rest-3333', 'Ugba', 'African salad', 'Salad', 3000, '/images/menu/ugba.jpg', true, 15, ARRAY['Vegetarian'], 2, NOW()),
('menu-3334', 'rest-3333', 'Abacha', 'Cassava flakes with garden egg sauce', 'Main Course', 3500, '/images/menu/abacha.jpg', true, 20, ARRAY['Vegan', 'Gluten-Free'], 1, NOW()),
('menu-3335', 'rest-3333', 'Palm Wine', 'Fresh palm wine', 'Beverage', 1200, '/images/menu/palmwine.jpg', true, 5, ARRAY['Alcoholic'], 0, NOW()),

-- Test Restaurant menu
('menu-test1', 'rest-4444', 'Test Burger', 'Test burger for development', 'Main Course', 2500, '/images/menu/burger.jpg', true, 15, ARRAY['Contains Gluten'], 0, NOW()),
('menu-test2', 'rest-4444', 'Test Pizza', 'Test pizza for development', 'Main Course', 3500, '/images/menu/pizza.jpg', true, 20, ARRAY['Contains Gluten', 'Contains Dairy'], 0, NOW());

-- Insert rider details
INSERT INTO rider_details (rider_id, nin_number, address, vehicle_type, vehicle_make, vehicle_model, vehicle_plate_number, is_available, is_verified, total_deliveries, average_rating, current_balance) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '12345678901', '45 Rider Street, Surulere, Lagos', 'motorcycle', 'Honda', 'CG125', 'LAG-123-RD', true, true, 1847, 4.9, 18500),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '23456789012', '67 Delivery Avenue, Yaba, Lagos', 'motorcycle', 'Yamaha', 'YBR125', 'LAG-456-RD', true, true, 923, 4.7, 12300),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '34567890123', '89 Transport Road, Ikeja, Lagos', 'bicycle', 'Trek', 'FX2', NULL, false, false, 0, 0, 0),
('33333333-3333-3333-3333-333333333333', '99999999999', '1 Test Rider Street, VI, Lagos', 'motorcycle', 'Test', 'Test-Model', 'TEST-001', true, true, 100, 5.0, 50000);

-- Insert rider documents for verified riders
INSERT INTO rider_documents (rider_id, document_type, document_url, document_number, status, verified_by, verified_at) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'nin', '/documents/riders/david-nin.pdf', '12345678901', 'approved', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '30 days'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'guarantor_form', '/documents/riders/david-guarantor.pdf', NULL, 'approved', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '30 days'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'sla', '/documents/riders/david-sla.pdf', NULL, 'approved', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '30 days'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'photo', '/documents/riders/david-photo.jpg', NULL, 'approved', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '30 days'),

('cccccccc-cccc-cccc-cccc-cccccccccccc', 'nin', '/documents/riders/peter-nin.pdf', '23456789012', 'approved', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '25 days'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'guarantor_form', '/documents/riders/peter-guarantor.pdf', NULL, 'approved', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '25 days'),

('dddddddd-dddd-dddd-dddd-dddddddddddd', 'nin', '/documents/riders/grace-nin.pdf', '34567890123', 'pending', NULL, NULL),

('33333333-3333-3333-3333-333333333333', 'nin', '/documents/riders/test-nin.pdf', '99999999999', 'approved', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '1 day');

-- Insert sample orders
INSERT INTO orders (id, user_id, restaurant_id, order_number, subtotal, delivery_fee, tax, total, status, payment_status, payment_method, delivery_address, delivery_instructions, estimated_delivery_time, created_at) VALUES
('order-001', '55555555-5555-5555-5555-555555555555', 'rest-1111', 'ORD-202401-001', 7500, 500, 600, 8600, 'delivered', 'completed', 'card', '15 Customer Street, Lekki Phase 1, Lagos', 'Ring the doorbell twice', '2024-01-20 15:30:00', NOW() - INTERVAL '5 days'),
('order-002', '66666666-6666-6666-6666-666666666666', 'rest-2222', 'ORD-202401-002', 5500, 500, 480, 6480, 'delivered', 'completed', 'cash', '25 Buyer Avenue, Victoria Island, Lagos', 'Call on arrival', '2024-01-20 19:00:00', NOW() - INTERVAL '4 days'),
('order-003', '77777777-7777-7777-7777-777777777777', 'rest-3333', 'ORD-202401-003', 9500, 500, 800, 10800, 'preparing', 'completed', 'card', '35 Client Road, Ikoyi, Lagos', NULL, '2024-01-21 13:00:00', NOW() - INTERVAL '1 hour'),
('order-004', '11111111-1111-1111-1111-111111111111', 'rest-4444', 'ORD-202401-TEST', 6000, 300, 510, 6810, 'pending', 'pending', 'card', '1 Test Street, Lagos', 'Test order', '2024-01-21 14:00:00', NOW() - INTERVAL '10 minutes');

-- Insert order items
INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price, special_instructions) VALUES
('order-001', 'menu-1111', 2, 3500, 7000, 'Extra spicy please'),
('order-001', 'menu-1115', 2, 800, 1600, NULL),
('order-002', 'menu-2221', 1, 3000, 3000, 'Not too spicy'),
('order-002', 'menu-2222', 1, 2500, 2500, NULL),
('order-003', 'menu-3331', 1, 5000, 5000, NULL),
('order-003', 'menu-3332', 1, 4500, 4500, 'Well done'),
('order-004', 'menu-test1', 2, 2500, 5000, 'Test instructions'),
('order-004', 'menu-test2', 1, 3500, 3500, NULL);

-- Insert delivery assignments
INSERT INTO delivery_assignments (order_id, rider_id, status, pickup_address, delivery_address, estimated_distance_km, delivery_fee, rider_commission, assigned_at, accepted_at, picked_up_at, delivered_at) VALUES
('order-001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'delivered', '15 Allen Avenue, Ikeja', '15 Customer Street, Lekki Phase 1', 12.5, 500, 400, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '2 minutes', NOW() - INTERVAL '5 days' + INTERVAL '15 minutes', NOW() - INTERVAL '5 days' + INTERVAL '45 minutes'),
('order-002', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'delivered', '8 Garki District, Victoria Island', '25 Buyer Avenue, Victoria Island', 3.2, 500, 400, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days' + INTERVAL '3 minutes', NOW() - INTERVAL '4 days' + INTERVAL '20 minutes', NOW() - INTERVAL '4 days' + INTERVAL '35 minutes'),
('order-003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'accepted', '22 Admiralty Way, Lekki Phase 1', '35 Client Road, Ikoyi', 5.8, 500, 400, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '55 minutes', NULL, NULL);

-- Insert notifications
INSERT INTO notifications (user_id, type, title, message, order_id, is_read, created_at) VALUES
('55555555-5555-5555-5555-555555555555', 'order', 'Order Delivered', 'Your order from Mama Cass Kitchen has been delivered!', 'order-001', true, NOW() - INTERVAL '5 days'),
('66666666-6666-6666-6666-666666666666', 'order', 'Order Delivered', 'Your order from Northern Taste has been delivered!', 'order-002', true, NOW() - INTERVAL '4 days'),
('77777777-7777-7777-7777-777777777777', 'order', 'Order Being Prepared', 'Your order from Igbo Kitchen Delights is being prepared', 'order-003', false, NOW() - INTERVAL '1 hour'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'delivery', 'New Delivery Assignment', 'You have a new delivery request', 'order-003', false, NOW() - INTERVAL '1 hour');

-- Insert payment transactions
INSERT INTO payment_transactions (order_id, user_id, transaction_reference, payment_method, amount, status, gateway_name, created_at) VALUES
('order-001', '55555555-5555-5555-5555-555555555555', 'PAY-001-' || gen_random_uuid(), 'card', 8600, 'completed', 'paystack', NOW() - INTERVAL '5 days'),
('order-002', '66666666-6666-6666-6666-666666666666', 'PAY-002-' || gen_random_uuid(), 'cash', 6480, 'completed', NULL, NOW() - INTERVAL '4 days'),
('order-003', '77777777-7777-7777-7777-777777777777', 'PAY-003-' || gen_random_uuid(), 'card', 10800, 'completed', 'paystack', NOW() - INTERVAL '1 hour');

-- Insert support tickets
INSERT INTO support_tickets (ticket_number, user_id, user_type, category, subject, description, status, priority, created_at) VALUES
('TKT-2024-0001', '55555555-5555-5555-5555-555555555555', 'customer', 'order_issue', 'Missing item in order', 'I ordered 2 jollof rice but received only 1', 'resolved', 'high', NOW() - INTERVAL '3 days'),
('TKT-2024-0002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'rider', 'payment', 'Payout delay', 'My earnings from last week have not been paid', 'open', 'medium', NOW() - INTERVAL '1 day');

-- Update sequences if needed
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users), true);
SELECT setval('restaurants_id_seq', (SELECT MAX(id) FROM restaurants), true);
SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders), true);

-- Create function to generate test order numbers
CREATE OR REPLACE FUNCTION generate_order_number() RETURNS TEXT AS $$
DECLARE
    order_num TEXT;
BEGIN
    order_num := 'ORD-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate delivery fee based on distance
CREATE OR REPLACE FUNCTION calculate_delivery_fee(distance_km DECIMAL) RETURNS DECIMAL AS $$
DECLARE
    base_fee DECIMAL := 500;
    per_km_fee DECIMAL := 50;
    total_fee DECIMAL;
BEGIN
    total_fee := base_fee + (distance_km * per_km_fee);
    RETURN ROUND(total_fee, 2);
END;
$$ LANGUAGE plpgsql;

COMMIT;