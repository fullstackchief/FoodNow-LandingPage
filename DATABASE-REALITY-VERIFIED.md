# VERIFIED SUPABASE DATABASE STATUS
**Generated:** 9/2/2025, 2:58:32 PM
**Verified By:** Live database query script

## 🔗 VERIFIED CONNECTION DETAILS
- **Supabase URL:** `https://fkcxijuikfsvxgojjbgp.supabase.co`
- **Connection Status:** connected
- **Project ID:** `fkcxijuikfsvxgojjbgp`

## 📊 ACTUAL DATABASE TABLES

### ✅ `users`
- **Status:** EXISTS
- **Row Count:** 18
- **Verified:** YES

### ✅ `restaurants`
- **Status:** EXISTS
- **Row Count:** 8
- **Verified:** YES

### ✅ `menu_items`
- **Status:** EXISTS
- **Row Count:** 17
- **Verified:** YES

### ✅ `orders`
- **Status:** EXISTS
- **Row Count:** 25
- **Verified:** YES

### ✅ `order_items`
- **Status:** EXISTS
- **Row Count:** 26
- **Verified:** YES

## 🔒 ROW LEVEL SECURITY (RLS) STATUS

No RLS policies found or query failed

## 📋 SAMPLE DATA VERIFICATION

### USERS
```json
[
  {
    "id": "22222222-2222-2222-2222-222222222222",
    "email": "kemi.olatunji@yahoo.com",
    "first_name": "Kemi",
    "last_name": "Olatunji",
    "phone": "+2348023456789",
    "avatar_url": null,
    "date_of_birth": null,
    "gender": null,
    "loyalty_points": 8500,
    "tier": "gold",
    "total_orders": 1,
    "total_spent": 9639.75,
    "referral_code": "FA231D8B",
    "referred_by": null,
    "preferences": {
      "cuisine": [
        "Italian",
        "Chinese",
        "Healthy"
      ],
      "dietary": [
        "vegetarian"
      ],
      "allergens": [
        "nuts"
      ],
      "spiceLevel": "mild",
      "notifications": {
        "promotions": true,
        "orderUpdates": true,
        "newRestaurants": true
      }
    },
    "is_active": true,
    "last_login": null,
    "created_at": "2023-11-20T14:15:00+00:00",
    "updated_at": "2025-08-26T21:10:21.949064+00:00",
    "user_role": "customer",
    "is_verified": false,
    "verification_requested_at": null,
    "verification_completed_at": null,
    "onboarding_completed": false,
    "metadata": null
  },
  {
    "id": "33333333-3333-3333-3333-333333333333",
    "email": "tunde.bakare@outlook.com",
    "first_name": "Tunde",
    "last_name": "Bakare",
    "phone": "+2348034567890",
    "avatar_url": null,
    "date_of_birth": null,
    "gender": null,
    "loyalty_points": 450,
    "tier": "bronze",
    "total_orders": 1,
    "total_spent": 5234.25,
    "referral_code": "E2F72C98",
    "referred_by": null,
    "preferences": {
      "cuisine": [
        "Nigerian",
        "Fast Food"
      ],
      "dietary": [],
      "allergens": [],
      "spiceLevel": "hot",
      "notifications": {
        "promotions": false,
        "orderUpdates": true,
        "newRestaurants": false
      }
    },
    "is_active": true,
    "last_login": null,
    "created_at": "2024-03-10T09:00:00+00:00",
    "updated_at": "2025-08-26T21:10:21.949064+00:00",
    "user_role": "customer",
    "is_verified": false,
    "verification_requested_at": null,
    "verification_completed_at": null,
    "onboarding_completed": false,
    "metadata": null
  }
]
```

### RESTAURANTS
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Mama Cass Kitchen",
    "slug": "mama-cass-kitchen",
    "description": "Authentic Nigerian cuisine with traditional recipes passed down through generations. Home of the best Jollof Rice in Lagos.",
    "image_url": "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&h=600&fit=crop&auto=format",
    "cover_image_url": "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=1200&h=600&fit=crop&auto=format",
    "rating": 4.8,
    "review_count": 342,
    "price_range": "$$",
    "cuisine_types": [
      "Nigerian",
      "African"
    ],
    "delivery_time": "25-35 min",
    "delivery_fee": 500,
    "minimum_order": 2000,
    "commission_rate": 15,
    "is_open": true,
    "is_featured": true,
    "status": "approved",
    "opening_hours": {
      "friday": {
        "open": "08:00",
        "close": "23:00"
      },
      "monday": {
        "open": "08:00",
        "close": "22:00"
      },
      "sunday": {
        "open": "10:00",
        "close": "21:00"
      },
      "tuesday": {
        "open": "08:00",
        "close": "22:00"
      },
      "saturday": {
        "open": "09:00",
        "close": "23:00"
      },
      "thursday": {
        "open": "08:00",
        "close": "22:00"
      },
      "wednesday": {
        "open": "08:00",
        "close": "22:00"
      }
    },
    "location": {
      "area": "Victoria Island",
      "city": "Lagos",
      "coordinates": {
        "lat": 6.4281,
        "lng": 3.4219
      }
    },
    "features": [
      "Fast Delivery",
      "Nigerian Cuisine",
      "Family Friendly"
    ],
    "phone_number": "+234 901 234 5678",
    "email": "info@mamacasskitchen.com",
    "total_orders": 2847,
    "total_revenue": 0,
    "established_year": 2015,
    "owner_id": null,
    "promotions": {
      "active": true,
      "discount": 15,
      "description": "15% off first order"
    },
    "settings": {},
    "created_at": "2025-08-29T08:55:39.868175+00:00",
    "updated_at": "2025-08-29T08:55:39.868175+00:00"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "Dragon Wok Chinese Kitchen",
    "slug": "dragon-wok-chinese-kitchen",
    "description": "Authentic Chinese cuisine with fresh ingredients and traditional cooking methods. Best dim sum and noodles in Lagos.",
    "image_url": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop&auto=format",
    "cover_image_url": "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=1200&h=600&fit=crop&auto=format",
    "rating": 4.7,
    "review_count": 198,
    "price_range": "$$$",
    "cuisine_types": [
      "Chinese",
      "Asian"
    ],
    "delivery_time": "30-45 min",
    "delivery_fee": 800,
    "minimum_order": 3000,
    "commission_rate": 15,
    "is_open": true,
    "is_featured": true,
    "status": "approved",
    "opening_hours": {
      "friday": {
        "open": "11:00",
        "close": "23:30"
      },
      "monday": {
        "open": "11:00",
        "close": "22:30"
      },
      "sunday": {
        "open": "12:00",
        "close": "22:00"
      },
      "tuesday": {
        "open": "11:00",
        "close": "22:30"
      },
      "saturday": {
        "open": "11:00",
        "close": "23:30"
      },
      "thursday": {
        "open": "11:00",
        "close": "22:30"
      },
      "wednesday": {
        "open": "11:00",
        "close": "22:30"
      }
    },
    "location": {
      "area": "Lekki Phase 1",
      "city": "Lagos",
      "coordinates": {
        "lat": 6.4474,
        "lng": 3.4553
      }
    },
    "features": [
      "Authentic Chinese",
      "Vegetarian Options",
      "Fresh Ingredients"
    ],
    "phone_number": "+234 802 345 6789",
    "email": "orders@dragonwok.ng",
    "total_orders": 1654,
    "total_revenue": 0,
    "established_year": 2018,
    "owner_id": null,
    "promotions": {
      "active": false
    },
    "settings": {},
    "created_at": "2025-08-29T08:55:39.868175+00:00",
    "updated_at": "2025-08-29T08:55:39.868175+00:00"
  }
]
```

### MENU_ITEMS
```json
[
  {
    "id": "8d36f456-892b-4af2-8d02-b59781820d44",
    "restaurant_id": "550e8400-e29b-41d4-a716-446655440001",
    "category_id": null,
    "name": "Special Jollof Rice",
    "description": "Our signature jollof rice cooked with premium basmati rice, fresh tomatoes, and authentic spices. Served with fried plantain.",
    "base_price": 2500,
    "image_url": "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=300&fit=crop&auto=format",
    "is_available": true,
    "is_popular": false,
    "preparation_time": 15,
    "calories": 680,
    "tags": [
      "Popular",
      "Signature Dish",
      "Spicy"
    ],
    "allergens": null,
    "customizations": {
      "extras": [
        "Extra Plantain (+₦200)",
        "Coleslaw (+₦300)",
        "Moi Moi (+₦400)"
      ],
      "protein": [
        "Chicken (+₦500)",
        "Beef (+₦800)",
        "Fish (+₦600)",
        "None"
      ],
      "spice_level": [
        "Mild",
        "Medium",
        "Hot"
      ]
    },
    "nutrition_info": {
      "fat": "28g",
      "carbs": "75g",
      "protein": "25g",
      "calories": 680
    },
    "display_order": 0,
    "created_at": "2025-08-29T08:55:40.295226+00:00",
    "updated_at": "2025-08-29T08:55:40.295226+00:00"
  },
  {
    "id": "28c6e176-cc99-4683-b881-dfbe4e463456",
    "restaurant_id": "550e8400-e29b-41d4-a716-446655440001",
    "category_id": null,
    "name": "Pounded Yam & Egusi Soup",
    "description": "Fresh pounded yam served with rich egusi soup loaded with assorted meat, fish, and vegetables.",
    "base_price": 3200,
    "image_url": "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=300&fit=crop&auto=format",
    "is_available": true,
    "is_popular": false,
    "preparation_time": 25,
    "calories": 850,
    "tags": [
      "Traditional",
      "Heavy Meal"
    ],
    "allergens": null,
    "customizations": {
      "protein": [
        "Assorted Meat (included)",
        "Extra Fish (+₦400)",
        "Extra Meat (+₦600)"
      ],
      "yam_portion": [
        "Regular",
        "Large (+₦300)"
      ]
    },
    "nutrition_info": {
      "fat": "32g",
      "carbs": "90g",
      "protein": "35g",
      "calories": 850
    },
    "display_order": 0,
    "created_at": "2025-08-29T08:55:40.295226+00:00",
    "updated_at": "2025-08-29T08:55:40.295226+00:00"
  }
]
```


## ⚠️ ERRORS & ISSUES

- Schema query failed: Could not find the table 'public.information_schema.tables' in the schema cache
- RLS query failed: Could not find the table 'public.pg_policies' in the schema cache

## 🎯 VERIFICATION SUMMARY

**Database Connection:** ✅ WORKING
**Core Tables Status:** 5/5 tables accessible
**RLS Policies:** undefined policies found

---
**⚠️ IMPORTANT:** This document represents the ACTUAL state of the database at verification time. Use ONLY this information for development decisions.
