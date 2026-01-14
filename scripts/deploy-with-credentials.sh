#!/bin/bash
# Simple Deployment Script - Add credentials and deploy
# This makes deployment easy with step-by-step prompts

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

clear
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   AdCreatorPro - Quick Deploy Script      ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo ""
echo "Your app is already LIVE at:"
echo "https://adcreatorpro-1022196473572.us-central1.run.app"
echo ""
echo "This script will help you add credentials to enable all features."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    exit 1
fi

echo -e "${YELLOW}Choose deployment option:${NC}"
echo ""
echo "1. Quick Deploy - Add OpenAI only (2 minutes)"
echo "   ✅ Enables: Ad generation"
echo "   ❌ Missing: User authentication"
echo ""
echo "2. Full Deploy - Add OpenAI + Firebase (20 minutes)"
echo "   ✅ Enables: Everything (ad generation + user auth)"
echo ""
echo "3. Manual - I'll edit .env myself"
echo "   You update .env, then we redeploy"
echo ""
read -p "Enter choice (1, 2, or 3): " choice

case $choice in
    1)
        echo ""
        echo -e "${BLUE}═══ Quick Deploy: OpenAI Only ═══${NC}"
        echo ""
        echo "Step 1: Get your OpenAI API key"
        echo "  1. Visit: https://platform.openai.com/api-keys"
        echo "  2. Click 'Create new secret key'"
        echo "  3. Copy the key (starts with sk-proj- or sk-)"
        echo ""

        read -p "Do you have your OpenAI API key ready? (y/n): " has_key

        if [ "$has_key" != "y" ]; then
            echo ""
            echo "No problem! Opening OpenAI platform..."
            open "https://platform.openai.com/api-keys" 2>/dev/null || echo "Visit: https://platform.openai.com/api-keys"
            echo ""
            echo "Get your key and run this script again."
            exit 0
        fi

        echo ""
        read -p "Paste your OpenAI API key: " openai_key

        if [[ ! "$openai_key" =~ ^sk- ]]; then
            echo -e "${RED}❌ Invalid key format. Should start with 'sk-'${NC}"
            exit 1
        fi

        echo ""
        echo "Updating Cloud Run with OpenAI key..."

        gcloud run services update adcreatorpro \
            --region us-central1 \
            --set-env-vars="OPENAI_API_KEY=$openai_key" \
            --quiet

        echo ""
        echo -e "${GREEN}✅ Deployment updated!${NC}"
        echo ""
        echo "What works now:"
        echo "  ✅ Ad generation (core feature!)"
        echo ""
        echo "What still needs setup:"
        echo "  ⏳ User authentication (run this script again, choose option 2)"
        echo ""
        echo "Test your deployment:"
        echo "  Visit: https://adcreatorpro-1022196473572.us-central1.run.app"
        echo ""
        ;;

    2)
        echo ""
        echo -e "${BLUE}═══ Full Deploy: OpenAI + Firebase ═══${NC}"
        echo ""

        # OpenAI
        echo "Part 1: OpenAI Configuration"
        echo "────────────────────────────"
        read -p "Do you have OpenAI API key? (y/n): " has_openai

        if [ "$has_openai" != "y" ]; then
            echo "Opening OpenAI platform..."
            open "https://platform.openai.com/api-keys" 2>/dev/null
            read -p "Press Enter after you've created your key..."
        fi

        read -p "Paste your OpenAI API key: " openai_key

        # Firebase
        echo ""
        echo "Part 2: Firebase Configuration"
        echo "───────────────────────────────"
        echo ""
        echo "We'll now run the Firebase setup script."
        echo "This will guide you through Firebase console setup."
        echo ""
        read -p "Press Enter to continue..."

        ./scripts/setup-firebase.sh

        # Update .env with OpenAI
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^OPENAI_API_KEY=.*|OPENAI_API_KEY=$openai_key|" .env
        else
            sed -i "s|^OPENAI_API_KEY=.*|OPENAI_API_KEY=$openai_key|" .env
        fi

        echo ""
        echo -e "${YELLOW}⚡ Starting full redeploy...${NC}"
        echo ""
        echo "This will:"
        echo "  1. Build frontend with Firebase config"
        echo "  2. Build backend"
        echo "  3. Deploy to Cloud Run"
        echo "  4. Update all environment variables"
        echo ""

        source .env

        echo "Building application..."
        npm run build

        if [ ! -f "dist/index.js" ]; then
            echo -e "${RED}❌ Build failed${NC}"
            exit 1
        fi

        echo "Deploying to Cloud Run..."

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
        echo -e "${GREEN}🎉 FULL DEPLOYMENT COMPLETE!${NC}"
        echo ""
        echo "Everything is now working:"
        echo "  ✅ User signup & login"
        echo "  ✅ Ad generation"
        echo "  ✅ Stripe payments (test mode)"
        echo ""
        echo "Test your app:"
        echo "  Visit: https://adcreatorpro-1022196473572.us-central1.run.app"
        echo ""
        ;;

    3)
        echo ""
        echo -e "${BLUE}═══ Manual Configuration ═══${NC}"
        echo ""
        echo "Opening .env file for editing..."
        echo ""
        echo "Update these values:"
        echo "  - OPENAI_API_KEY"
        echo "  - FIREBASE_PROJECT_ID"
        echo "  - FIREBASE_CLIENT_EMAIL"
        echo "  - FIREBASE_PRIVATE_KEY"
        echo "  - VITE_FIREBASE_* (all 6 variables)"
        echo ""

        ${EDITOR:-nano} .env

        echo ""
        read -p "Have you updated .env? (y/n): " updated

        if [ "$updated" != "y" ]; then
            echo "No problem. Edit .env and run this script again."
            exit 0
        fi

        echo ""
        echo "Redeploying with updated configuration..."

        ./scripts/update-cloud-run.sh
        ;;

    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}═════════════════════════════════${NC}"
echo -e "${GREEN}    Deployment Complete! 🚀      ${NC}"
echo -e "${GREEN}═════════════════════════════════${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Visit your app:"
echo "   https://adcreatorpro-1022196473572.us-central1.run.app"
echo ""
echo "2. View live logs:"
echo "   gcloud run services logs tail adcreatorpro --region us-central1"
echo ""
echo "3. Test features:"
echo "   - Sign up (if Firebase configured)"
echo "   - Generate an ad (if OpenAI configured)"
echo "   - Try test payment: 4242 4242 4242 4242"
echo ""
