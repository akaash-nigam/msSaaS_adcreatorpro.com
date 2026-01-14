#!/bin/bash
# Complete Stripe Configuration for AdCreatorPro
# Supports Canada and US payment processing

set -e

echo "💳 Stripe Payment Configuration for AdCreatorPro"
echo "================================================"
echo ""
echo "This script will help you configure Stripe for payment processing"
echo "in Canada and the United States."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file${NC}"
    echo ""
fi

# Function to update .env file
update_env() {
    local key=$1
    local value=$2

    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|^${key}=.*|${key}=${value}|" .env
    else
        # Linux
        sed -i "s|^${key}=.*|${key}=${value}|" .env
    fi
}

echo -e "${BLUE}📋 Stripe Setup Overview:${NC}"
echo ""
echo "We'll configure:"
echo "  1. Stripe account (supporting Canada & US)"
echo "  2. API keys (test mode to start)"
echo "  3. Products and pricing"
echo "  4. Webhook endpoint"
echo ""

read -p "Do you have a Stripe account already? (y/n): " has_account

if [ "$has_account" != "y" ]; then
    echo ""
    echo -e "${YELLOW}📝 Creating a Stripe Account${NC}"
    echo "=============================="
    echo ""
    echo "1. Go to https://stripe.com"
    echo "2. Click 'Start now' or 'Sign up'"
    echo "3. Enter your email and create password"
    echo "4. Provide business information:"
    echo "   - Business type: Individual or Company"
    echo "   - Country: Canada or United States"
    echo "   - Business name: Your business name"
    echo ""
    echo "5. Complete identity verification (required by Stripe)"
    echo "6. Add bank account details (for receiving payouts)"
    echo ""
    echo "Opening Stripe signup page..."
    open "https://dashboard.stripe.com/register" 2>/dev/null || \
    echo "Please visit: https://dashboard.stripe.com/register"
    echo ""
    read -p "Press Enter when you've created your Stripe account..."
fi

echo ""
echo -e "${YELLOW}🔑 Step 1: Get API Keys${NC}"
echo "======================="
echo ""
echo "We'll start with TEST MODE keys (no real money charged)"
echo ""
echo "1. Go to https://dashboard.stripe.com/test/apikeys"
echo "2. You'll see two types of keys:"
echo "   - Publishable key (pk_test_...)"
echo "   - Secret key (sk_test_...) - click 'Reveal test key token'"
echo ""
echo "Opening Stripe Dashboard..."
open "https://dashboard.stripe.com/test/apikeys" 2>/dev/null || \
echo "Please visit: https://dashboard.stripe.com/test/apikeys"
echo ""
read -p "Press Enter when you can see your API keys..."

echo ""
read -p "Enter your Publishable key (pk_test_...): " publishable_key
update_env "VITE_STRIPE_PUBLISHABLE_KEY" "$publishable_key"

read -p "Enter your Secret key (sk_test_...): " secret_key
update_env "STRIPE_SECRET_KEY" "$secret_key"

echo ""
echo -e "${GREEN}✅ API keys saved!${NC}"
echo ""

echo ""
echo -e "${YELLOW}💰 Step 2: Create Products & Prices${NC}"
echo "===================================="
echo ""
echo "We'll create 4 products for AdCreatorPro:"
echo ""
echo "1. Starter Plan - $9/month (30 ads)"
echo "2. Pro Plan - $29/month (unlimited ads)"
echo "3. Business Plan - $79/month (unlimited ads + priority support)"
echo "4. Pay-per-Ad - $1.99 per ad (one-time purchase)"
echo ""
echo "You can create these:"
echo "  A) Automatically using Stripe CLI (recommended)"
echo "  B) Manually in Stripe Dashboard"
echo ""

read -p "Do you have Stripe CLI installed? (y/n): " has_cli

if [ "$has_cli" = "y" ]; then
    echo ""
    echo "Creating products automatically..."
    echo ""

    # Check if already logged in
    stripe --version > /dev/null 2>&1 || {
        echo "Logging in to Stripe CLI..."
        stripe login
    }

    echo "Creating Starter Plan..."
    starter_price=$(stripe prices create \
        --currency=usd \
        --unit-amount=900 \
        --recurring[interval]=month \
        --product-data[name]="Starter Plan" \
        --product-data[description]="30 AI-generated ads per month" \
        --format=json 2>/dev/null | grep -o '"id": "[^"]*' | sed 's/"id": "//' | head -1)

    if [ -n "$starter_price" ]; then
        echo -e "${GREEN}✅ Starter Plan created: $starter_price${NC}"
        update_env "STRIPE_PRICE_STARTER" "$starter_price"
    fi

    echo "Creating Pro Plan..."
    pro_price=$(stripe prices create \
        --currency=usd \
        --unit-amount=2900 \
        --recurring[interval]=month \
        --product-data[name]="Pro Plan" \
        --product-data[description]="Unlimited AI-generated ads per month" \
        --format=json 2>/dev/null | grep -o '"id": "[^"]*' | sed 's/"id": "//' | head -1)

    if [ -n "$pro_price" ]; then
        echo -e "${GREEN}✅ Pro Plan created: $pro_price${NC}"
        update_env "STRIPE_PRICE_PRO" "$pro_price"
    fi

    echo "Creating Business Plan..."
    business_price=$(stripe prices create \
        --currency=usd \
        --unit-amount=7900 \
        --recurring[interval]=month \
        --product-data[name]="Business Plan" \
        --product-data[description]="Unlimited ads + priority support" \
        --format=json 2>/dev/null | grep -o '"id": "[^"]*' | sed 's/"id": "//' | head -1)

    if [ -n "$business_price" ]; then
        echo -e "${GREEN}✅ Business Plan created: $business_price${NC}"
        update_env "STRIPE_PRICE_BUSINESS" "$business_price"
    fi

    echo "Creating Pay-per-Ad..."
    pay_per_ad_price=$(stripe prices create \
        --currency=usd \
        --unit-amount=199 \
        --product-data[name]="Pay-per-Ad" \
        --product-data[description]="Single AI-generated ad" \
        --format=json 2>/dev/null | grep -o '"id": "[^"]*' | sed 's/"id": "//' | head -1)

    if [ -n "$pay_per_ad_price" ]; then
        echo -e "${GREEN}✅ Pay-per-Ad created: $pay_per_ad_price${NC}"
        update_env "STRIPE_PRICE_PAY_PER_AD" "$pay_per_ad_price"
    fi

    echo ""
    echo -e "${GREEN}✅ All products created automatically!${NC}"

else
    echo ""
    echo -e "${YELLOW}Creating products manually...${NC}"
    echo ""
    echo "Please follow these steps in Stripe Dashboard:"
    echo ""
    echo "1. Go to https://dashboard.stripe.com/test/products"
    echo ""
    echo "For EACH product:"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "PRODUCT 1: Starter Plan"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  - Click '+ Add product'"
    echo "  - Name: Starter Plan"
    echo "  - Description: 30 AI-generated ads per month"
    echo "  - Pricing: Recurring"
    echo "  - Price: $9.00 USD"
    echo "  - Billing period: Monthly"
    echo "  - Click 'Save product'"
    echo "  - Copy the Price ID (starts with price_)"
    echo ""

    open "https://dashboard.stripe.com/test/products/create" 2>/dev/null || \
    echo "Visit: https://dashboard.stripe.com/test/products/create"
    read -p "Press Enter when created, then enter Price ID: " starter_price
    update_env "STRIPE_PRICE_STARTER" "$starter_price"

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "PRODUCT 2: Pro Plan"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  - Name: Pro Plan"
    echo "  - Description: Unlimited AI-generated ads"
    echo "  - Price: $29.00 USD monthly"
    echo ""

    read -p "Press Enter when created, then enter Price ID: " pro_price
    update_env "STRIPE_PRICE_PRO" "$pro_price"

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "PRODUCT 3: Business Plan"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  - Name: Business Plan"
    echo "  - Description: Unlimited ads + priority support"
    echo "  - Price: $79.00 USD monthly"
    echo ""

    read -p "Press Enter when created, then enter Price ID: " business_price
    update_env "STRIPE_PRICE_BUSINESS" "$business_price"

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "PRODUCT 4: Pay-per-Ad"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  - Name: Pay-per-Ad"
    echo "  - Description: Single AI-generated ad"
    echo "  - Pricing: One-time"
    echo "  - Price: $1.99 USD"
    echo ""

    read -p "Press Enter when created, then enter Price ID: " pay_per_ad_price
    update_env "STRIPE_PRICE_PAY_PER_AD" "$pay_per_ad_price"
fi

echo ""
echo -e "${GREEN}✅ All products configured!${NC}"
echo ""

echo ""
echo -e "${YELLOW}🔗 Step 3: Configure Webhook${NC}"
echo "============================="
echo ""
echo "Webhooks allow Stripe to notify your app about payment events."
echo ""
echo "For local development:"
echo "  We'll use Stripe CLI to forward webhooks to localhost"
echo ""
echo "For production:"
echo "  We'll create a webhook endpoint pointing to your Cloud Run URL"
echo ""

read -p "Are you setting up for local development or production? (local/production): " environment

if [ "$environment" = "local" ]; then
    echo ""
    echo "Starting Stripe webhook forwarding..."
    echo ""
    echo -e "${BLUE}This will run in the foreground.${NC}"
    echo "Keep this terminal open while developing."
    echo "The webhook secret will be displayed - copy it to your .env"
    echo ""
    read -p "Press Enter to start forwarding..."

    echo ""
    stripe listen --forward-to localhost:8080/api/stripe/webhook

else
    echo ""
    read -p "Enter your Cloud Run service URL (without https://): " service_url

    WEBHOOK_URL="https://${service_url}/api/stripe/webhook"

    echo ""
    echo "Creating webhook endpoint: $WEBHOOK_URL"
    echo ""

    webhook_output=$(stripe webhooks create \
        --url "$WEBHOOK_URL" \
        --events checkout.session.completed \
        --events customer.subscription.updated \
        --events customer.subscription.deleted \
        --events invoice.payment_succeeded \
        --events invoice.payment_failed \
        --format json 2>&1)

    webhook_secret=$(echo "$webhook_output" | grep -o '"secret": "[^"]*' | sed 's/"secret": "//')

    if [ -n "$webhook_secret" ]; then
        echo -e "${GREEN}✅ Webhook created!${NC}"
        echo ""
        echo "Webhook Secret: $webhook_secret"
        update_env "STRIPE_WEBHOOK_SECRET" "$webhook_secret"
        echo ""
        echo -e "${GREEN}✅ Webhook secret saved to .env${NC}"
    else
        echo -e "${RED}❌ Failed to create webhook${NC}"
        echo "Please create it manually in Stripe Dashboard"
    fi
fi

echo ""
echo "======================================="
echo -e "${GREEN}🎉 Stripe Configuration Complete!${NC}"
echo "======================================="
echo ""
echo -e "${BLUE}📋 Configuration Summary:${NC}"
echo ""
echo "  ✅ API Keys: Configured"
echo "  ✅ Starter Plan ($9/month): $starter_price"
echo "  ✅ Pro Plan ($29/month): $pro_price"
echo "  ✅ Business Plan ($79/month): $business_price"
echo "  ✅ Pay-per-Ad ($1.99): $pay_per_ad_price"
if [ "$environment" = "production" ]; then
    echo "  ✅ Webhook: Configured for production"
else
    echo "  ℹ️  Webhook: Use 'stripe listen' for local development"
fi
echo ""
echo -e "${YELLOW}💡 Next Steps:${NC}"
echo ""
echo "1. Test payment in TEST MODE:"
echo "   - Start your app: npm run dev"
echo "   - Visit: http://localhost:8080/pricing"
echo "   - Use test card: 4242 4242 4242 4242"
echo "   - Any future date for expiry"
echo "   - Any 3-digit CVC"
echo ""
echo "2. When ready for LIVE MODE:"
echo "   - Activate your Stripe account (complete verification)"
echo "   - Get LIVE API keys from https://dashboard.stripe.com/apikeys"
echo "   - Create products in LIVE mode"
echo "   - Update .env with live keys (sk_live_... and pk_live_...)"
echo "   - Create live webhook"
echo ""
echo "3. Monitor payments:"
echo "   - Test mode: https://dashboard.stripe.com/test/payments"
echo "   - Live mode: https://dashboard.stripe.com/payments"
echo ""
echo -e "${BLUE}🌍 Supported Regions:${NC}"
echo "  ✅ Canada (CAD or USD)"
echo "  ✅ United States (USD)"
echo ""
echo "Note: Stripe automatically handles currency conversion"
echo "and local payment methods for each region."
echo ""
echo -e "${GREEN}✨ Stripe is ready to process payments!${NC}"
echo ""
