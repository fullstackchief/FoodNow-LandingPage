-- Rider Assignment System Enhancement
-- ====================================
-- Additional tables and enhancements for intelligent rider assignment

-- Create rider_profiles table for extended rider information
CREATE TABLE IF NOT EXISTS rider_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'inactive')),
  is_online BOOLEAN DEFAULT false,
  current_location JSONB, -- { latitude, longitude, updated_at }
  preferred_zones TEXT[], -- Array of preferred delivery zones
  max_concurrent_orders INTEGER DEFAULT 2,
  bicycle_type VARCHAR(20) CHECK (bicycle_type IN ('own', 'company')),
  bicycle_identifier VARCHAR(100), -- Bicycle name/number
  guarantor_verified BOOLEAN DEFAULT false,
  admin_approved BOOLEAN DEFAULT false,
  documents_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Create rider_assignment_logs table for tracking assignments
CREATE TABLE IF NOT EXISTS rider_assignment_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assignment_type VARCHAR(20) NOT NULL CHECK (assignment_type IN ('automatic', 'manual')),
  assignment_score DECIMAL(5,2), -- Score used for automatic assignment
  assigned_by UUID REFERENCES users(id), -- Admin who made manual assignment
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_rider_assignment_logs_order_id (order_id),
  INDEX idx_rider_assignment_logs_rider_id (rider_id),
  INDEX idx_rider_assignment_logs_assigned_at (assigned_at)
);

-- Create order_ratings table for customer feedback
CREATE TABLE IF NOT EXISTS order_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  rider_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Ratings (1-5 scale)
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  food_rating INTEGER CHECK (food_rating >= 1 AND food_rating <= 5),
  delivery_rating INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
  rider_rating INTEGER CHECK (rider_rating >= 1 AND rider_rating <= 5),
  
  -- Comments
  food_comment TEXT,
  delivery_comment TEXT,
  rider_comment TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(order_id),
  INDEX idx_order_ratings_customer_id (customer_id),
  INDEX idx_order_ratings_restaurant_id (restaurant_id),
  INDEX idx_order_ratings_rider_id (rider_id)
);

-- Create rider_performance_metrics table for caching performance data
CREATE TABLE IF NOT EXISTS rider_performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Performance metrics
  total_deliveries INTEGER DEFAULT 0,
  completed_deliveries INTEGER DEFAULT 0,
  cancelled_deliveries INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0, -- Percentage
  average_delivery_time INTEGER DEFAULT 0, -- Minutes
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  
  -- Time-based metrics
  deliveries_today INTEGER DEFAULT 0,
  deliveries_this_week INTEGER DEFAULT 0,
  deliveries_this_month INTEGER DEFAULT 0,
  
  -- Financial metrics
  total_earnings DECIMAL(10,2) DEFAULT 0,
  earnings_today DECIMAL(10,2) DEFAULT 0,
  earnings_this_week DECIMAL(10,2) DEFAULT 0,
  earnings_this_month DECIMAL(10,2) DEFAULT 0,
  
  -- Last updated
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(rider_id),
  INDEX idx_rider_performance_rider_id (rider_id)
);

-- Create rider_location_history table for tracking movement patterns
CREATE TABLE IF NOT EXISTS rider_location_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  accuracy INTEGER, -- GPS accuracy in meters
  order_id UUID REFERENCES orders(id), -- If location update is related to an order
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_rider_location_history_rider_id (rider_id),
  INDEX idx_rider_location_history_recorded_at (recorded_at),
  INDEX idx_rider_location_history_order_id (order_id)
);

-- Create rider_zones table for delivery zone management
CREATE TABLE IF NOT EXISTS rider_zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  boundaries JSONB NOT NULL, -- GeoJSON polygon defining zone boundaries
  is_active BOOLEAN DEFAULT true,
  delivery_fee_modifier DECIMAL(5,2) DEFAULT 1.0, -- Multiplier for delivery fees
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(name),
  INDEX idx_rider_zones_is_active (is_active)
);

-- Add indexes for better performance on existing tables
CREATE INDEX IF NOT EXISTS idx_orders_rider_id ON orders(rider_id);
CREATE INDEX IF NOT EXISTS idx_orders_status_rider_id ON orders(status, rider_id) WHERE rider_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id_status ON orders(restaurant_id, status);

-- Add rider_assigned_at column to orders table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'rider_assigned_at') THEN
        ALTER TABLE orders ADD COLUMN rider_assigned_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Update restaurants table to include delivery radius if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'delivery_radius') THEN
        ALTER TABLE restaurants ADD COLUMN delivery_radius INTEGER DEFAULT 5000; -- Default 5km radius in meters
    END IF;
END $$;

-- Create functions for automatic updates

-- Function to update rider performance metrics
CREATE OR REPLACE FUNCTION update_rider_performance_metrics(input_rider_id UUID)
RETURNS VOID AS $$
DECLARE
    perf_data RECORD;
BEGIN
    -- Calculate performance metrics from orders and ratings
    SELECT 
        COUNT(*) as total_deliveries,
        COUNT(*) FILTER (WHERE status = 'delivered') as completed_deliveries,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_deliveries,
        COALESCE(AVG(CASE WHEN status = 'delivered' AND delivered_at IS NOT NULL AND rider_assigned_at IS NOT NULL 
                     THEN EXTRACT(EPOCH FROM (delivered_at - rider_assigned_at))/60 END), 0) as avg_delivery_time,
        COALESCE(AVG(or_ratings.rider_rating), 0) as avg_rating,
        COUNT(or_ratings.rider_rating) as total_ratings
    INTO perf_data
    FROM orders o
    LEFT JOIN order_ratings or_ratings ON o.id = or_ratings.order_id
    WHERE o.rider_id = input_rider_id;
    
    -- Update or insert performance metrics
    INSERT INTO rider_performance_metrics (
        rider_id, 
        total_deliveries, 
        completed_deliveries, 
        cancelled_deliveries,
        completion_rate,
        average_delivery_time,
        average_rating,
        total_ratings,
        last_calculated_at
    ) VALUES (
        input_rider_id,
        perf_data.total_deliveries,
        perf_data.completed_deliveries,
        perf_data.cancelled_deliveries,
        CASE WHEN perf_data.total_deliveries > 0 
             THEN (perf_data.completed_deliveries::DECIMAL / perf_data.total_deliveries) * 100 
             ELSE 0 END,
        perf_data.avg_delivery_time,
        perf_data.avg_rating,
        perf_data.total_ratings,
        NOW()
    )
    ON CONFLICT (rider_id) DO UPDATE SET
        total_deliveries = EXCLUDED.total_deliveries,
        completed_deliveries = EXCLUDED.completed_deliveries,
        cancelled_deliveries = EXCLUDED.cancelled_deliveries,
        completion_rate = EXCLUDED.completion_rate,
        average_delivery_time = EXCLUDED.average_delivery_time,
        average_rating = EXCLUDED.average_rating,
        total_ratings = EXCLUDED.total_ratings,
        last_calculated_at = EXCLUDED.last_calculated_at,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to update rider performance when order status changes
CREATE OR REPLACE FUNCTION trigger_update_rider_performance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.rider_id IS NOT NULL AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.rider_id IS DISTINCT FROM NEW.rider_id) THEN
        PERFORM update_rider_performance_metrics(NEW.rider_id);
    END IF;
    
    -- Also update old rider if rider changed
    IF OLD.rider_id IS NOT NULL AND OLD.rider_id IS DISTINCT FROM NEW.rider_id THEN
        PERFORM update_rider_performance_metrics(OLD.rider_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_rider_performance_update ON orders;
CREATE TRIGGER trigger_rider_performance_update
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_rider_performance();

-- Insert some default zones for Lagos
INSERT INTO rider_zones (name, description, boundaries, is_active) VALUES 
('Isolo Central', 'Central Isolo delivery zone', 
 '{"type":"Polygon","coordinates":[[[3.3302,6.5244],[3.3402,6.5244],[3.3402,6.5344],[3.3302,6.5344],[3.3302,6.5244]]]}', 
 true),
('Victoria Island', 'Victoria Island premium zone',
 '{"type":"Polygon","coordinates":[[[3.4000,6.4300],[3.4400,6.4300],[3.4400,6.4500],[3.4000,6.4500],[3.4000,6.4300]]]}',
 true),
('Lekki Phase 1', 'Lekki residential area',
 '{"type":"Polygon","coordinates":[[[3.4500,6.4200],[3.4800,6.4200],[3.4800,6.4400],[3.4500,6.4400],[3.4500,6.4200]]]}',
 true)
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE rider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_assignment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_zones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rider_profiles
CREATE POLICY "Riders can view own profile" ON rider_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Riders can update own profile" ON rider_profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can view all rider profiles" ON rider_profiles FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.user_role = 'admin'
    )
);
CREATE POLICY "System can manage rider profiles" ON rider_profiles FOR ALL USING (
    current_setting('role') = 'service_role'
);

-- RLS Policies for rider_assignment_logs
CREATE POLICY "Riders can view own assignments" ON rider_assignment_logs FOR SELECT USING (rider_id = auth.uid());
CREATE POLICY "Admins can view all assignments" ON rider_assignment_logs FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.user_role = 'admin'
    )
);

-- RLS Policies for order_ratings
CREATE POLICY "Customers can manage own ratings" ON order_ratings FOR ALL USING (customer_id = auth.uid());
CREATE POLICY "Riders can view ratings about them" ON order_ratings FOR SELECT USING (rider_id = auth.uid());
CREATE POLICY "Restaurants can view ratings about them" ON order_ratings FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM restaurants 
        WHERE restaurants.id = order_ratings.restaurant_id 
        AND restaurants.user_id = auth.uid()
    )
);
CREATE POLICY "Admins can view all ratings" ON order_ratings FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.user_role = 'admin'
    )
);

-- RLS Policies for rider_performance_metrics
CREATE POLICY "Riders can view own metrics" ON rider_performance_metrics FOR SELECT USING (rider_id = auth.uid());
CREATE POLICY "Admins can view all metrics" ON rider_performance_metrics FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.user_role = 'admin'
    )
);

-- RLS Policies for rider_location_history
CREATE POLICY "Riders can manage own location history" ON rider_location_history FOR ALL USING (rider_id = auth.uid());
CREATE POLICY "Admins can view location history" ON rider_location_history FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.user_role = 'admin'
    )
);

-- RLS Policies for rider_zones
CREATE POLICY "Everyone can view active zones" ON rider_zones FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage zones" ON rider_zones FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.user_role = 'admin'
    )
);

-- Create updated_at triggers for all tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rider_profiles_updated_at BEFORE UPDATE ON rider_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rider_performance_metrics_updated_at BEFORE UPDATE ON rider_performance_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rider_zones_updated_at BEFORE UPDATE ON rider_zones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON rider_profiles TO authenticated;
GRANT ALL ON rider_assignment_logs TO authenticated;
GRANT ALL ON order_ratings TO authenticated;
GRANT ALL ON rider_performance_metrics TO authenticated;
GRANT ALL ON rider_location_history TO authenticated;
GRANT SELECT ON rider_zones TO authenticated;
GRANT ALL ON rider_zones TO service_role;

-- Create views for easier querying

-- View for rider dashboard with metrics
CREATE OR REPLACE VIEW rider_dashboard_data AS
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone_number,
    rp.status,
    rp.is_online,
    rp.current_location,
    rp.preferred_zones,
    rp.max_concurrent_orders,
    rp.bicycle_type,
    rpm.total_deliveries,
    rpm.completion_rate,
    rpm.average_rating,
    rpm.total_earnings,
    rpm.earnings_today,
    rpm.earnings_this_week,
    rpm.earnings_this_month,
    -- Current active orders count
    (SELECT COUNT(*) FROM orders WHERE rider_id = u.id AND status IN ('rider_assigned', 'picked_up', 'on_the_way')) as active_orders
FROM users u
JOIN rider_profiles rp ON u.id = rp.user_id
LEFT JOIN rider_performance_metrics rpm ON u.id = rpm.rider_id
WHERE u.user_role = 'rider';

-- Grant access to the view
GRANT SELECT ON rider_dashboard_data TO authenticated;

-- View for available orders with restaurant location
CREATE OR REPLACE VIEW available_orders_for_riders AS
SELECT 
    o.id,
    o.order_number,
    o.total,
    o.created_at,
    o.delivery_info,
    r.id as restaurant_id,
    r.name as restaurant_name,
    r.location as restaurant_location,
    r.delivery_radius,
    -- Count of items in order
    (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
FROM orders o
JOIN restaurants r ON o.restaurant_id = r.id
WHERE o.status = 'confirmed' 
AND o.rider_id IS NULL
AND r.is_open = true;

-- Grant access to the view
GRANT SELECT ON available_orders_for_riders TO authenticated;

COMMENT ON TABLE rider_profiles IS 'Extended rider information and preferences';
COMMENT ON TABLE rider_assignment_logs IS 'Log of all rider assignments for analytics';
COMMENT ON TABLE order_ratings IS 'Customer feedback and ratings for orders';
COMMENT ON TABLE rider_performance_metrics IS 'Cached performance metrics for riders';
COMMENT ON TABLE rider_location_history IS 'Historical location data for riders';
COMMENT ON TABLE rider_zones IS 'Delivery zones configuration';