# FOODNOW MASTER IMPLEMENTATION PLAN
**Created:** September 1, 2025  
**Session:** Comprehensive Codebase Analysis & Implementation Planning  
**Status:** Active Development Plan

---

## 🎯 **MISSION STATEMENT**
Create a customer-centric food delivery platform that prioritizes user experience, safety, and reliability while building robust systems for restaurants, riders, and admin management.

---

## 📋 **COMPREHENSIVE ANALYSIS SUMMARY**

### **Current State Assessment**
- **Project Score:** 45/100 (Good foundation, needs completion)
- **Tech Stack:** Next.js 15, TypeScript, Supabase, Redux Toolkit, Tailwind CSS
- **Database Status:** Connected with real data (18 users, 8 restaurants, 17 menu items)
- **Security Status:** Basic JWT, needs RLS implementation
- **Payment Status:** Paystack integrated but test mode only

### **Key Strengths Identified**
✅ Modern tech stack with TypeScript  
✅ Clean UI design and responsive layout  
✅ Working Supabase database connection  
✅ Basic authentication framework  
✅ Component structure well organized  
✅ Redux state management properly implemented  
✅ Security headers configured  
✅ Rate limiting on API endpoints  
✅ Input validation with Zod schemas  

### **Critical Gaps Identified**
❌ No Row Level Security (RLS) policies  
❌ Mock data mixed with real data throughout codebase  
❌ Email/SMS verification not working (UI only)  
❌ Location services not implemented despite Google Maps API  
❌ Real-time features missing (WebSockets not configured)  
❌ Payment system incomplete (test mode, no saved methods)  
❌ No notification system (email/SMS/push)  
❌ Multiple cart implementations causing confusion  
❌ No proper error boundaries in components  
❌ Missing loading states for async operations  
❌ No customer support system  
❌ No analytics/reporting dashboards  

---

## 🚨 **BUSINESS REQUIREMENTS CLARIFICATIONS**

### **Restaurant Onboarding (SIMPLIFIED)**
- ❌ **NO BVN required** from restaurants
- ❌ **NO food safety certificates** needed  
- ❌ **NO allergen information** required
- ✅ **Template-based menus** with admin preloaded photos
- ✅ **CAC + Owner NIN only** for documents
- ✅ **2-hour automated payout** after delivery confirmation
- ✅ **Real-time availability** toggle for menu items

### **Rider Assignment Logic**
- ✅ **5km default radius** (admin adjustable)
- ✅ **Bulk radius updates** for all restaurants at once
- ✅ **Individual radius override** per restaurant
- ✅ **Surge zones** during peak times with multiplier
- ✅ **Fastest to accept** gets the order within radius
- ✅ **Admin manual assignment** if no riders accept
- ✅ **Weekly payouts** with admin approval

### **Customer Payment Options**
- ✅ **Cards and bank transfers ONLY**
- ❌ **NO cash on delivery**
- ✅ **Saved payment methods** for convenience
- ✅ **Refund system** for order issues
- ✅ **Real-time payment verification**

### **Communication Strategy**
- ✅ **SMS:** Critical updates only (order confirmed, out for delivery, delivered)
- ✅ **Email:** Receipts, promotions, weekly deals, payout notifications
- ✅ **In-app:** All real-time updates, tracking, support messages

### **Admin System Requirements**
- ✅ **God Mode:** Super Admin with full system control
- ✅ **2FA Mandatory:** SMS or Email options for all admins
- ✅ **Permission Matrix:** Checkbox-based role creation
- ✅ **User Management:** Create, edit, delete any user type
- ✅ **Financial Controls:** Payout approvals, refund limits, spending thresholds

### **Location & Tracking**
- ✅ **Real-time rider tracking** (admin visibility only)
- ✅ **Customer address validation** with Google Maps
- ✅ **Dynamic delivery zones** with geofencing
- ❌ **Customers/Restaurants cannot see rider locations**
- ✅ **Riders only get delivery address** (no customer phone until delivery)

---

## 🔧 **RLS IMPLEMENTATION STRATEGY**

### **Claude/Admin Operations (Service Role)**
```javascript
// For Claude scripts and admin operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
```

### **Customer Operations (Anon Key + RLS)**
```javascript
// For customer-facing operations (respects RLS)
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
```

### **RLS Policies Structure**
```sql
-- Service role bypass (for Claude/admin)
CREATE POLICY "service_role_bypass" ON [table] 
  FOR ALL USING (auth.role() = 'service_role');

-- Customer access to own data
CREATE POLICY "customers_own_data" ON orders
  FOR SELECT USING (auth.uid() = customer_id);

-- Restaurant access to own orders
CREATE POLICY "restaurants_own_orders" ON orders  
  FOR SELECT USING (auth.uid() IN (
    SELECT owner_id FROM restaurants WHERE id = restaurant_id
  ));
```

---

## 📅 **DETAILED IMPLEMENTATION PHASES**

### **PHASE 1: FOUNDATION CLEANUP (Week 1-2)**

#### **Mock Data Removal**
- [ ] Audit `/src/constants/` for all mock data files
- [ ] Review `/src/components/` for hardcoded data
- [ ] Replace mock restaurant data with real Supabase queries
- [ ] Update menu items to use real database IDs
- [ ] Remove test user credentials from UI components

#### **Authentication Infrastructure**
- [✅] Supabase Auth email system is configured and working
- [⚠️] **REQUIRED:** Enable OTP signups in Supabase Dashboard (Auth > Settings)
- [⚠️] **REQUIRED:** Configure SMS provider in Supabase (Auth > Providers > Phone)
- [ ] Test email verification end-to-end
- [ ] Test SMS OTP verification
- [ ] Fix user verification status updates

#### **Database Security**
- [ ] Create RLS policies for all existing tables
- [ ] Test service role bypass for admin operations
- [ ] Verify Claude scripts still work with RLS
- [ ] Create audit logs for security events

### **PHASE 2: CUSTOMER CORE EXPERIENCE (Week 3-4)**

#### **Order Management**
- [ ] Fix checkout flow with real order creation
- [ ] Implement order validation and error handling
- [ ] Create order confirmation with notifications
- [ ] Build customer order history dashboard
- [ ] Add order modification/cancellation

#### **Payment Integration**
- [ ] Complete Paystack payment flow
- [ ] Implement payment verification webhooks
- [ ] Add saved payment methods storage
- [ ] Create refund processing system
- [ ] Build payment transaction history

#### **Real-time Features**
- [ ] Implement WebSocket for order updates
- [ ] Create real-time order tracking interface
- [ ] Build notification system (SMS/Email/In-app)
- [ ] Add customer support ticket system
- [ ] Implement rating and review system

### **PHASE 3: RESTAURANT SYSTEM (Week 5-6)**

#### **Restaurant Onboarding**
```
Registration Flow:
1. Business details (name, email, phone, CAC)
2. SMS OTP verification
3. Email verification
4. Document upload (CAC + Owner NIN)
5. Banking details (no BVN required)
6. Menu template selection
7. Admin approval workflow
8. Go live activation
```

#### **Menu Template System**
- [ ] Create admin interface for menu templates
- [ ] Build photo library management
- [ ] Implement restaurant menu selection
- [ ] Add price adjustment interface
- [ ] Create real-time availability controls

#### **Restaurant Operations**
- [ ] Build order management dashboard
- [ ] Create preparation time settings
- [ ] Implement order acceptance/rejection
- [ ] Add customer communication (order notes)
- [ ] Build restaurant analytics dashboard

#### **Payout System**
- [ ] Implement 2-hour automated payout logic
- [ ] Create payout calculation (90% for partners)
- [ ] Build admin approval workflow
- [ ] Add payout history tracking
- [ ] Implement custom payout agreements

### **PHASE 4: RIDER SYSTEM (Week 7-8)**

#### **Rider Onboarding**
```
Registration Flow:
1. Personal details (name, phone, email, age)
2. SMS OTP verification
3. Email verification
4. Address and emergency contact
5. Guarantor information
6. Guarantor OTP verification
7. Document upload (NIN, photos, utility bill)
8. Work preferences (zones, hours, equipment)
9. Admin approval workflow
10. Training and activation
```

#### **Order Assignment System**
- [ ] Implement 5km radius-based notification
- [ ] Create "fastest to accept" logic
- [ ] Build admin manual assignment override
- [ ] Add surge zone functionality
- [ ] Implement order queue management

#### **Rider Operations**
- [ ] Create availability toggle system
- [ ] Build delivery tracking (admin visibility)
- [ ] Implement earnings calculation
- [ ] Add performance metrics tracking
- [ ] Create weekly payout system

### **PHASE 5: ADMIN GOD MODE SYSTEM (Week 9-10)**

#### **Super Admin Powers**
- [ ] Create/edit/delete any user (customers, restaurants, riders, admins)
- [ ] Override any system setting or configuration
- [ ] Manual order assignment and cancellation
- [ ] Financial controls (payouts, refunds, commissions)
- [ ] Emergency system shutdown capabilities

#### **Permission Matrix System**
```javascript
adminPermissions = {
  // User Management
  createUsers: boolean,
  editUsers: boolean,
  deleteUsers: boolean,
  viewAllUsers: boolean,
  
  // Restaurant Management
  approveRestaurants: boolean,
  editRestaurants: boolean,
  approveMenus: boolean,
  setCommissions: boolean,
  
  // Rider Management
  approveRiders: boolean,
  assignOrders: boolean,
  trackRiders: boolean,
  processPayouts: boolean,
  
  // Financial Controls
  approveRefunds: boolean,
  viewFinancials: boolean,
  setSpendingLimits: boolean,
  
  // System Controls
  createAdmins: boolean,
  systemSettings: boolean,
  emergencyOverride: boolean
}
```

#### **Admin Dashboard Features**
- [ ] Real-time system monitoring
- [ ] Approval queues management
- [ ] Financial overview and controls
- [ ] User analytics and reports
- [ ] Support ticket management

### **PHASE 6: INTEGRATION & TESTING (Week 11-12)**

#### **System Integration**
- [ ] Complete customer → restaurant → rider → admin flow
- [ ] Test all notification channels
- [ ] Verify payment and payout systems
- [ ] Test emergency scenarios and overrides
- [ ] Validate security measures across all roles

#### **Quality Assurance**
- [ ] End-to-end testing for all user journeys
- [ ] Performance testing under load
- [ ] Security penetration testing
- [ ] Mobile responsiveness testing
- [ ] Cross-browser compatibility

#### **Production Preparation**
- [ ] Environment configuration
- [ ] Monitoring and alerting setup
- [ ] Error tracking implementation
- [ ] Performance monitoring
- [ ] Backup and recovery procedures

---

## 🔍 **TECHNICAL ARCHITECTURE DECISIONS**

### **Database Tables Priority**
```sql
Week 1: notifications, delivery_zones, system_settings
Week 2: menu_templates, admin_permissions
Week 3: payment_transactions, support_tickets  
Week 4: rider_documents, delivery_assignments
Week 5: payout_history, restaurant_documents
Week 6: analytics_data, audit_logs
```

### **API Endpoints Priority**
```
Week 1: /auth/* (OTP, verification)
Week 2: /notifications/*, /admin/settings/*
Week 3: /orders/*, /payments/*
Week 4: /restaurants/*, /menu-templates/*
Week 5: /riders/*, /delivery/*
Week 6: /admin/*, /analytics/*
```

### **Frontend Components Priority**
```
Week 1: Authentication components, notification system
Week 2: Customer order flow, checkout improvements
Week 3: Restaurant registration, menu selection
Week 4: Rider registration, guarantor verification
Week 5: Admin dashboard, permission management
Week 6: Analytics, reporting, final polish
```

---

## 📞 **IMMEDIATE NEXT STEPS**

1. **Verify current database state** with verification script
2. **Start with mock data removal** from the codebase
3. **Setup email/SMS providers** for real notifications
4. **Begin RLS implementation** while preserving Claude access
5. **Fix customer authentication flow** first

This plan ensures customer experience drives every decision while building comprehensive systems for all stakeholders. Each phase builds upon the previous one, maintaining system integrity throughout development.

Ready to begin implementation with this customer-first approach!