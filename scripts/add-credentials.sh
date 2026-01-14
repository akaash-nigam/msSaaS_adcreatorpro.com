#!/bin/bash
# Add OpenAI and Firebase Credentials
# Interactive script to collect and deploy credentials

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

clear
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Add OpenAI & Firebase Credentials       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo "This script will collect your credentials and update"
echo "your deployment at https://adcreatorpro.com"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    exit 1
fi

# Function to update .env
update_env() {
    local key=$1
    local value=$2

    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^${key}=.*|${key}=${value}|" .env
    else
        sed -i "s|^${key}=.*|${key}=${value}|" .env
    fi
}

echo -e "${YELLOW}═══════════════════════════════════════${NC}"
echo -e "${YELLOW}Part 1: OpenAI API Key${NC}"
echo -e "${YELLOW}═══════════════════════════════════════${NC}"
echo ""
echo "📋 Instructions:"
echo "  1. Go to: https://platform.openai.com/api-keys"
echo "  2. Click 'Create new secret key'"
echo "  3. Copy the key (starts with sk-)"
echo ""

read -p "Do you have your OpenAI API key ready? (y/n): " has_openai

if [ "$has_openai" != "y" ]; then
    echo ""
    echo "Opening OpenAI platform..."
    open "https://platform.openai.com/api-keys" 2>/dev/null || echo "Visit: https://platform.openai.com/api-keys"
    echo ""
    read -p "Press Enter when you have your key..."
fi

echo ""
read -p "Paste your OpenAI API key: " OPENAI_KEY

# Validate OpenAI key format
if [[ ! "$OPENAI_KEY" =~ ^sk- ]]; then
    echo -e "${RED}❌ Invalid key format. Should start with 'sk-'${NC}"
    exit 1
fi

echo -e "${GREEN}✅ OpenAI key validated${NC}"
update_env "OPENAI_API_KEY" "$OPENAI_KEY"

echo ""
echo -e "${YELLOW}═══════════════════════════════════════${NC}"
echo -e "${YELLOW}Part 2: Firebase Credentials${NC}"
echo -e "${YELLOW}═══════════════════════════════════════${NC}"
echo ""

read -p "Do you have Firebase credentials ready? (y/n): " has_firebase

if [ "$has_firebase" != "y" ]; then
    echo ""
    echo "Opening Firebase Console..."
    open "https://console.firebase.google.com" 2>/dev/null || echo "Visit: https://console.firebase.google.com"
    echo ""
    echo "📋 Quick Guide:"
    echo "  1. Create/select project 'adcreatorpro'"
    echo "  2. Enable Authentication → Email/Password"
    echo "  3. Get Web App config (6 values)"
    echo "  4. Download Service Account key (JSON file)"
    echo ""
    echo "See GET_CREDENTIALS.md for detailed instructions"
    echo ""
    read -p "Press Enter when ready..."
fi

echo ""
echo "━━━ Firebase Backend (Service Account) ━━━"
echo ""

read -p "Project ID (e.g., adcreatorpro): " FB_PROJECT_ID
read -p "Client Email (e.g., firebase-adminsdk-...@...iam.gserviceaccount.com): " FB_CLIENT_EMAIL

echo ""
echo "For Private Key:"
echo "  - Paste the ENTIRE key including -----BEGIN PRIVATE KEY-----"
echo "  - Press Enter, then paste key content, then press Enter"
echo "  - Type 'END' on a new line when done"
echo ""
read -p "Paste Private Key and press Enter: " -r FB_PRIVATE_KEY_LINE1

# Read multi-line private key
FB_PRIVATE_KEY="$FB_PRIVATE_KEY_LINE1"
while IFS= read -r line; do
    if [ "$line" = "END" ]; then
        break
    fi
    FB_PRIVATE_KEY="${FB_PRIVATE_KEY}\n${line}"
done

echo ""
echo "━━━ Firebase Frontend (Web App Config) ━━━"
echo ""

read -p "API Key (starts with AIzaSy...): " FB_WEB_API_KEY
read -p "Auth Domain (e.g., adcreatorpro.firebaseapp.com): " FB_AUTH_DOMAIN
read -p "Project ID (same as backend): " FB_WEB_PROJECT_ID
read -p "Storage Bucket (e.g., adcreatorpro.appspot.com): " FB_STORAGE_BUCKET
read -p "Messaging Sender ID (numbers): " FB_SENDER_ID
read -p "App ID (e.g., 1:123...:web:abc...): " FB_APP_ID

echo ""
echo -e "${BLUE}Updating .env file...${NC}"

# Update all Firebase values
update_env "FIREBASE_PROJECT_ID" "$FB_PROJECT_ID"
update_env "FIREBASE_CLIENT_EMAIL" "$FB_CLIENT_EMAIL"
update_env "FIREBASE_PRIVATE_KEY" "\"$FB_PRIVATE_KEY\""

update_env "VITE_FIREBASE_API_KEY" "$FB_WEB_API_KEY"
update_env "VITE_FIREBASE_AUTH_DOMAIN" "$FB_AUTH_DOMAIN"
update_env "VITE_FIREBASE_PROJECT_ID" "$FB_WEB_PROJECT_ID"
update_env "VITE_FIREBASE_STORAGE_BUCKET" "$FB_STORAGE_BUCKET"
update_env "VITE_FIREBASE_MESSAGING_SENDER_ID" "$FB_SENDER_ID"
update_env "VITE_FIREBASE_APP_ID" "$FB_APP_ID"

echo -e "${GREEN}✅ All credentials saved to .env${NC}"

echo ""
echo -e "${YELLOW}═══════════════════════════════════════${NC}"
echo -e "${YELLOW}Deploying to Production${NC}"
echo -e "${YELLOW}═══════════════════════════════════════${NC}"
echo ""
echo "This will:"
echo "  1. Build frontend with Firebase config"
echo "  2. Build backend"
echo "  3. Deploy to Cloud Run"
echo "  4. Update environment variables"
echo ""

read -p "Continue with deployment? (y/n): " deploy_confirm

if [ "$deploy_confirm" != "y" ]; then
    echo ""
    echo "Credentials saved to .env"
    echo "Run this script again to deploy, or run:"
    echo "  ./scripts/update-cloud-run.sh"
    exit 0
fi

echo ""
echo -e "${BLUE}Building application...${NC}"

# Source .env
source .env

# Build
npm run build

if [ ! -f "dist/index.js" ]; then
    echo -e "${RED}❌ Backend build failed${NC}"
    exit 1
fi

if [ ! -d "client/dist" ]; then
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"

echo ""
echo -e "${BLUE}Deploying to Cloud Run...${NC}"

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
    --set-env-vars="NODE_ENV=$NODE_ENV,DATABASE_URL=$DATABASE_URL,CLOUD_SQL_CONNECTION_NAME=$CLOUD_SQL_CONNECTION_NAME,FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID,FIREBASE_CLIENT_EMAIL=$FIREBASE_CLIENT_EMAIL,FIREBASE_PRIVATE_KEY=$FIREBASE_PRIVATE_KEY,OPENAI_API_KEY=$OPENAI_API_KEY,STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY,STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET,STRIPE_PRICE_STARTER=$STRIPE_PRICE_STARTER,STRIPE_PRICE_PRO=$STRIPE_PRICE_PRO,STRIPE_PRICE_BUSINESS=$STRIPE_PRICE_BUSINESS,STRIPE_PRICE_PAY_PER_AD=$STRIPE_PRICE_PAY_PER_AD,VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY,VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN,VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID,VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET,VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID,VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID,VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY,FRONTEND_URL=$FRONTEND_URL" \
    --quiet

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   🎉 DEPLOYMENT COMPLETE!                  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo "Your app is now fully functional at:"
echo -e "${BLUE}https://adcreatorpro.com${NC}"
echo ""
echo "What's now enabled:"
echo "  ✅ User signup & login (Firebase)"
echo "  ✅ Ad generation (OpenAI)"
echo "  ✅ Payment processing (Stripe)"
echo ""
echo "Test your app:"
echo "  1. Visit https://adcreatorpro.com"
echo "  2. Sign up with your email"
echo "  3. Generate an ad"
echo "  4. Try payment with test card: 4242 4242 4242 4242"
echo ""
echo "View logs:"
echo "  gcloud run services logs tail adcreatorpro --region us-central1"
echo ""
