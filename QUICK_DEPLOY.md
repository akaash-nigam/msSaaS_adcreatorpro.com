# Quick Deployment Configuration

Your AdCreatorPro is already LIVE! 🎉

**Service URL:** https://adcreatorpro-1022196473572.us-central1.run.app

## Current Status
- ✅ Infrastructure deployed and running
- ✅ Database connected
- ✅ Frontend serving correctly
- ✅ All endpoints responding
- ⏳ Waiting for API credentials

---

## 2-Minute Quick Start

### Option 1: Deploy with OpenAI Only (Fastest)

This enables ad generation right away:

```bash
# 1. Get your OpenAI API key
open https://platform.openai.com/api-keys

# 2. Copy your key (starts with sk-proj- or sk-)

# 3. Update deployment (replace YOUR_KEY with actual key)
gcloud run services update adcreatorpro \
  --region us-central1 \
  --set-env-vars="OPENAI_API_KEY=sk-YOUR_KEY_HERE"
```

**What this enables:**
- ✅ Ad generation works immediately
- ❌ User signup still needs Firebase

---

### Option 2: Full Deployment (OpenAI + Firebase)

This enables everything:

**Step 1: Get OpenAI Key (2 minutes)**
```bash
# Visit and create API key
open https://platform.openai.com/api-keys

# Add $5-10 credits to your account
```

**Step 2: Set up Firebase (15 minutes)**
```bash
# Run our automated setup script
./scripts/setup-firebase.sh

# This will:
# - Guide you through Firebase console
# - Create service account
# - Update your .env file automatically
```

**Step 3: Full Redeploy**
```bash
# This rebuilds with new credentials
./scripts/update-cloud-run.sh
# Choose option 6 (Full redeploy with rebuild)
```

---

## Manual Configuration (If You Have Credentials Ready)

### Update .env File
```bash
nano .env
```

Update these lines:
```bash
# OpenAI
OPENAI_API_KEY=sk-your-real-key-here

# Firebase (if you have it)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"

# Firebase Frontend (if you have it)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123
```

### Deploy Updated Configuration
```bash
./scripts/update-cloud-run.sh
# Choose option 6 (Full redeploy)
```

---

## Fastest Path to Working App (Choose One)

### Path A: Just OpenAI (2 minutes)
```bash
# Get key: https://platform.openai.com/api-keys
# Then run:
gcloud run services update adcreatorpro \
  --region us-central1 \
  --set-env-vars="OPENAI_API_KEY=sk-your-key"
```
**Result:** Ad generation works (without user accounts)

### Path B: OpenAI + Firebase (20 minutes)
```bash
# 1. Get OpenAI key (2 min)
# 2. Run Firebase setup (15 min)
./scripts/setup-firebase.sh

# 3. Edit .env to add OpenAI key
nano .env

# 4. Redeploy everything
./scripts/update-cloud-run.sh  # Option 6
```
**Result:** Full app functionality (signup, login, ad generation)

---

## Test After Deployment

```bash
# Visit your app
open https://adcreatorpro-1022196473572.us-central1.run.app

# If you added OpenAI:
# - Sign up (if Firebase configured)
# - Generate an ad
# - See AI-generated content

# View logs to verify
gcloud run services logs tail adcreatorpro --region us-central1
```

---

## Quick Commands Reference

```bash
# Update single env var
gcloud run services update adcreatorpro \
  --region us-central1 \
  --set-env-vars="KEY=value"

# View current config
./scripts/update-cloud-run.sh  # Option 5

# Full redeploy
./scripts/update-cloud-run.sh  # Option 6

# View logs
gcloud run services logs tail adcreatorpro --region us-central1
```

---

## What's Already Working

- ✅ Service is LIVE
- ✅ Homepage loads
- ✅ Pricing page works
- ✅ Stripe test mode ready
- ✅ Database connected
- ✅ All infrastructure operational

**Just add API keys to unlock features!**

---

## Choose Your Action Now

1. **Quick Deploy (OpenAI only)**: 2 minutes
   - Gets ad generation working immediately

2. **Full Deploy (OpenAI + Firebase)**: 20 minutes
   - Gets everything working (recommended)

3. **Test First**: Visit https://adcreatorpro-1022196473572.us-central1.run.app
   - Explore the UI, add credentials later

**Ready when you are!** 🚀
