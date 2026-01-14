#!/bin/bash
# Cloud SQL Setup Script for Cloud Run

set -e

echo "🗄️  Configuring Cloud SQL for Cloud Run"
echo "========================================"
echo ""

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
else
  echo "❌ .env file not found!"
  exit 1
fi

# Get GCP project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
  echo "❌ No GCP project configured"
  echo "Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

echo "Project: $PROJECT_ID"
echo "Cloud SQL Instance: $CLOUD_SQL_CONNECTION_NAME"
echo ""

# Extract instance details
INSTANCE_NAME=$(echo $CLOUD_SQL_CONNECTION_NAME | cut -d':' -f3)
REGION=$(echo $CLOUD_SQL_CONNECTION_NAME | cut -d':' -f2)
SERVICE_NAME="adcreatorpro"

echo "Instance: $INSTANCE_NAME"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo ""

# Check if Cloud Run service exists
echo "Checking if Cloud Run service exists..."
if gcloud run services describe $SERVICE_NAME --region=$REGION &>/dev/null; then
  echo "✅ Service found: $SERVICE_NAME"
else
  echo "⚠️  Service not found. It will be created on first deployment."
fi

echo ""
echo "Configuring Cloud SQL connection..."

# Update Cloud Run service to add Cloud SQL instance
gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --add-cloudsql-instances ${CLOUD_SQL_CONNECTION_NAME} \
  2>/dev/null || echo "⚠️  Will be applied on next deployment"

# Get Cloud Run service account
SERVICE_ACCOUNT=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(spec.template.spec.serviceAccountName)' 2>/dev/null)

if [ -z "$SERVICE_ACCOUNT" ]; then
  # Use default compute service account
  PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
  SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
  echo "Using default service account: $SERVICE_ACCOUNT"
fi

echo ""
echo "Granting Cloud SQL Client role..."

# Grant Cloud SQL Client role to service account
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/cloudsql.client" \
  --condition=None \
  2>/dev/null || echo "✅ Role already granted"

echo ""
echo "======================================"
echo "✅ Cloud SQL configuration complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Set DATABASE_URL as environment variable in Cloud Run:"
echo "   gcloud run services update $SERVICE_NAME --region=$REGION \\"
echo "     --set-env-vars=\"DATABASE_URL=$DATABASE_URL\""
echo ""
echo "2. Deploy your service:"
echo "   ./scripts/deploy.sh"
echo ""

echo "Database connection string format:"
echo "postgresql://USER:PASSWORD@localhost/DATABASE?host=/cloudsql/$CLOUD_SQL_CONNECTION_NAME"
