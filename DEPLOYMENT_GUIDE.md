# AdCreatorPro - Complete Deployment Guide for Google Cloud Run

This guide covers everything you need to deploy AdCreatorPro to Google Cloud Run with Firebase authentication and Stripe payments.

## 🎯 Deployment Overview

### What's Already Built ✅

All code is complete and ready for deployment:
- ✅ Frontend (React + TypeScript)
- ✅ Backend (Node.js + Express)
- ✅ Database schema (PostgreSQL)
- ✅ Firebase authentication integration
- ✅ Stripe payment integration
- ✅ Docker configuration
- ✅ All deployment scripts

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                        Google Cloud Run                       │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │  AdCreatorPro Container                                 │  │
│  │  ├── Frontend (React)                                   │  │
│  │  ├── Backend (Express)                                  │  │
│  │  └── Static Assets                                      │  │
│  │                                                          │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
    ┌─────────┐        ┌──────────┐        ┌───────────┐
    │         │        │          │        │           │
    │ Cloud   │        │ Firebase │        │  Stripe   │
    │ SQL     │        │   Auth   │        │  Payments │
    │ (PostgreSQL)     │          │        │           │
    └─────────┘        └──────────┘        └───────────┘
```

---

## 📋 Pre-Deployment Checklist

### Required Services

- [ ] **Google Cloud Platform Account**
  - Project created
  - Billing enabled
  - gcloud CLI installed

- [ ] **Firebase Project**
  - Authentication enabled
  - Service account key downloaded
  - See: `FIREBASE_QUICKSTART.md`

- [ ] **Stripe Account**
  - Products created
  - API keys obtained
  - Supports Canada & US
  - See: Stripe setup below

- [ ] **OpenAI API Key**
  - For AI ad generation
  - From: https://platform.openai.com

- [ ] **PostgreSQL Database**
  - Cloud SQL instance OR
  - Local PostgreSQL for testing

---

## 🚀 Quick Start Deployment (30 minutes)

### Option 1: Fully Automated (Recommended)

```bash
# Navigate to project directory
cd /Users/aakashnigam/Axion/AxionApps/msSaaS/msSaaS_adcreatorpro.com

# Step 1: Configure Firebase (15 mins)
./scripts/setup-firebase.sh

# Step 2: Configure Stripe (10 mins)
./scripts/setup-stripe-complete.sh

# Step 3: Configure environment (5 mins)
./scripts/setup-env.sh

# Step 4: Deploy to Cloud Run (5 mins)
./scripts/deploy.sh
```

**Total Time:** ~35 minutes

---

## 📖 Detailed Deployment Steps

### Step 1: Set Up Google Cloud Platform (10 minutes)

#### 1.1 Install Google Cloud SDK

**macOS:**
```bash
brew install --cask google-cloud-sdk
```

**Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

**Windows:**
Download from: https://cloud.google.com/sdk/docs/install

#### 1.2 Initialize gcloud

```bash
gcloud init
```

Follow the prompts:
- Log in to your Google account
- Select or create a project
- Choose a default region (e.g., `us-central1`)

#### 1.3 Enable Required APIs

```bash
# Enable Cloud Run API
gcloud services enable run.googleapis.com

# Enable Cloud SQL API
gcloud services enable sqladmin.googleapis.com

# Enable Container Registry
gcloud services enable containerregistry.googleapis.com

# Enable Cloud Build
gcloud services enable cloudbuild.googleapis.com
```

#### 1.4 Set Up Cloud SQL (PostgreSQL)

**Create Cloud SQL instance:**
```bash
gcloud sql instances create adcreatorpro-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=CHANGE_THIS_PASSWORD
```

**Create database:**
```bash
gcloud sql databases create adcreatorpro_db \
  --instance=adcreatorpro-db
```

**Get connection name:**
```bash
gcloud sql instances describe adcreatorpro-db \
  --format='value(connectionName)'
```

Save this connection name - you'll need it for `CLOUD_SQL_CONNECTION_NAME`

**Create database user:**
```bash
gcloud sql users create adcreator \
  --instance=adcreatorpro-db \
  --password=CHANGE_THIS_PASSWORD
```

---

### Step 2: Configure Firebase (15 minutes)

Run the automated setup script:

```bash
./scripts/setup-firebase.sh
```

Or follow the manual guide in `FIREBASE_QUICKSTART.md`

**What this configures:**
- Firebase project
- Email/Password authentication
- Google Sign-In (optional)
- Web app credentials
- Service account key
- Authorized domains

---

### Step 3: Configure Stripe (10 minutes)

Run the automated setup script:

```bash
./scripts/setup-stripe-complete.sh
```

**What this configures:**
- Stripe API keys (test mode)
- 4 products:
  - Starter Plan: $9/month
  - Pro Plan: $29/month
  - Business Plan: $79/month
  - Pay-per-Ad: $1.99
- Webhook endpoint

**Supported Regions:**
- 🇨🇦 Canada (CAD or USD)
- 🇺🇸 United States (USD)

---

### Step 4: Configure OpenAI (2 minutes)

1. Get API key from https://platform.openai.com/api-keys
2. Add to `.env`:
   ```bash
   OPENAI_API_KEY=sk-your-api-key-here
   ```

---

### Step 5: Configure Environment Variables (5 minutes)

#### Option A: Interactive Setup

```bash
./scripts/setup-env.sh
```

#### Option B: Manual Setup

Edit `.env` file and update all variables:

```bash
# Server
NODE_ENV=production
PORT=8080
FRONTEND_URL=https://your-domain.com

# Database
DATABASE_URL=postgresql://user:password@/db?host=/cloudsql/project:region:instance
CLOUD_SQL_CONNECTION_NAME=project:region:instance

# Firebase (from Firebase setup)
FIREBASE_PROJECT_ID=your-project
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...

VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123...:web:abc...

# OpenAI
OPENAI_API_KEY=sk-...

# Stripe (from Stripe setup)
STRIPE_SECRET_KEY=sk_test_...  # or sk_live_... for production
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...  # or pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_BUSINESS=price_...
STRIPE_PRICE_PAY_PER_AD=price_...
```

---

### Step 6: Test Locally (Optional but Recommended)

Before deploying to Cloud Run, test locally:

```bash
# Start local PostgreSQL
# (or connect to Cloud SQL with cloud-sql-proxy)

# Start development server
npm run dev

# Open in browser
open http://localhost:8080
```

**Test checklist:**
- [ ] Can access homepage
- [ ] Can sign up with email/password
- [ ] Can log in
- [ ] Can generate an ad
- [ ] Can view pricing page
- [ ] Can click "Subscribe" (redirects to Stripe)

---

### Step 7: Deploy to Cloud Run (5 minutes)

#### Option A: Automated Deployment (Recommended)

```bash
./scripts/deploy.sh
```

This script:
1. Builds the application
2. Verifies build artifacts
3. Deploys to Cloud Run
4. Sets environment variables
5. Connects to Cloud SQL
6. Tests the deployment

#### Option B: Manual Deployment

```bash
# Build application
npm run build

# Deploy to Cloud Run
gcloud run deploy adcreatorpro \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0 \
  --add-cloudsql-instances="$CLOUD_SQL_CONNECTION_NAME" \
  --set-env-vars="$(cat .env | grep -v '^#' | grep -v '^$' | tr '\n' ',')"
```

---

### Step 8: Configure Stripe Webhook for Production

After deployment, update Stripe webhook:

```bash
# Get your Cloud Run URL
SERVICE_URL=$(gcloud run services describe adcreatorpro \
  --region us-central1 \
  --format='value(status.url)')

echo "Your service URL: $SERVICE_URL"

# Run webhook setup
./scripts/setup-stripe-webhook.sh
# Enter the Cloud Run URL when prompted
```

Or manually:
1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. URL: `https://your-cloud-run-url.run.app/api/stripe/webhook`
4. Events: Select all from the list below
5. Copy webhook secret to Cloud Run environment variables

**Required webhook events:**
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

### Step 9: Update Firebase Authorized Domains

1. Go to Firebase Console > Authentication > Settings
2. Click "Add domain"
3. Add your Cloud Run URL (without https://)
   Example: `adcreatorpro-xxx-uc.a.run.app`
4. If using custom domain, add that too

---

### Step 10: Verify Deployment

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe adcreatorpro \
  --region us-central1 \
  --format='value(status.url)')

# Test health endpoint
curl $SERVICE_URL/api/health

# Expected response:
# {"status":"ok","service":"AdCreatorPro"}

# Open in browser
open $SERVICE_URL
```

**Manual verification:**
1. Visit the service URL
2. Sign up with a test account
3. Verify email works
4. Generate a test ad
5. Try a test payment (use test card: 4242 4242 4242 4242)

---

## 🛠️ Available Deployment Scripts

All scripts are in the `scripts/` directory:

### Setup Scripts

| Script | Purpose | Time |
|--------|---------|------|
| `setup-firebase.sh` | Configure Firebase authentication | 15 min |
| `setup-stripe-complete.sh` | Configure Stripe payments | 10 min |
| `setup-env.sh` | Interactive environment configuration | 5 min |
| `setup-cloudsql.sh` | Configure Cloud SQL for Cloud Run | 3 min |
| `setup-stripe-webhook.sh` | Configure Stripe webhooks | 2 min |

### Testing Scripts

| Script | Purpose |
|--------|---------|
| `test-db-connection.sh` | Test database connectivity |
| `tests/api-tests.sh` | Test all API endpoints |
| `tests/db-tests.sql` | Verify database schema |

### Deployment Scripts

| Script | Purpose |
|--------|---------|
| `deploy.sh` | One-command deployment to Cloud Run |

### Usage Examples

```bash
# Complete setup from scratch
./scripts/setup-firebase.sh
./scripts/setup-stripe-complete.sh
./scripts/setup-env.sh
./scripts/deploy.sh

# Test database before deployment
./scripts/test-db-connection.sh

# Deploy to Cloud Run
./scripts/deploy.sh

# Set up webhook after deployment
./scripts/setup-stripe-webhook.sh

# Test API endpoints
./tests/api-tests.sh
```

---

## 🔄 Update and Redeploy

After making code changes:

```bash
# Quick redeploy
./scripts/deploy.sh

# Or manual
npm run build
gcloud run deploy adcreatorpro --source . --region us-central1
```

Cloud Run will:
1. Build new container
2. Deploy new revision
3. Gradually shift traffic to new revision
4. Keep old revision for rollback

---

## 🔙 Rollback

If deployment has issues:

```bash
# List revisions
gcloud run revisions list --service adcreatorpro --region us-central1

# Rollback to specific revision
gcloud run services update-traffic adcreatorpro \
  --region us-central1 \
  --to-revisions=REVISION_NAME=100
```

---

## 📊 Monitoring

### View Logs

```bash
# Real-time logs
gcloud run services logs tail adcreatorpro --region us-central1

# Recent logs
gcloud run services logs read adcreatorpro --region us-central1 --limit 50
```

### Cloud Console

View metrics in Google Cloud Console:
- Go to Cloud Run > adcreatorpro
- Click "METRICS" tab
- View:
  - Request count
  - Request latency
  - Error rate
  - Memory usage
  - CPU usage

---

## 💰 Cost Optimization

### Cloud Run Pricing

- **Free tier:** 2 million requests/month
- **After free tier:**
  - $0.00002400 per request
  - $0.00001800 per GB-second (memory)
  - $0.00002400 per vCPU-second

### Cloud SQL Pricing

- **db-f1-micro:** ~$8/month (shared CPU, 0.6 GB RAM)
- **db-g1-small:** ~$25/month (shared CPU, 1.7 GB RAM)
- **db-custom:** Custom pricing

### Recommendations

**Development:**
- Use db-f1-micro for Cloud SQL
- min-instances: 0 (scale to zero)
- max-instances: 3

**Production:**
- Use db-g1-small or higher for Cloud SQL
- min-instances: 1 (faster response)
- max-instances: 10-100 (based on traffic)

---

## 🔒 Security Best Practices

### Before Going Live

- [ ] Switch Stripe from test mode to live mode
- [ ] Use strong passwords for database
- [ ] Enable Cloud SQL SSL connections
- [ ] Set up Cloud Armor (DDoS protection)
- [ ] Enable Cloud Run authentication (if needed)
- [ ] Set up monitoring alerts
- [ ] Configure backup strategy
- [ ] Review IAM permissions

### Environment Variables

**Never commit:**
- `.env` file
- Service account JSON files
- API keys

**Always:**
- Use environment variables
- Rotate keys every 90 days
- Use different keys for dev/staging/production

---

## 🌐 Custom Domain Setup

### Add Custom Domain to Cloud Run

```bash
# Map domain to service
gcloud run domain-mappings create \
  --service adcreatorpro \
  --domain adcreatorpro.com \
  --region us-central1
```

### Update DNS Records

Cloud Run will provide DNS records to add to your domain:
- A record or CNAME record
- Follow instructions from gcloud output

### Update Environment Variables

```bash
# Update FRONTEND_URL
gcloud run services update adcreatorpro \
  --region us-central1 \
  --set-env-vars="FRONTEND_URL=https://adcreatorpro.com"
```

### Update Firebase & Stripe

- Add custom domain to Firebase authorized domains
- Update Stripe webhook URL to use custom domain

---

## 🐛 Troubleshooting

### "Container failed to start"

**Check logs:**
```bash
gcloud run services logs read adcreatorpro --region us-central1 --limit 50
```

**Common causes:**
- Missing environment variables
- Database connection failure
- Invalid Firebase credentials
- Port mismatch (must use PORT=8080)

### "Database connection timeout"

**Solutions:**
- Verify Cloud SQL connection name is correct
- Check Cloud SQL instance is running
- Verify service account has Cloud SQL Client role
- Test connection with cloud-sql-proxy locally

### "Stripe webhook not working"

**Solutions:**
- Verify webhook URL is correct
- Check webhook secret in environment variables
- Look for webhook events in Stripe Dashboard
- Use Stripe CLI to test locally

### "Firebase authentication not working"

**Solutions:**
- Check authorized domains in Firebase Console
- Verify API keys are correct
- Check service account key is valid
- Look for errors in browser console

---

## 📞 Support Resources

### Documentation

- [README.md](README.md) - Project overview
- [FIREBASE_QUICKSTART.md](FIREBASE_QUICKSTART.md) - Firebase setup
- [DEPLOYMENT_READY.md](DEPLOYMENT_READY.md) - Deployment checklist
- [docs/](docs/) - Complete documentation

### External Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Stripe Documentation](https://stripe.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)

---

## ✅ Deployment Checklist

Use this checklist to ensure everything is configured:

### Pre-Deployment
- [ ] Google Cloud project created
- [ ] Billing enabled
- [ ] gcloud CLI installed and configured
- [ ] Cloud SQL instance created
- [ ] Firebase project configured
- [ ] Stripe account set up
- [ ] OpenAI API key obtained
- [ ] All environment variables set in `.env`

### Deployment
- [ ] Application builds successfully (`npm run build`)
- [ ] Tests pass (if applicable)
- [ ] Deployed to Cloud Run
- [ ] Cloud SQL connected
- [ ] Environment variables set in Cloud Run
- [ ] Health check passes

### Post-Deployment
- [ ] Firebase authorized domains updated
- [ ] Stripe webhook configured
- [ ] Test user signup works
- [ ] Test ad generation works
- [ ] Test payment flow works
- [ ] Monitoring set up
- [ ] Logs reviewed for errors

### Go Live
- [ ] Switch Stripe to live mode
- [ ] Update live API keys
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Final end-to-end test
- [ ] Announce launch!

---

## 🎉 Success!

Your AdCreatorPro application is now deployed to Google Cloud Run!

**Service URL:** Check with `gcloud run services describe adcreatorpro --region us-central1 --format='value(status.url)'`

**Next steps:**
1. Test thoroughly
2. Monitor for 24 hours
3. Switch to Stripe live mode when ready
4. Start onboarding users!

---

**Deployment Time:** 30-60 minutes (first time)
**Redeploy Time:** 5-10 minutes

**Status:** Production Ready! 🚀
