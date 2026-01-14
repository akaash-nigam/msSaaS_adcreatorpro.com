#!/bin/bash
# Update Cloud Run Environment Variables
# This script helps update AdCreatorPro deployment with real credentials

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SERVICE_NAME="adcreatorpro"
REGION="us-central1"

echo -e "${BLUE}🔄 Cloud Run Deployment Update${NC}"
echo "=================================="
echo ""
echo "Current Service: $SERVICE_NAME"
echo "Region: $REGION"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please create .env file with your credentials first."
    exit 1
fi

echo -e "${YELLOW}What would you like to update?${NC}"
echo ""
echo "1. Update Firebase credentials"
echo "2. Update OpenAI API key"
echo "3. Update Stripe credentials (live mode)"
echo "4. Update all credentials from .env file"
echo "5. View current environment variables"
echo "6. Full redeploy with rebuild"
echo ""
read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo ""
        echo -e "${BLUE}📱 Updating Firebase Credentials${NC}"
        echo ""

        # Source .env to get values
        source .env

        if [ "$FIREBASE_PROJECT_ID" = "adcreatorpro-placeholder" ]; then
            echo -e "${YELLOW}⚠️  Firebase credentials in .env are still placeholders${NC}"
            echo "Please run ./scripts/setup-firebase.sh first, or update .env manually"
            exit 1
        fi

        echo "Updating Cloud Run with Firebase credentials from .env..."

        # Update backend Firebase vars
        gcloud run services update $SERVICE_NAME \
            --region $REGION \
            --set-env-vars="FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID,FIREBASE_CLIENT_EMAIL=$FIREBASE_CLIENT_EMAIL"

        echo ""
        echo -e "${GREEN}✅ Backend Firebase credentials updated${NC}"
        echo ""
        echo -e "${YELLOW}⚠️  IMPORTANT: Frontend Firebase config (VITE_*) requires rebuild${NC}"
        echo "Frontend Firebase variables are compiled into the bundle at build time."
        echo "To update them, choose option 6 (Full redeploy with rebuild)"
        ;;

    2)
        echo ""
        echo -e "${BLUE}🤖 Updating OpenAI API Key${NC}"
        echo ""

        source .env

        if [ "$OPENAI_API_KEY" = "sk-placeholder-UpdateWithRealOpenAIKey" ]; then
            echo -e "${YELLOW}⚠️  OpenAI key in .env is still placeholder${NC}"
            echo "Please update .env with your real OpenAI API key first"
            echo ""
            echo "Get your key from: https://platform.openai.com/api-keys"
            exit 1
        fi

        echo "Updating Cloud Run with OpenAI key from .env..."

        gcloud run services update $SERVICE_NAME \
            --region $REGION \
            --set-env-vars="OPENAI_API_KEY=$OPENAI_API_KEY"

        echo ""
        echo -e "${GREEN}✅ OpenAI API key updated${NC}"
        echo ""
        echo "Test ad generation at: https://adcreatorpro-1022196473572.us-central1.run.app"
        ;;

    3)
        echo ""
        echo -e "${BLUE}💳 Updating Stripe Credentials (Live Mode)${NC}"
        echo ""

        source .env

        if [[ "$STRIPE_SECRET_KEY" == *"test"* ]] || [ "$STRIPE_SECRET_KEY" = "sk_test_placeholder_key_for_development" ]; then
            echo -e "${YELLOW}⚠️  Stripe key in .env is still test mode or placeholder${NC}"
            echo "To switch to live mode:"
            echo "1. Get live API keys from: https://dashboard.stripe.com/apikeys"
            echo "2. Create live products (same pricing as test)"
            echo "3. Update .env with live keys (sk_live_* and pk_live_*)"
            echo "4. Run this script again"
            exit 1
        fi

        echo "Updating Cloud Run with Stripe credentials from .env..."

        gcloud run services update $SERVICE_NAME \
            --region $REGION \
            --set-env-vars="STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY,STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET,STRIPE_PRICE_STARTER=$STRIPE_PRICE_STARTER,STRIPE_PRICE_PRO=$STRIPE_PRICE_PRO,STRIPE_PRICE_BUSINESS=$STRIPE_PRICE_BUSINESS,STRIPE_PRICE_PAY_PER_AD=$STRIPE_PRICE_PAY_PER_AD"

        echo ""
        echo -e "${GREEN}✅ Stripe credentials updated${NC}"
        echo ""
        echo -e "${YELLOW}⚠️  IMPORTANT: Frontend Stripe key (VITE_STRIPE_PUBLISHABLE_KEY) requires rebuild${NC}"
        echo "To update it, choose option 6 (Full redeploy with rebuild)"
        ;;

    4)
        echo ""
        echo -e "${BLUE}📋 Updating All Backend Credentials${NC}"
        echo ""

        source .env

        echo "Updating Cloud Run with all backend environment variables from .env..."

        gcloud run services update $SERVICE_NAME \
            --region $REGION \
            --set-env-vars="NODE_ENV=$NODE_ENV,DATABASE_URL=$DATABASE_URL,CLOUD_SQL_CONNECTION_NAME=$CLOUD_SQL_CONNECTION_NAME,FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID,FIREBASE_CLIENT_EMAIL=$FIREBASE_CLIENT_EMAIL,OPENAI_API_KEY=$OPENAI_API_KEY,STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY,STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET,STRIPE_PRICE_STARTER=$STRIPE_PRICE_STARTER,STRIPE_PRICE_PRO=$STRIPE_PRICE_PRO,STRIPE_PRICE_BUSINESS=$STRIPE_PRICE_BUSINESS,STRIPE_PRICE_PAY_PER_AD=$STRIPE_PRICE_PAY_PER_AD,FRONTEND_URL=$FRONTEND_URL"

        echo ""
        echo -e "${GREEN}✅ All backend credentials updated${NC}"
        echo ""
        echo -e "${YELLOW}⚠️  IMPORTANT: Frontend variables (VITE_*) require rebuild${NC}"
        echo "For frontend variables to take effect, choose option 6 (Full redeploy)"
        ;;

    5)
        echo ""
        echo -e "${BLUE}📊 Current Environment Variables${NC}"
        echo ""

        gcloud run services describe $SERVICE_NAME \
            --region $REGION \
            --format="table(spec.template.spec.containers[0].env[].name, spec.template.spec.containers[0].env[].value)"

        echo ""
        ;;

    6)
        echo ""
        echo -e "${BLUE}🚀 Full Redeploy with Rebuild${NC}"
        echo ""
        echo "This will:"
        echo "  1. Load credentials from .env"
        echo "  2. Build frontend (compiles VITE_* variables)"
        echo "  3. Build backend"
        echo "  4. Build Docker image"
        echo "  5. Deploy to Cloud Run"
        echo "  6. Update all environment variables"
        echo ""
        read -p "Continue with full redeploy? (y/n): " confirm

        if [ "$confirm" != "y" ]; then
            echo "Cancelled."
            exit 0
        fi

        echo ""
        echo "Loading .env file..."
        source .env

        echo "Building application..."
        npm run build

        if [ ! -f "dist/index.js" ]; then
            echo -e "${RED}❌ Backend build failed${NC}"
            exit 1
        fi

        if [ ! -d "client/dist" ]; then
            echo -e "${RED}❌ Frontend build failed${NC}"
            exit 1
        fi

        echo ""
        echo -e "${GREEN}✅ Build successful${NC}"
        echo ""
        echo "Deploying to Cloud Run..."

        gcloud run deploy $SERVICE_NAME \
            --source . \
            --region $REGION \
            --platform managed \
            --allow-unauthenticated \
            --memory 512Mi \
            --timeout 300 \
            --max-instances 10 \
            --min-instances 0 \
            --add-cloudsql-instances="$CLOUD_SQL_CONNECTION_NAME" \
            --set-env-vars="NODE_ENV=$NODE_ENV,DATABASE_URL=$DATABASE_URL,CLOUD_SQL_CONNECTION_NAME=$CLOUD_SQL_CONNECTION_NAME,FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID,FIREBASE_CLIENT_EMAIL=$FIREBASE_CLIENT_EMAIL,FIREBASE_PRIVATE_KEY=$FIREBASE_PRIVATE_KEY,OPENAI_API_KEY=$OPENAI_API_KEY,STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY,STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET,STRIPE_PRICE_STARTER=$STRIPE_PRICE_STARTER,STRIPE_PRICE_PRO=$STRIPE_PRICE_PRO,STRIPE_PRICE_BUSINESS=$STRIPE_PRICE_BUSINESS,STRIPE_PRICE_PAY_PER_AD=$STRIPE_PRICE_PAY_PER_AD,VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY,VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN,VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID,VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET,VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID,VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID,VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY,FRONTEND_URL=$FRONTEND_URL"

        echo ""
        echo -e "${GREEN}✅ Deployment successful!${NC}"
        echo ""
        echo "Testing deployment..."

        SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format='value(status.url)')

        if curl -f -s "${SERVICE_URL}/api/health" > /dev/null; then
            echo -e "${GREEN}✅ Health check passed${NC}"
            echo ""
            echo "Service URL: $SERVICE_URL"
        else
            echo -e "${RED}❌ Health check failed${NC}"
            echo "Check logs: gcloud run services logs read $SERVICE_NAME --region $REGION"
        fi
        ;;

    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✨ Update complete!${NC}"
echo ""
echo "Useful commands:"
echo "  View logs: gcloud run services logs tail $SERVICE_NAME --region $REGION"
echo "  View status: gcloud run services describe $SERVICE_NAME --region $REGION"
echo "  Visit app: https://adcreatorpro-1022196473572.us-central1.run.app"
echo ""
