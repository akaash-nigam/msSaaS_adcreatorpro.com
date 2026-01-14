# Cloud Run Deployment Update Guide

## Current Status
- **Service:** adcreatorpro
- **URL:** https://adcreatorpro-1022196473572.us-central1.run.app
- **Region:** us-central1
- **Status:** Running with placeholder credentials

## What Needs Updating

### 1. Firebase Authentication ⚠️
- Current: Placeholder values
- Needed: Real Firebase credentials

### 2. OpenAI API ⚠️
- Current: Placeholder key
- Needed: Real OpenAI API key

### 3. Stripe (Optional - Live Mode) ✅ (Test mode working)
- Current: Test mode keys
- Already configured: Price IDs from test setup
- Optional: Switch to live mode when ready

---

## Update Option 1: Firebase Credentials

### Get Your Firebase Credentials

**Method A: Use Setup Script (Interactive)**
```bash
./scripts/setup-firebase.sh
```

**Method B: Manual Setup**

1. Go to Firebase Console: https://console.firebase.google.com
2. Create or select project "adcreatorpro"
3. Enable Authentication → Email/Password
4. Get Web App Config:
   - Project Settings → Your apps → Web app
   - Copy firebaseConfig values
5. Download Service Account:
   - Project Settings → Service Accounts
   - Generate new private key (JSON file)

### Update Cloud Run with Firebase Credentials

Once you have your Firebase credentials, update Cloud Run:

```bash
# Update Backend Firebase (Service Account)
gcloud run services update adcreatorpro \
  --region us-central1 \
  --set-env-vars="FIREBASE_PROJECT_ID=your-real-project-id,FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com"

# Update Firebase Private Key (separate command due to special characters)
gcloud run services update adcreatorpro \
  --region us-central1 \
  --update-env-vars FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
YOUR_ACTUAL_PRIVATE_KEY_HERE
-----END PRIVATE KEY-----"

# Update Frontend Firebase Config
gcloud run services update adcreatorpro \
  --region us-central1 \
  --set-env-vars="VITE_FIREBASE_API_KEY=AIzaSy...,VITE_FIREBASE_AUTH_DOMAIN=adcreatorpro.firebaseapp.com,VITE_FIREBASE_PROJECT_ID=adcreatorpro,VITE_FIREBASE_STORAGE_BUCKET=adcreatorpro.appspot.com,VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012,VITE_FIREBASE_APP_ID=1:123456789012:web:abc123"
```

**Note:** After updating VITE_* variables, you need to rebuild and redeploy because they're compiled into the frontend bundle.

---

## Update Option 2: OpenAI API Key

### Get OpenAI API Key

1. Visit: https://platform.openai.com/api-keys
2. Create new secret key
3. Add credits to your account ($5-10 minimum)
4. Copy the key (starts with `sk-`)

### Update Cloud Run

```bash
gcloud run services update adcreatorpro \
  --region us-central1 \
  --set-env-vars="OPENAI_API_KEY=sk-your-real-openai-key-here"
```

**Cost:** ~$0.002 per ad generated using GPT-3.5

---

## Update Option 3: Stripe Live Mode (Optional)

### Current Stripe Status
✅ Test mode configured with price IDs:
- Starter: price_1SiiGkFh8JU4Hpn5uTnUI66b
- Pro: price_1SiiHhFh8JU4Hpn5rwzrp61I
- Business: price_1SiiI7Fh8JU4Hpn5FHhoAKe9
- Pay-per-Ad: price_1SiiK7Fh8JU4Hpn5jGE96Pg3

### Switch to Live Mode

1. Complete Stripe account verification
2. Create products in LIVE mode (same pricing)
3. Get live API keys from: https://dashboard.stripe.com/apikeys
4. Update Cloud Run:

```bash
gcloud run services update adcreatorpro \
  --region us-central1 \
  --set-env-vars="STRIPE_SECRET_KEY=sk_live_...,VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...,STRIPE_PRICE_STARTER=price_live_...,STRIPE_PRICE_PRO=price_live_...,STRIPE_PRICE_BUSINESS=price_live_...,STRIPE_PRICE_PAY_PER_AD=price_live_..."
```

**Note:** Test mode is fine for development. Only switch to live when ready for real customers.

---

## Update Option 4: All Credentials at Once

### Prepare Your Credentials File

Create a file `credentials.env` with all your real values:

```bash
# Firebase Backend
FIREBASE_PROJECT_ID=adcreatorpro
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@adcreatorpro.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Firebase Frontend
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=adcreatorpro.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=adcreatorpro
VITE_FIREBASE_STORAGE_BUCKET=adcreatorpro.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123

# OpenAI
OPENAI_API_KEY=sk-...

# Stripe (if updating to live mode)
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Update Cloud Run from File

```bash
# Update all backend env vars
gcloud run services update adcreatorpro \
  --region us-central1 \
  --set-env-vars="$(cat credentials.env | grep -v '^#' | grep -v '^$' | grep -v 'VITE_' | paste -sd ',' -)"

# Note: VITE_* vars need rebuild, see Option 5 below
```

---

## Update Option 5: Full Redeploy (Recommended for VITE_* changes)

If you're updating any `VITE_*` environment variables (Firebase frontend config, Stripe publishable key), you need to rebuild the frontend because these are compiled into the bundle at build time.

### Step 1: Update .env file locally

```bash
# Edit .env file with real credentials
nano .env

# Or use setup scripts
./scripts/setup-firebase.sh
```

### Step 2: Rebuild and Redeploy

```bash
# Build application
npm run build

# Deploy to Cloud Run (automatically builds Docker image)
gcloud run deploy adcreatorpro \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0 \
  --add-cloudsql-instances="microsaas-projects-2024:us-central1:adcreatorpro-db" \
  --set-env-vars="NODE_ENV=production,DATABASE_URL=postgresql://adcreator:AdCreator2024Secure!@/adcreatorpro_db?host=/cloudsql/microsaas-projects-2024:us-central1:adcreatorpro-db,CLOUD_SQL_CONNECTION_NAME=microsaas-projects-2024:us-central1:adcreatorpro-db,FIREBASE_PROJECT_ID=your-project-id,FIREBASE_CLIENT_EMAIL=your-email,FIREBASE_PRIVATE_KEY=your-key,OPENAI_API_KEY=sk-your-key,STRIPE_SECRET_KEY=sk_your_key,STRIPE_WEBHOOK_SECRET=whsec_your_secret,STRIPE_PRICE_STARTER=price_id,STRIPE_PRICE_PRO=price_id,STRIPE_PRICE_BUSINESS=price_id,STRIPE_PRICE_PAY_PER_AD=price_id,VITE_FIREBASE_API_KEY=your-key,VITE_FIREBASE_AUTH_DOMAIN=your-domain,VITE_FIREBASE_PROJECT_ID=your-project,VITE_FIREBASE_STORAGE_BUCKET=your-bucket,VITE_FIREBASE_MESSAGING_SENDER_ID=your-id,VITE_FIREBASE_APP_ID=your-app-id,VITE_STRIPE_PUBLISHABLE_KEY=pk_your_key,FRONTEND_URL=https://adcreatorpro-1022196473572.us-central1.run.app"
```

**Or use the deployment script:**

```bash
./scripts/deploy.sh
```

---

## Verification After Update

### Test the Deployment

```bash
# Health check
curl https://adcreatorpro-1022196473572.us-central1.run.app/api/health

# Check if service is running
gcloud run services describe adcreatorpro --region us-central1

# View logs
gcloud run services logs read adcreatorpro --region us-central1 --limit 50
```

### Test in Browser

1. Visit: https://adcreatorpro-1022196473572.us-central1.run.app
2. Try to sign up with email/password
3. Check email for verification
4. Try to generate an ad
5. Test payment flow (use test card: 4242 4242 4242 4242)

---

## Rollback if Issues

```bash
# List revisions
gcloud run revisions list --service adcreatorpro --region us-central1

# Rollback to previous revision
gcloud run services update-traffic adcreatorpro \
  --region us-central1 \
  --to-revisions=PREVIOUS_REVISION_NAME=100
```

---

## Priority Order for Updates

### Minimum Viable (to test app functionality)
1. **OpenAI API Key** - Required for ad generation (core feature)
2. **Firebase** - Required for user authentication

### For Full Production
3. **Stripe Live Mode** - When ready for real payments
4. **Custom Domain** - For professional URL
5. **Monitoring Alerts** - For production stability

---

## Quick Commands Reference

```bash
# View current env vars
gcloud run services describe adcreatorpro --region us-central1 --format="value(spec.template.spec.containers[0].env)"

# Update single env var
gcloud run services update adcreatorpro --region us-central1 --set-env-vars="KEY=value"

# Update multiple env vars
gcloud run services update adcreatorpro --region us-central1 --set-env-vars="KEY1=value1,KEY2=value2"

# Remove env var
gcloud run services update adcreatorpro --region us-central1 --remove-env-vars="KEY"

# View logs
gcloud run services logs tail adcreatorpro --region us-central1

# View service details
gcloud run services describe adcreatorpro --region us-central1
```

---

## Next Steps

Choose your update path:

**Path A: Quick Test (OpenAI + Firebase placeholders)**
- Get OpenAI key → Update → Test ad generation
- Keep Firebase in test mode temporarily

**Path B: Full Production Setup (Recommended)**
1. Complete Firebase setup (15 min)
2. Get OpenAI API key (2 min)
3. Update .env file locally
4. Full redeploy with `./scripts/deploy.sh`
5. Test all features
6. Switch Stripe to live mode when ready

**Path C: Test Mode Everything**
- Keep current placeholder Firebase
- Keep test Stripe
- Only add OpenAI key
- Good for development/testing

---

## Support

- **Firebase Issues:** See FIREBASE_QUICKSTART.md
- **Stripe Issues:** Run `./scripts/setup-stripe-complete.sh`
- **Deployment Issues:** See DEPLOYMENT_GUIDE.md
- **Cloud Run Logs:** `gcloud run services logs read adcreatorpro --region us-central1`
