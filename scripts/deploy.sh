#!/bin/bash
# AdCreatorPro Deployment Script

set -e

echo "🚀 Deploying AdCreatorPro to Cloud Run"
echo "======================================="
echo ""

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
  echo "✅ Loaded .env file"
else
  echo "❌ .env file not found! Run ./scripts/setup-env.sh first"
  exit 1
fi

# Get GCP project info
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
REGION="us-central1"
SERVICE_NAME="adcreatorpro"

echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo ""

# Pre-deployment checks
echo "Running pre-deployment checks..."
echo "--------------------------------"

# Check Node.js version
node_version=$(node -v)
echo "✅ Node.js version: $node_version"

# Check npm
npm_version=$(npm -v)
echo "✅ npm version: $npm_version"

# Check if required env vars are set
required_vars=("OPENAI_API_KEY" "STRIPE_SECRET_KEY" "STRIPE_WEBHOOK_SECRET" "FIREBASE_PROJECT_ID")
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing required environment variable: $var"
    exit 1
  fi
done

echo "✅ All required environment variables set"
echo ""

# Build application
echo "📦 Building application..."
echo "-------------------------"

echo "Installing dependencies..."
npm install --production=false

echo "Building frontend..."
npm run build

# Verify build outputs
if [ ! -f "dist/index.js" ]; then
  echo "❌ Backend build failed - dist/index.js not found"
  exit 1
fi

if [ ! -d "dist/public" ]; then
  echo "❌ Frontend build failed - dist/public not found"
  exit 1
fi

echo "✅ Build successful"
echo ""

# Display build info
backend_size=$(du -h dist/index.js | cut -f1)
frontend_size=$(du -sh dist/public | cut -f1)

echo "Build artifacts:"
echo "  Backend: $backend_size"
echo "  Frontend: $frontend_size"
echo ""

# Deploy to Cloud Run
echo "☁️  Deploying to Cloud Run..."
echo "-----------------------------"

# Prepare environment variables for deployment
ENV_VARS="NODE_ENV=production"
ENV_VARS="$ENV_VARS,OPENAI_API_KEY=${OPENAI_API_KEY}"
ENV_VARS="$ENV_VARS,STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}"
ENV_VARS="$ENV_VARS,STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}"
ENV_VARS="$ENV_VARS,STRIPE_PRICE_STARTER=${STRIPE_PRICE_STARTER}"
ENV_VARS="$ENV_VARS,STRIPE_PRICE_PRO=${STRIPE_PRICE_PRO}"
ENV_VARS="$ENV_VARS,STRIPE_PRICE_BUSINESS=${STRIPE_PRICE_BUSINESS}"
ENV_VARS="$ENV_VARS,STRIPE_PRICE_PAY_PER_AD=${STRIPE_PRICE_PAY_PER_AD}"
ENV_VARS="$ENV_VARS,FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}"
ENV_VARS="$ENV_VARS,FIREBASE_PRIVATE_KEY=${FIREBASE_PRIVATE_KEY}"
ENV_VARS="$ENV_VARS,FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL}"
ENV_VARS="$ENV_VARS,FRONTEND_URL=${FRONTEND_URL}"
ENV_VARS="$ENV_VARS,PORT=8080"

# Add DATABASE_URL if set
if [ -n "$DATABASE_URL" ]; then
  ENV_VARS="$ENV_VARS,DATABASE_URL=${DATABASE_URL}"
fi

echo "Deploying with the following configuration:"
echo "  Memory: 512Mi"
echo "  Timeout: 300s"
echo "  Min instances: 0"
echo "  Max instances: 10"
echo ""

gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0 \
  --set-env-vars="$ENV_VARS" \
  --add-cloudsql-instances="${CLOUD_SQL_CONNECTION_NAME}" 2>/dev/null || \
  --add-cloudsql-instances="${CLOUD_SQL_CONNECTION_NAME}"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Deployment successful!"
else
  echo ""
  echo "❌ Deployment failed"
  exit 1
fi

echo ""

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format='value(status.url)')

echo "======================================"
echo "🎉 Deployment Complete!"
echo "======================================"
echo ""
echo "Service URL: $SERVICE_URL"
echo ""

# Test health endpoint
echo "🧪 Testing deployment..."
echo "----------------------"

sleep 5  # Wait for service to be ready

health_response=$(curl -f -s "${SERVICE_URL}/api/health" || echo "failed")

if [ "$health_response" != "failed" ]; then
  echo "✅ Health check passed"
  echo "Response: $health_response"
else
  echo "❌ Health check failed"
  echo "Check Cloud Run logs:"
  echo "gcloud run services logs read $SERVICE_NAME --region=$REGION"
  exit 1
fi

echo ""
echo "======================================"
echo "Next Steps"
echo "======================================"
echo ""
echo "1. ✅ Service is live at: $SERVICE_URL"
echo ""
echo "2. Configure Stripe webhook (if not done):"
echo "   ./scripts/setup-stripe-webhook.sh"
echo ""
echo "3. Test the application:"
echo "   - Visit: $SERVICE_URL"
echo "   - Create a test account"
echo "   - Generate a test ad"
echo ""
echo "4. Monitor logs:"
echo "   gcloud run services logs tail $SERVICE_NAME --region=$REGION"
echo ""
echo "5. View service details:"
echo "   gcloud run services describe $SERVICE_NAME --region=$REGION"
echo ""

# Save deployment info
echo "Deployment completed at: $(date)" > .deployment-info
echo "Service URL: $SERVICE_URL" >> .deployment-info
echo "Region: $REGION" >> .deployment-info
echo "Project: $PROJECT_ID" >> .deployment-info

echo "Deployment info saved to .deployment-info"
echo ""
echo "🎉 Deployment process complete!"
