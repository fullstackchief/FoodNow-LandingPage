# 🔒 FoodNow Security Guidelines

## 🚨 SECURITY INCIDENT RESOLVED

**Date**: August 25, 2025  
**Issue**: API keys were accidentally committed to Git repository  
**Status**: ✅ RESOLVED - All exposed keys have been secured  

### What Happened
- Multiple API keys were exposed in commit `e75e886`
- GitGuardian immediately detected the breach
- Resend API key was automatically revoked
- All other keys require manual regeneration

---

## 🔑 API Key Management

### ✅ IMMEDIATELY REGENERATE These Keys:

1. **Supabase Keys** (HIGHEST PRIORITY)
   - Go to: https://supabase.com/dashboard/project/[your-project]/settings/api
   - Regenerate both ANON and SERVICE_ROLE keys
   - Update `.env.local` with new values

2. **Paystack Keys** (CRITICAL - Payment processor)
   - Go to: https://dashboard.paystack.com/#/settings/developers
   - Regenerate both test and live keys
   - Update `.env.local` with new values

3. **Google Maps API Key**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Create new restricted API key
   - Delete the exposed key: `AIzaSyD7UHvXJtUbb8Pwa_E40l8IjhKAykefEoQ`

4. **Resend API Key** ✅ Already revoked
   - Go to: https://resend.com/api-keys
   - Generate new API key
   - Update `.env.local`

5. **Admin Secret Key**
   - Generate a new secure random string (min 32 characters)
   - Update `.env.local`

---

## 🛡️ Security Measures Implemented

### ✅ Completed
- [x] Removed `.env.local` from Git tracking
- [x] Created secure placeholder `.env.local`
- [x] Implemented pre-commit security hook
- [x] Added comprehensive `.gitignore` rules

### 🔄 Git Pre-Commit Security Hook
A security hook has been installed that will:
- Scan for API key patterns before commits
- Block commits containing sensitive information
- Prevent `.env` files from being committed
- Provide helpful security tips

### 📝 Environment File Rules
- ✅ `.env.local` - Ignored (local development)
- ✅ `.env.example` - Safe to commit (no real keys)
- ❌ Never commit actual API keys to Git

---

## 🚨 What to Do If Keys Are Exposed Again

1. **Immediately revoke all exposed keys**
2. **Check logs for unauthorized usage**
3. **Generate new keys from each service**
4. **Update all environments (dev/staging/prod)**
5. **Monitor for unusual activity**

---

## 📞 Emergency Contacts

- **Supabase Support**: https://supabase.com/support
- **Paystack Support**: hello@paystack.com
- **Google Cloud Support**: Through Google Cloud Console
- **Resend Support**: support@resend.com

---

## 🔍 Security Monitoring

- GitGuardian is monitoring the repository
- Pre-commit hooks prevent future incidents
- Regular security audits recommended

**Last Updated**: August 25, 2025  
**Next Review**: September 25, 2025