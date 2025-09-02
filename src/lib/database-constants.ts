/**
 * VERIFIED DATABASE CONSTANTS
 * ===========================
 * These constants are extracted from LIVE database verification
 * DO NOT modify without re-running verification script
 * 
 * Last verified: 2025-08-31
 * Script: scripts/verify-database-reality.js
 */

// VERIFIED SUPABASE CONNECTION
export const VERIFIED_SUPABASE_URL = 'https://fkcxijuikfsvxgojjbgp.supabase.co'
export const VERIFIED_PROJECT_ID = 'fkcxijuikfsvxgojjbgp'

// VERIFIED TABLE STATUS
export const VERIFIED_TABLES = {
  users: { exists: true, row_count: 18 },
  restaurants: { exists: true, row_count: 8 },  
  menu_items: { exists: true, row_count: 17 },
  orders: { exists: true, row_count: 0 },
  order_items: { exists: true, row_count: 0 }
} as const

// REAL RESTAURANT IDS (from live database)
export const VERIFIED_RESTAURANT_IDS = {
  MAMA_CASS_KITCHEN: '550e8400-e29b-41d4-a716-446655440001',
  DRAGON_WOK_CHINESE: '550e8400-e29b-41d4-a716-446655440002', 
  PIZZA_PARADISE: '550e8400-e29b-41d4-a716-446655440003'
} as const

// REAL MENU ITEM IDS (from live database) 
export const VERIFIED_MENU_ITEM_IDS = {
  SPECIAL_JOLLOF_RICE: '8d36f456-892b-4af2-8d02-b59781820d44',
  POUNDED_YAM_EGUSI: '28c6e176-cc99-4683-b881-dfbe4e463456',
  CATFISH_PEPPER_SOUP: '9b04af74-941c-4e97-9d87-240b01b6d982'
} as const

// REAL USER IDS (from live database)
export const VERIFIED_USER_IDS = {
  KEMI_OLATUNJI: '22222222-2222-2222-2222-222222222222',
  TUNDE_BAKARE: '33333333-3333-3333-3333-333333333333',
  NIKE_ADEYEMI: '44444444-4444-4444-4444-444444444444'
} as const

// DATABASE FIELD NAMING (snake_case confirmed)
export const VERIFIED_FIELD_NAMES = {
  FIRST_NAME: 'first_name', // NOT firstName
  LAST_NAME: 'last_name',   // NOT lastName  
  USER_ROLE: 'user_role',
  RESTAURANT_ID: 'restaurant_id',
  MENU_ITEM_ID: 'menu_item_id'
} as const

// VERIFICATION METADATA
export const VERIFICATION_INFO = {
  last_verified: '2025-08-31T11:19:00.652Z',
  verification_script: 'scripts/verify-database-reality.js',
  connection_status: 'connected',
  total_tables_verified: 5
} as const

/**
 * Helper function to check if database verification is recent
 */
export function isDatabaseVerificationRecent(maxAgeHours = 24): boolean {
  const verificationTime = new Date(VERIFICATION_INFO.last_verified)
  const now = new Date()
  const ageHours = (now.getTime() - verificationTime.getTime()) / (1000 * 60 * 60)
  return ageHours < maxAgeHours
}

/**
 * Get verification status for use in development
 */
export function getVerificationStatus() {
  return {
    ...VERIFICATION_INFO,
    is_recent: isDatabaseVerificationRecent(),
    tables_count: Object.keys(VERIFIED_TABLES).length,
    restaurants_count: VERIFIED_TABLES.restaurants.row_count,
    menu_items_count: VERIFIED_TABLES.menu_items.row_count,
    users_count: VERIFIED_TABLES.users.row_count
  }
}