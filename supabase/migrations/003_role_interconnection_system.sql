-- Role Interconnection System Migration
-- ======================================
-- Comprehensive database schema for enhanced role interconnections

-- Order Tracking Tables
-- =====================

-- Enhanced order tracking with 11 status stages
CREATE TABLE IF NOT EXISTS order_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE UNIQUE,
  current_status TEXT NOT NULL DEFAULT 'order_placed',
  status_history JSONB DEFAULT '[]'::jsonb,
  estimated_completion_time TIMESTAMPTZ,
  actual_completion_time TIMESTAMPTZ,
  time_estimates JSONB DEFAULT '{
    "preparationTime": 25,
    "riderAssignmentTime": 5,
    "pickupTime": 10,
    "deliveryTime": 20,
    "totalTime": 60
  }'::jsonb,
  visible_to JSONB DEFAULT '{
    "customer": true,
    "restaurant": true,
    "rider": true,
    "admin": true
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Temporary contact visibility during active orders
CREATE TABLE IF NOT EXISTS active_order_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE UNIQUE,
  customer_data JSONB NOT NULL, -- Encrypted customer info
  rider_data JSONB, -- Rider info when assigned
  restaurant_data JSONB NOT NULL, -- Restaurant info
  encryption_key TEXT NOT NULL,
  access_log JSONB DEFAULT '[]'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact access logging for audit
CREATE TABLE IF NOT EXISTS contact_access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  user_id UUID NOT NULL,
  user_role TEXT NOT NULL,
  data_accessed TEXT[] DEFAULT '{}',
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order timeline events
CREATE TABLE IF NOT EXISTS order_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- status_change, message, issue, update
  event_data JSONB NOT NULL,
  actor JSONB NOT NULL, -- {id, role, name}
  is_public BOOLEAN DEFAULT TRUE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_order_timeline_order_id (order_id),
  INDEX idx_order_timeline_timestamp (timestamp)
);

-- Restaurant Capacity Management
-- ==============================

-- Restaurant capacity and availability
CREATE TABLE IF NOT EXISTS restaurant_capacity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE UNIQUE,
  status TEXT DEFAULT 'Available' CHECK (status IN ('Available', 'Busy', 'Closed')),
  active_orders INTEGER DEFAULT 0,
  preparing_orders INTEGER DEFAULT 0,
  average_prep_time INTEGER DEFAULT 25, -- minutes
  busy_threshold INTEGER DEFAULT 10, -- admin adjustable
  auto_reject_threshold INTEGER DEFAULT 20, -- admin adjustable
  manual_status TEXT CHECK (manual_status IN ('Available', 'Busy', 'Closed')),
  manual_status_reason TEXT,
  manual_status_expiry TIMESTAMPTZ,
  historical_capacity JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Capacity events for analytics
CREATE TABLE IF NOT EXISTS capacity_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- order_created, order_accepted, etc.
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_capacity_events_restaurant (restaurant_id),
  INDEX idx_capacity_events_timestamp (timestamp)
);

-- Customer Loyalty & Rewards
-- ===========================

-- Customer loyalty points and preferences
CREATE TABLE IF NOT EXISTS customer_loyalty (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  current_points INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  points_expiry DATE[],
  earn_rates JSONB DEFAULT '{
    "baseRate": 1,
    "bonusMultipliers": {
      "firstOrder": 2,
      "weekendOrders": 1.5,
      "specialEvents": 3
    }
  }'::jsonb,
  redemption_tiers JSONB DEFAULT '[
    {"tierName": "Bronze", "pointsRequired": 100, "discountPercentage": 5, "maxDiscountAmount": 500},
    {"tierName": "Silver", "pointsRequired": 500, "discountPercentage": 10, "maxDiscountAmount": 1000},
    {"tierName": "Gold", "pointsRequired": 1000, "discountPercentage": 15, "maxDiscountAmount": 2000}
  ]'::jsonb,
  stats JSONB DEFAULT '{
    "totalOrders": 0,
    "totalSpent": 0,
    "averageOrderValue": 0
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer badges for gamification
CREATE TABLE IF NOT EXISTS customer_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  badge_data JSONB NOT NULL, -- Complete badge information
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(customer_id, badge_id),
  INDEX idx_customer_badges_customer (customer_id)
);

-- Restaurant Rewards System
-- ==========================

-- Restaurant rewards and performance bonuses
CREATE TABLE IF NOT EXISTS restaurant_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE UNIQUE,
  base_rewards JSONB DEFAULT '{
    "pointsPerOrder": 10,
    "revenueSharePercentage": 90,
    "minimumPayout": 5000
  }'::jsonb,
  performance_bonuses JSONB DEFAULT '{
    "ratingBonus": {"minRating": 4.5, "bonusMultiplier": 1.2},
    "speedBonus": {"avgPrepTime": 20, "bonusPercentage": 5},
    "volumeBonus": [
      {"dailyThreshold": 50, "bonusAmount": 2000},
      {"dailyThreshold": 100, "bonusAmount": 5000}
    ]
  }'::jsonb,
  payout_schedule TEXT DEFAULT 'weekly' CHECK (payout_schedule IN ('daily', 'weekly', 'bi-weekly', 'monthly')),
  next_payout_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  pending_payout DECIMAL(10,2) DEFAULT 0,
  performance_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restaurant badges
CREATE TABLE IF NOT EXISTS restaurant_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  badge_data JSONB NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  UNIQUE(restaurant_id, badge_id),
  INDEX idx_restaurant_badges_restaurant (restaurant_id)
);

-- Rider Incentives System
-- ========================

-- Rider incentives and performance tracking
CREATE TABLE IF NOT EXISTS rider_incentives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rider_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  commission_structure JSONB DEFAULT '{
    "ownBike": {"basePercentage": 90, "minimumFee": 100},
    "companyBike": {"basePercentage": 80, "minimumFee": 100, "bikeMaintenanceDeduction": 5000}
  }'::jsonb,
  performance_incentives JSONB DEFAULT '{
    "ratingBonus": [
      {"minRating": 4.0, "bonusPerDelivery": 50},
      {"minRating": 4.5, "bonusPerDelivery": 100}
    ],
    "speedBonus": {"avgDeliveryTime": 30, "bonusAmount": 100},
    "reliabilityBonus": {"completionRate": 95, "bonusMultiplier": 1.1}
  }'::jsonb,
  targets JSONB DEFAULT '{
    "daily": {"deliveries": 10, "bonus": 500, "progress": 0},
    "weekly": {"deliveries": 60, "bonus": 3000, "progress": 0},
    "monthly": {"deliveries": 200, "bonus": 15000, "progress": 0}
  }'::jsonb,
  earnings JSONB DEFAULT '{
    "today": 0,
    "thisWeek": 0,
    "thisMonth": 0,
    "pending": 0
  }'::jsonb,
  metrics JSONB DEFAULT '{
    "totalDeliveries": 0,
    "avgDeliveryTime": 0,
    "avgRating": 0,
    "completionRate": 100,
    "peakHoursWorked": 0
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rider badges
CREATE TABLE IF NOT EXISTS rider_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rider_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  badge_data JSONB NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(rider_id, badge_id),
  INDEX idx_rider_badges_rider (rider_id)
);

-- Communication System
-- =====================

-- Admin messages with broadcast capabilities
CREATE TABLE IF NOT EXISTS admin_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_admin JSONB NOT NULL, -- {adminId, adminName, adminRole}
  to_data JSONB NOT NULL, -- Recipients configuration
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  category TEXT DEFAULT 'announcement' CHECK (category IN ('announcement', 'alert', 'update', 'promotion', 'support', 'compliance')),
  order_id UUID REFERENCES orders(id),
  attachments JSONB DEFAULT '[]'::jsonb,
  requires_response BOOLEAN DEFAULT FALSE,
  response_options TEXT[],
  action_buttons JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'sent' CHECK (status IN ('draft', 'scheduled', 'sent', 'delivered', 'failed')),
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  read_receipts JSONB DEFAULT '[]'::jsonb,
  stats JSONB DEFAULT '{
    "totalRecipients": 0,
    "delivered": 0,
    "read": 0,
    "responded": 0,
    "failed": 0
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_admin_messages_order (order_id),
  INDEX idx_admin_messages_status (status),
  INDEX idx_admin_messages_priority (priority)
);

-- Support threads for customer-admin communication
CREATE TABLE IF NOT EXISTS support_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_ids UUID[] NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('order_issue', 'payment', 'complaint', 'feedback', 'technical', 'other')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'closed')),
  order_id UUID REFERENCES orders(id),
  restaurant_id UUID REFERENCES restaurants(id),
  rider_id UUID REFERENCES users(id),
  messages JSONB DEFAULT '[]'::jsonb,
  assigned_to UUID, -- Admin ID
  escalated_to UUID, -- Senior admin ID
  resolution JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  
  INDEX idx_support_threads_status (status),
  INDEX idx_support_threads_priority (priority),
  INDEX idx_support_threads_order (order_id)
);

-- Enhanced notifications system
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  type TEXT NOT NULL CHECK (type IN ('order', 'payment', 'promotion', 'system', 'message', 'reward')),
  category TEXT NOT NULL CHECK (category IN ('info', 'success', 'warning', 'error', 'action_required')),
  channels JSONB DEFAULT '{
    "inApp": true,
    "push": false,
    "sms": false,
    "email": false
  }'::jsonb,
  action JSONB, -- {type, target, label}
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ,
  failure_reason TEXT,
  
  INDEX idx_notifications_user (user_id),
  INDEX idx_notifications_status (status),
  INDEX idx_notifications_type (type)
);

-- Notification preferences per user
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  channels JSONB DEFAULT '{
    "inApp": {"enabled": true, "sound": true, "vibration": true},
    "push": {"enabled": true, "token": null, "deviceType": null},
    "sms": {"enabled": true, "phoneVerified": false, "criticalOnly": false},
    "email": {"enabled": true, "emailVerified": false, "digestFrequency": "immediate"}
  }'::jsonb,
  categories JSONB DEFAULT '{
    "orderUpdates": true,
    "paymentAlerts": true,
    "promotions": true,
    "systemUpdates": true,
    "supportMessages": true,
    "rewards": true
  }'::jsonb,
  quiet_hours JSONB DEFAULT '{
    "enabled": false,
    "startTime": "22:00",
    "endTime": "07:00",
    "timezone": "Africa/Lagos",
    "allowUrgent": true
  }'::jsonb,
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'yo', 'ig', 'ha')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Notes System
-- ===================

-- Permanent customer order notes
CREATE TABLE IF NOT EXISTS order_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE UNIQUE,
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  delivery_instructions TEXT DEFAULT '',
  dietary_preferences TEXT DEFAULT '',
  special_requests TEXT DEFAULT '',
  visible_to TEXT[] DEFAULT '{rider,restaurant,admin}',
  is_default BOOLEAN DEFAULT FALSE,
  frequency INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_order_notes_customer (customer_id),
  INDEX idx_order_notes_order (order_id)
);

-- Customer default delivery preferences
CREATE TABLE IF NOT EXISTS customer_default_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  delivery_instructions TEXT DEFAULT '',
  dietary_preferences TEXT DEFAULT '',
  special_requests TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Rating System
-- =======================

-- Comprehensive ratings with category breakdowns
CREATE TABLE IF NOT EXISTS ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL, -- Restaurant or Rider ID
  target_type TEXT NOT NULL CHECK (target_type IN ('restaurant', 'rider')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  categories JSONB DEFAULT '{}'::jsonb, -- Category-specific ratings
  is_anonymous BOOLEAN DEFAULT FALSE,
  is_verified_order BOOLEAN DEFAULT TRUE,
  helpful_votes INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE,
  hidden_reason TEXT,
  moderated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  
  UNIQUE(order_id, target_id, target_type), -- One rating per target per order
  INDEX idx_ratings_target (target_id, target_type),
  INDEX idx_ratings_customer (customer_id),
  INDEX idx_ratings_rating (rating)
);

-- Rating moderation log
CREATE TABLE IF NOT EXISTS rating_moderation_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rating_id UUID REFERENCES ratings(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- hidden, unhidden, deleted
  reason TEXT,
  admin_id UUID NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Reward Transactions
-- ===================

-- All reward transactions across all user types
CREATE TABLE IF NOT EXISTS reward_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('customer', 'restaurant', 'rider')),
  type TEXT NOT NULL CHECK (type IN ('earned', 'redeemed', 'bonus', 'penalty', 'expired')),
  category TEXT NOT NULL CHECK (category IN ('points', 'cash', 'commission', 'discount')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  order_id UUID REFERENCES orders(id),
  promotion_id UUID,
  badge_id TEXT,
  previous_balance DECIMAL(10,2) DEFAULT 0,
  new_balance DECIMAL(10,2) DEFAULT 0,
  approved_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  
  INDEX idx_reward_transactions_user (user_id),
  INDEX idx_reward_transactions_type (type),
  INDEX idx_reward_transactions_order (order_id)
);

-- Admin Reward Control Settings
-- ==============================

-- Global reward system settings (admin configurable)
CREATE TABLE IF NOT EXISTS admin_reward_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  global_settings JSONB DEFAULT '{
    "customerLoyaltyEnabled": true,
    "restaurantRewardsEnabled": true,
    "riderIncentivesEnabled": true,
    "badgeSystemEnabled": true
  }'::jsonb,
  parameters JSONB DEFAULT '{
    "customerPointsRate": 1,
    "customerPointsExpiry": 365,
    "maxDiscountPercentage": 20,
    "restaurantBaseCommission": 10,
    "restaurantBonusPool": 50000,
    "riderBaseCommission": 90,
    "riderBonusPool": 25000,
    "riderPeakHourMultiplier": 1.5
  }'::jsonb,
  active_promotions JSONB DEFAULT '[]'::jsonb,
  reward_analytics JSONB DEFAULT '{
    "totalPointsIssued": 0,
    "totalPointsRedeemed": 0,
    "totalBonusesPaid": 0
  }'::jsonb,
  updated_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Broadcast Campaigns
-- ===================

-- Marketing and communication campaigns
CREATE TABLE IF NOT EXISTS broadcast_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  audience JSONB NOT NULL, -- Target audience configuration
  message JSONB NOT NULL, -- Message content
  channels TEXT[] DEFAULT '{inApp}',
  scheduled_for TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'completed', 'cancelled')),
  results JSONB DEFAULT '{
    "sent": 0,
    "delivered": 0,
    "opened": 0,
    "clicked": 0,
    "converted": 0
  }'::jsonb,
  created_by UUID NOT NULL,
  approved_by UUID,
  budget DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  INDEX idx_broadcast_campaigns_status (status),
  INDEX idx_broadcast_campaigns_created_by (created_by)
);

-- Security & Compliance
-- ======================

-- Data access audit trail
CREATE TABLE IF NOT EXISTS data_access_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL, -- view, edit, delete, export, denied
  resource_type TEXT NOT NULL, -- order, customer, restaurant, rider, message
  resource_id TEXT NOT NULL,
  additional_data JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_data_access_audit_user (user_id),
  INDEX idx_data_access_audit_resource (resource_type, resource_id),
  INDEX idx_data_access_audit_timestamp (timestamp)
);

-- Data backups before deletion
CREATE TABLE IF NOT EXISTS data_backups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_table TEXT NOT NULL,
  backup_data JSONB NOT NULL,
  backup_reason TEXT NOT NULL,
  backed_up_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_data_backups_table (original_table),
  INDEX idx_data_backups_timestamp (backed_up_at)
);

-- Encryption key management
CREATE TABLE IF NOT EXISTS encryption_keys (
  key_id TEXT PRIMARY KEY,
  key_purpose TEXT DEFAULT 'contact_encryption',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data anonymization mapping
CREATE TABLE IF NOT EXISTS anonymization_mapping (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_id UUID NOT NULL,
  anonymized_id TEXT NOT NULL,
  anonymized_fields TEXT[] NOT NULL,
  anonymized_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(original_id),
  INDEX idx_anonymization_mapping_original (original_id)
);

-- Data export requests
CREATE TABLE IF NOT EXISTS data_exports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  export_data JSONB NOT NULL,
  download_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_data_exports_user (user_id),
  INDEX idx_data_exports_expires (expires_at)
);

-- Data deletion log
CREATE TABLE IF NOT EXISTS data_deletion_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL,
  admin_id UUID NOT NULL,
  reason TEXT NOT NULL,
  records_affected INTEGER DEFAULT 0,
  deletion_method TEXT NOT NULL, -- deleted, anonymized
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Update existing tables
-- ======================

-- Add rating fields to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(2,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS category_ratings JSONB DEFAULT '{}'::jsonb;

-- Add rating fields to users table (for riders)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(2,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS category_ratings JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Add capacity tracking to restaurants
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS current_capacity TEXT DEFAULT 'Available',
ADD COLUMN IF NOT EXISTS last_capacity_update TIMESTAMPTZ DEFAULT NOW();

-- Enable RLS (Row Level Security)
-- ================================

-- Enable RLS on sensitive tables
ALTER TABLE active_order_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_incentives ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- =============

-- Active order contacts: Only visible during active orders
CREATE POLICY "active_order_contacts_access" ON active_order_contacts
  FOR ALL USING (
    expires_at > NOW() AND 
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_id 
      AND orders.status IN ('restaurant_accepted', 'preparing', 'ready_for_pickup', 'rider_assigned', 'rider_en_route', 'picked_up', 'out_for_delivery')
    )
  );

-- Customer loyalty: Users can see own data
CREATE POLICY "customer_loyalty_access" ON customer_loyalty
  FOR ALL USING (customer_id = auth.uid());

-- Restaurant rewards: Restaurants can see own data
CREATE POLICY "restaurant_rewards_access" ON restaurant_rewards
  FOR ALL USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

-- Rider incentives: Riders can see own data
CREATE POLICY "rider_incentives_access" ON rider_incentives
  FOR ALL USING (rider_id = auth.uid());

-- Notifications: Users can see own notifications
CREATE POLICY "notifications_access" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- Admin messages: Recipients can view, admins can manage
CREATE POLICY "admin_messages_view" ON admin_messages
  FOR SELECT USING (
    -- Admin can see all
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin') OR
    -- Recipients can see messages addressed to them
    (
      (to_data->>'type' = 'individual' AND (to_data->'individual'->>'userId')::UUID = auth.uid()) OR
      (to_data->>'type' = 'broadcast' AND 
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND 
          CASE 
            WHEN to_data->'broadcast'->>'scope' = 'all_customers' THEN user_type = 'customer'
            WHEN to_data->'broadcast'->>'scope' = 'all_restaurants' THEN user_type = 'restaurant_owner'
            WHEN to_data->'broadcast'->>'scope' = 'all_riders' THEN user_type = 'rider'
            ELSE FALSE
          END
        )
      )
    )
  );

-- Support threads: Participants can access
CREATE POLICY "support_threads_access" ON support_threads
  FOR ALL USING (
    auth.uid() = ANY(participant_ids) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin')
  );

-- Functions and Triggers
-- =======================

-- Function to update order tracking on order status change
CREATE OR REPLACE FUNCTION update_order_tracking()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update order tracking
  INSERT INTO order_tracking (order_id, current_status)
  VALUES (NEW.id, NEW.status)
  ON CONFLICT (order_id) 
  DO UPDATE SET 
    current_status = NEW.status,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for order status updates
DROP TRIGGER IF EXISTS trigger_update_order_tracking ON orders;
CREATE TRIGGER trigger_update_order_tracking
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_order_tracking();

-- Function to clean up expired contacts
CREATE OR REPLACE FUNCTION cleanup_expired_contacts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM active_order_contacts
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  INSERT INTO data_cleanup_log (table_name, records_deleted, timestamp)
  VALUES ('active_order_contacts', deleted_count, NOW());
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update restaurant capacity
CREATE OR REPLACE FUNCTION update_restaurant_capacity()
RETURNS TRIGGER AS $$
BEGIN
  -- Update capacity metrics when order status changes
  UPDATE restaurant_capacity 
  SET 
    active_orders = (
      SELECT COUNT(*) FROM orders 
      WHERE restaurant_id = NEW.restaurant_id 
      AND status IN ('restaurant_accepted', 'preparing', 'ready_for_pickup')
    ),
    preparing_orders = (
      SELECT COUNT(*) FROM orders 
      WHERE restaurant_id = NEW.restaurant_id 
      AND status = 'preparing'
    ),
    updated_at = NOW()
  WHERE restaurant_id = NEW.restaurant_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for restaurant capacity updates
DROP TRIGGER IF EXISTS trigger_update_restaurant_capacity ON orders;
CREATE TRIGGER trigger_update_restaurant_capacity
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_restaurant_capacity();

-- Indexes for Performance
-- =======================

CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status ON orders(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_rider_status ON orders(rider_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_status ON orders(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_ratings_target_rating ON ratings(target_id, target_type, rating);
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_reward_transactions_user_type ON reward_transactions(user_id, type);

-- Initial Data
-- ============

-- Insert default admin reward settings
INSERT INTO admin_reward_settings (
  global_settings,
  parameters,
  updated_by
) VALUES (
  '{
    "customerLoyaltyEnabled": true,
    "restaurantRewardsEnabled": true,
    "riderIncentivesEnabled": true,
    "badgeSystemEnabled": true
  }',
  '{
    "customerPointsRate": 1,
    "customerPointsExpiry": 365,
    "maxDiscountPercentage": 20,
    "restaurantBaseCommission": 10,
    "restaurantBonusPool": 50000,
    "riderBaseCommission": 90,
    "riderBonusPool": 25000,
    "riderPeakHourMultiplier": 1.5
  }',
  '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- Comments
-- ========

COMMENT ON TABLE order_tracking IS 'Enhanced order status tracking with 11 stages visible to all participants';
COMMENT ON TABLE active_order_contacts IS 'Temporary contact information during active orders, auto-deleted after completion';
COMMENT ON TABLE restaurant_capacity IS 'Restaurant availability status with admin-controlled thresholds';
COMMENT ON TABLE customer_loyalty IS 'Customer loyalty points with discount redemption system';
COMMENT ON TABLE restaurant_rewards IS 'Restaurant rewards with admin-adjustable bonuses';
COMMENT ON TABLE rider_incentives IS 'Rider incentive system with performance bonuses';
COMMENT ON TABLE admin_messages IS 'Admin messaging system with broadcast capabilities';
COMMENT ON TABLE support_threads IS 'Customer support communication threads';
COMMENT ON TABLE order_notes IS 'Permanent customer delivery preferences and special instructions';
COMMENT ON TABLE ratings IS 'Rating system with proper role-based visibility';
COMMENT ON TABLE reward_transactions IS 'All reward and incentive transactions across user types';
COMMENT ON TABLE data_access_audit IS 'Security audit trail for data access';
COMMENT ON TABLE data_backups IS 'Backup storage before data deletion';

-- Migration Complete
SELECT 'Role Interconnection System Migration Completed Successfully' AS status;