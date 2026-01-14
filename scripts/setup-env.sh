#!/bin/bash
# AdCreatorPro Environment Setup Script
# This script helps configure all necessary environment variables

set -e

echo "🎨 AdCreatorPro Environment Setup"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check for existing .env
if [ -f .env ]; then
  echo -e "${YELLOW}⚠️  .env file already exists${NC}"
  read -p "Do you want to backup and create a new one? (y/n): " backup
  if [ "$backup" = "y" ] || [ "$backup" = "Y" ]; then
    backup_file=".env.backup.$(date +%s)"
    cp .env "$backup_file"
    echo -e "${GREEN}✅ Backed up to $backup_file${NC}"
  else
    echo "Exiting without changes"
    exit 0
  fi
fi

# Copy from example
if [ ! -f .env.example ]; then
  echo -e "${RED}❌ .env.example not found!${NC}"
  exit 1
fi

cp .env.example .env
echo -e "${GREEN}✅ Created .env from .env.example${NC}"
echo ""

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

# Firebase Configuration
echo "📱 Firebase Configuration"
echo "-------------------------"
read -p "Do you have a Firebase service account JSON file? (y/n): " has_firebase_json

if [ "$has_firebase_json" = "y" ] || [ "$has_firebase_json" = "Y" ]; then
  read -p "Enter path to Firebase service account JSON: " firebase_json_path

  if [ -f "$firebase_json_path" ]; then
    # Extract values from JSON
    FIREBASE_PROJECT_ID=$(grep -o '"project_id": "[^"]*' "$firebase_json_path" | sed 's/"project_id": "//')
    FIREBASE_PRIVATE_KEY=$(grep -o '"private_key": "[^"]*' "$firebase_json_path" | sed 's/"private_key": "//')
    FIREBASE_CLIENT_EMAIL=$(grep -o '"client_email": "[^"]*' "$firebase_json_path" | sed 's/"client_email": "//')

    # Read entire JSON as service account
    FIREBASE_SERVICE_ACCOUNT=$(cat "$firebase_json_path")

    update_env "FIREBASE_PROJECT_ID" "$FIREBASE_PROJECT_ID"
    update_env "FIREBASE_PRIVATE_KEY" "$FIREBASE_PRIVATE_KEY"
    update_env "FIREBASE_CLIENT_EMAIL" "$FIREBASE_CLIENT_EMAIL"
    update_env "FIREBASE_SERVICE_ACCOUNT" "$FIREBASE_SERVICE_ACCOUNT"

    echo -e "${GREEN}✅ Firebase backend config loaded from JSON${NC}"
  else
    echo -e "${RED}❌ File not found: $firebase_json_path${NC}"
    exit 1
  fi
else
  read -p "Enter Firebase Project ID: " firebase_project_id
  read -p "Enter Firebase Private Key: " firebase_private_key
  read -p "Enter Firebase Client Email: " firebase_client_email

  update_env "FIREBASE_PROJECT_ID" "$firebase_project_id"
  update_env "FIREBASE_PRIVATE_KEY" "$firebase_private_key"
  update_env "FIREBASE_CLIENT_EMAIL" "$firebase_client_email"
fi

# Frontend Firebase Config
echo ""
echo "Frontend Firebase Configuration:"
read -p "Enter VITE_FIREBASE_API_KEY: " vite_api_key
read -p "Enter VITE_FIREBASE_AUTH_DOMAIN: " vite_auth_domain
read -p "Enter VITE_FIREBASE_PROJECT_ID: " vite_project_id
read -p "Enter VITE_FIREBASE_STORAGE_BUCKET: " vite_storage_bucket
read -p "Enter VITE_FIREBASE_MESSAGING_SENDER_ID: " vite_sender_id
read -p "Enter VITE_FIREBASE_APP_ID: " vite_app_id

update_env "VITE_FIREBASE_API_KEY" "$vite_api_key"
update_env "VITE_FIREBASE_AUTH_DOMAIN" "$vite_auth_domain"
update_env "VITE_FIREBASE_PROJECT_ID" "$vite_project_id"
update_env "VITE_FIREBASE_STORAGE_BUCKET" "$vite_storage_bucket"
update_env "VITE_FIREBASE_MESSAGING_SENDER_ID" "$vite_sender_id"
update_env "VITE_FIREBASE_APP_ID" "$vite_app_id"

echo -e "${GREEN}✅ Firebase frontend config set${NC}"
echo ""

# OpenAI Configuration
echo "🤖 OpenAI Configuration"
echo "----------------------"
read -p "Enter OpenAI API Key (sk-...): " openai_key

if [[ ! $openai_key =~ ^sk- ]]; then
  echo -e "${YELLOW}⚠️  Warning: API key doesn't start with 'sk-'. Are you sure it's correct?${NC}"
fi

update_env "OPENAI_API_KEY" "$openai_key"
echo -e "${GREEN}✅ OpenAI API key set${NC}"
echo ""

# Database Configuration
echo "🗄️  Database Configuration"
echo "-------------------------"
read -p "Enter Cloud SQL connection name (project:region:instance): " cloud_sql_connection

# Build DATABASE_URL
read -p "Enter database name (default: adcreatorpro_db): " db_name
db_name=${db_name:-adcreatorpro_db}

read -p "Enter database user (default: adcreatorpro_user): " db_user
db_user=${db_user:-adcreatorpro_user}

read -p "Enter database password: " db_password

DATABASE_URL="postgresql://${db_user}:${db_password}@localhost/${db_name}?host=/cloudsql/${cloud_sql_connection}"

update_env "CLOUD_SQL_CONNECTION_NAME" "$cloud_sql_connection"
update_env "DATABASE_URL" "$DATABASE_URL"
update_env "DB_NAME" "$db_name"
update_env "DB_USER" "$db_user"
update_env "DB_PASSWORD" "$db_password"

echo -e "${GREEN}✅ Database configuration set${NC}"
echo ""

# Stripe Configuration
echo "💳 Stripe Configuration"
echo "----------------------"

# Check if price IDs file exists
price_ids_file="../../../infrastructure/stripe/price-ids/adcreatorpro-price-ids.txt"
if [ -f "$price_ids_file" ]; then
  echo -e "${GREEN}✅ Found Stripe price IDs file${NC}"

  # Parse price IDs from file
  STRIPE_PRICE_STARTER=$(grep "STRIPE_PRICE_STARTER" "$price_ids_file" | cut -d'=' -f2)
  STRIPE_PRICE_PRO=$(grep "STRIPE_PRICE_PRO" "$price_ids_file" | cut -d'=' -f2)
  STRIPE_PRICE_BUSINESS=$(grep "STRIPE_PRICE_BUSINESS" "$price_ids_file" | cut -d'=' -f2)
  STRIPE_PRICE_PAY_PER_AD=$(grep "STRIPE_PRICE_PAY_PER_AD" "$price_ids_file" | cut -d'=' -f2)

  update_env "STRIPE_PRICE_STARTER" "$STRIPE_PRICE_STARTER"
  update_env "STRIPE_PRICE_PRO" "$STRIPE_PRICE_PRO"
  update_env "STRIPE_PRICE_BUSINESS" "$STRIPE_PRICE_BUSINESS"
  update_env "STRIPE_PRICE_PAY_PER_AD" "$STRIPE_PRICE_PAY_PER_AD"

  echo "  Starter: $STRIPE_PRICE_STARTER"
  echo "  Pro: $STRIPE_PRICE_PRO"
  echo "  Business: $STRIPE_PRICE_BUSINESS"
  echo "  Pay-per-ad: $STRIPE_PRICE_PAY_PER_AD"
else
  echo -e "${YELLOW}⚠️  Price IDs file not found. Please enter manually.${NC}"
  read -p "Enter STRIPE_PRICE_STARTER: " stripe_price_starter
  read -p "Enter STRIPE_PRICE_PRO: " stripe_price_pro
  read -p "Enter STRIPE_PRICE_BUSINESS: " stripe_price_business
  read -p "Enter STRIPE_PRICE_PAY_PER_AD: " stripe_price_pay_per_ad

  update_env "STRIPE_PRICE_STARTER" "$stripe_price_starter"
  update_env "STRIPE_PRICE_PRO" "$stripe_price_pro"
  update_env "STRIPE_PRICE_BUSINESS" "$stripe_price_business"
  update_env "STRIPE_PRICE_PAY_PER_AD" "$stripe_price_pay_per_ad"
fi

echo ""
read -p "Enter Stripe Secret Key (sk_live_... or sk_test_...): " stripe_secret_key

if [[ ! $stripe_secret_key =~ ^sk_(live|test)_ ]]; then
  echo -e "${YELLOW}⚠️  Warning: Key doesn't match expected format${NC}"
fi

update_env "STRIPE_SECRET_KEY" "$stripe_secret_key"

read -p "Enter Stripe Publishable Key (pk_live_... or pk_test_...): " stripe_publishable_key
update_env "VITE_STRIPE_PUBLISHABLE_KEY" "$stripe_publishable_key"

read -p "Enter Stripe Webhook Secret (whsec_...): " stripe_webhook_secret
update_env "STRIPE_WEBHOOK_SECRET" "$stripe_webhook_secret"

echo -e "${GREEN}✅ Stripe configuration set${NC}"
echo ""

# Frontend URL
echo "🌐 Application URL"
echo "-----------------"
read -p "Enter frontend URL (default: http://localhost:8080): " frontend_url
frontend_url=${frontend_url:-http://localhost:8080}

update_env "FRONTEND_URL" "$frontend_url"
echo -e "${GREEN}✅ Frontend URL set to $frontend_url${NC}"
echo ""

# Summary
echo "======================================"
echo -e "${GREEN}✅ Environment configuration complete!${NC}"
echo "======================================"
echo ""
echo "Configuration saved to .env"
echo ""
echo "Next steps:"
echo "1. Review .env file and verify all values"
echo "2. Test database connection: ./scripts/test-db-connection.sh"
echo "3. Run the application: npm run dev"
echo ""
echo -e "${YELLOW}⚠️  Important: Never commit .env file to version control!${NC}"
