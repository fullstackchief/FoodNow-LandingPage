/**
 * SYSTEM SETTINGS TABLE FOR DYNAMIC PRICING
 * =========================================
 * Table to store configurable system settings including dynamic pricing configuration
 */

-- Create system_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "System settings are readable by authenticated users" ON system_settings
  FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "System settings are manageable by admin users" ON system_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() 
      AND is_active = true
    )
  );

-- Insert default dynamic pricing configuration
INSERT INTO system_settings (key, value, description, category, is_public) VALUES
('dynamic_pricing_config', '{
  "baseServiceFee": 0.10,
  "baseDeliveryFee": 500,
  "minimumOrderAmount": 2000,
  "deliveryRadius": 5,
  "maxSurgeMultiplier": 2.5,
  "minDiscountMultiplier": 0.8,
  "peakHours": {
    "lunch": {"start": 12, "end": 14},
    "dinner": {"start": 18, "end": 21},
    "weekend": {"start": 11, "end": 22}
  },
  "zoneMultipliers": {
    "isolo": 1.0,
    "ikeja": 1.1,
    "vi": 1.2,
    "lekki": 1.15,
    "mainland": 0.95
  }
}', 'Dynamic pricing configuration for FoodNow Lagos', 'pricing', false)
ON CONFLICT (key) DO NOTHING;

-- Add delivery_zone to orders table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'delivery_zone'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivery_zone TEXT;
  END IF;
END $$;

-- Create index for faster zone-based queries
CREATE INDEX IF NOT EXISTS idx_orders_delivery_zone_created 
ON orders(delivery_zone, created_at DESC);

-- Add zone to existing orders (default to 'isolo' for FoodNow's base location)
UPDATE orders 
SET delivery_zone = 'isolo' 
WHERE delivery_zone IS NULL;