# PAYSTACK CONFIGURATION GUIDE
**Status:** Keys configured but authentication failing  
**Issue:** 401 "Invalid key" error from Paystack API

---

## 🔍 CURRENT STATUS

### Environment Variables Status
- ✅ `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`: Present
- ✅ `PAYSTACK_SECRET_KEY`: Present  
- ❌ `WEBHOOK_SECRET_PAYSTACK`: Missing (required for webhooks)

### Issue Analysis
**Problem:** Paystack API returning "Invalid key" error despite correct key format
**Possible Causes:**
1. Test keys from dashboard screenshot may be sample/demo keys
2. Keys need activation in Paystack dashboard
3. Account not fully verified for API access
4. Webhook secret missing

---

## 🔧 RESOLUTION STEPS

### Step 1: Verify Paystack Account Status
**In Paystack Dashboard:**
1. Check account verification status
2. Ensure test mode is enabled
3. Verify API keys are active (not just displayed)

### Step 2: Generate Fresh Test Keys  
**If current keys are invalid:**
1. In dashboard → Settings → API Keys & Webhooks
2. Click "Generate new test keys"
3. Copy the newly generated keys

### Step 3: Configure Missing Webhook Secret
**Required for payment webhooks:**
1. In dashboard → Settings → API Keys & Webhooks  
2. Add webhook URL: `https://your-domain.com/api/webhooks/paystack`
3. Copy the webhook secret key
4. Add to `.env.local`:
   ```
   WEBHOOK_SECRET_PAYSTACK=your_webhook_secret
   ```

### Step 4: Update Environment Variables
**Add these to `.env.local`:**
```bash
# If keys need to be regenerated
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_[new_generated_key]
PAYSTACK_SECRET_KEY=sk_test_[new_generated_key]

# Required for webhooks
WEBHOOK_SECRET_PAYSTACK=[webhook_secret_from_dashboard]

# Optional webhook URL for reference
PAYSTACK_WEBHOOK_URL=https://your-domain.com/api/webhooks/paystack
```

---

## 🧪 TESTING PROCEDURE

### Test Payment Integration
```bash
# After updating keys
node scripts/test-payment-simple.js
```

**Expected Results:**
- ✅ Environment Variables: OK
- ✅ Paystack API: CONNECTED  
- ✅ Payment Init: WORKING

### Test Complete Payment Flow
```bash
# Test full checkout process
npm run dev
# Navigate to checkout and test card payment
```

---

## 📋 IMPLEMENTATION STATUS

### ✅ Completed Components
- **Payment Framework:** Complete Paystack integration code
- **Client-side:** Payment initialization and popup handling
- **Server-side:** Secure payment processing with proper validation
- **Webhook Handler:** Complete webhook processing for all events
- **Database Integration:** Payment transactions table and order updates
- **Error Handling:** Comprehensive error logging and user feedback

### ⚠️ Configuration Needed
- **Test Keys:** Verify and possibly regenerate in dashboard
- **Webhook Secret:** Add missing environment variable
- **Webhook URL:** Configure in Paystack dashboard (for production)

---

## 🚀 NEXT ACTIONS

### Immediate (Required for Testing)
1. **Check Paystack Account:** Verify test mode is enabled and account is active
2. **Generate Fresh Keys:** If current keys are invalid, generate new ones
3. **Add Webhook Secret:** Configure webhook URL and add secret to env
4. **Test Integration:** Run payment tests to verify functionality

### Future (Production Ready)
1. **Switch to Live Keys:** When ready for production
2. **Configure Live Webhook URL:** Point to production domain
3. **Test Production Flow:** Verify live payment processing
4. **Security Review:** Ensure all payment data is properly secured

---

## 💡 TROUBLESHOOTING

### Common Issues
- **401 Invalid Key:** Keys need activation or regeneration
- **Webhook Failures:** Missing webhook secret environment variable
- **CORS Errors:** Ensure domain is allowed in Paystack settings
- **SSL Errors:** Webhook URL must use HTTPS in production

### Support Resources
- Paystack Documentation: https://paystack.com/docs
- Test Cards: Available in Paystack dashboard
- API Status: https://status.paystack.com

---

*Payment system is architecturally complete - only key configuration needed for full functionality.*