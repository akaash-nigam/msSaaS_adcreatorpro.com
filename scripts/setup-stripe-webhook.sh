#!/bin/bash
# Stripe Webhook Configuration Script

set -e

echo "💳 Setting up Stripe Webhook"
echo "============================="
echo ""

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
else
  echo "❌ .env file not found!"
  exit 1
fi

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
  echo "❌ Stripe CLI not found!"
  echo ""
  echo "Install Stripe CLI:"
  echo "  macOS: brew install stripe/stripe-cli/stripe"
  echo "  Other: https://stripe.com/docs/stripe-cli#install"
  echo ""
  exit 1
fi

echo "✅ Stripe CLI found"
echo ""

# Login to Stripe
echo "Checking Stripe CLI authentication..."
stripe --version > /dev/null 2>&1 || {
  echo "Please login to Stripe CLI:"
  stripe login
}

echo "✅ Authenticated with Stripe"
echo ""

# Get service URL
read -p "Enter your Cloud Run service URL (or press Enter for local testing): " service_url

if [ -z "$service_url" ]; then
  # Local development mode
  echo ""
  echo "🔧 Local Development Mode"
  echo "========================"
  echo ""
  echo "Starting Stripe webhook forwarding to localhost:8080..."
  echo "This will create a temporary webhook endpoint."
  echo ""
  echo "Copy the webhook signing secret (whsec_...) and add it to your .env file:"
  echo "STRIPE_WEBHOOK_SECRET=whsec_..."
  echo ""
  echo "Press Ctrl+C to stop forwarding."
  echo ""

  stripe listen --forward-to localhost:8080/api/stripe/webhook
else
  # Production mode
  WEBHOOK_URL="${service_url}/api/stripe/webhook"

  echo ""
  echo "🚀 Production Mode"
  echo "=================="
  echo ""
  echo "Creating webhook endpoint: $WEBHOOK_URL"
  echo ""

  # Required events
  EVENTS="checkout.session.completed,customer.subscription.updated,customer.subscription.deleted,invoice.payment_succeeded,invoice.payment_failed"

  echo "Subscribing to events:"
  echo "  - checkout.session.completed"
  echo "  - customer.subscription.updated"
  echo "  - customer.subscription.deleted"
  echo "  - invoice.payment_succeeded"
  echo "  - invoice.payment_failed"
  echo ""

  # Create webhook endpoint
  webhook_output=$(stripe webhooks create \
    --url "$WEBHOOK_URL" \
    --events $EVENTS \
    --format json 2>&1)

  if [ $? -eq 0 ]; then
    webhook_id=$(echo "$webhook_output" | grep -o '"id": "[^"]*' | head -1 | sed 's/"id": "//')
    webhook_secret=$(echo "$webhook_output" | grep -o '"secret": "[^"]*' | head -1 | sed 's/"secret": "//')

    echo "✅ Webhook endpoint created!"
    echo ""
    echo "Webhook ID: $webhook_id"
    echo "Webhook Secret: $webhook_secret"
    echo ""
    echo "======================================"
    echo "⚠️  IMPORTANT: Update your .env file"
    echo "======================================"
    echo ""
    echo "Add this line to your .env file:"
    echo "STRIPE_WEBHOOK_SECRET=$webhook_secret"
    echo ""
    echo "Then update Cloud Run environment variables:"
    echo "gcloud run services update adcreatorpro --region=us-central1 \\"
    echo "  --set-env-vars=\"STRIPE_WEBHOOK_SECRET=$webhook_secret\""
    echo ""
    echo "Test webhook:"
    echo "stripe trigger checkout.session.completed"
    echo ""
  else
    echo "❌ Failed to create webhook"
    echo "$webhook_output"
    exit 1
  fi
fi

echo ""
echo "Webhook configuration complete!"
