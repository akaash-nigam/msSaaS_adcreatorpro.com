#!/bin/bash
# Firebase Configuration Helper for AdCreatorPro
# This script helps you configure Firebase authentication step by step

set -e

echo "🔥 Firebase Configuration Helper for AdCreatorPro"
echo "=================================================="
echo ""
echo "This script will help you configure Firebase authentication for your app."
echo "You'll need to have a Firebase project ready or create one during this process."
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

echo -e "${BLUE}📋 Firebase Setup Checklist:${NC}"
echo ""
echo "Before we begin, make sure you have:"
echo "  1. A Google account"
echo "  2. Access to Firebase Console (https://console.firebase.google.com)"
echo "  3. A few minutes to complete the setup"
echo ""

read -p "Do you have a Firebase project already created? (y/n): " has_project

if [ "$has_project" != "y" ]; then
    echo ""
    echo -e "${YELLOW}📝 Creating a Firebase Project${NC}"
    echo "================================"
    echo ""
    echo "Please follow these steps:"
    echo ""
    echo "1. Go to https://console.firebase.google.com"
    echo "2. Click '+ Add project' or 'Create a project'"
    echo "3. Enter project name: 'adcreatorpro' (or your preferred name)"
    echo "4. (Optional) Enable Google Analytics"
    echo "5. Click 'Create project'"
    echo ""
    read -p "Press Enter when you've created the project..."
fi

echo ""
echo -e "${YELLOW}🔐 Step 1: Enable Authentication Providers${NC}"
echo "============================================"
echo ""
echo "1. In Firebase Console, select your project"
echo "2. Go to Build > Authentication"
echo "3. Click 'Get started' (if first time)"
echo "4. Go to 'Sign-in method' tab"
echo "5. Click 'Email/Password' and toggle 'Enable'"
echo "6. (Optional) Click 'Google' and toggle 'Enable'"
echo "7. Click 'Save'"
echo ""
read -p "Press Enter when you've enabled Email/Password authentication..."

echo ""
echo -e "${YELLOW}🌐 Step 2: Get Web App Configuration${NC}"
echo "====================================="
echo ""
echo "1. In Firebase Console, click the gear icon (⚙️) > Project settings"
echo "2. Scroll to 'Your apps' section"
echo "3. Click the Web icon (</>) to add a web app"
echo "4. Enter app nickname: 'AdCreatorPro Web'"
echo "5. (Optional) Check 'Also set up Firebase Hosting'"
echo "6. Click 'Register app'"
echo ""
read -p "Press Enter when you've registered the web app..."

echo ""
echo -e "${BLUE}Now you should see the Firebase configuration object.${NC}"
echo "It looks like this:"
echo ""
echo "const firebaseConfig = {"
echo "  apiKey: \"AIzaSy...\","
echo "  authDomain: \"your-project.firebaseapp.com\","
echo "  projectId: \"your-project\","
echo "  storageBucket: \"your-project.appspot.com\","
echo "  messagingSenderId: \"123456789\","
echo "  appId: \"1:123456789:web:abcdef\""
echo "};"
echo ""
echo "Please enter these values:"
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

# Get Frontend Firebase Config
read -p "Enter API Key (AIzaSy...): " api_key
update_env "VITE_FIREBASE_API_KEY" "$api_key"

read -p "Enter Auth Domain (project.firebaseapp.com): " auth_domain
update_env "VITE_FIREBASE_AUTH_DOMAIN" "$auth_domain"

read -p "Enter Project ID: " project_id
update_env "VITE_FIREBASE_PROJECT_ID" "$project_id"
update_env "FIREBASE_PROJECT_ID" "$project_id"

read -p "Enter Storage Bucket (project.appspot.com): " storage_bucket
update_env "VITE_FIREBASE_STORAGE_BUCKET" "$storage_bucket"

read -p "Enter Messaging Sender ID: " sender_id
update_env "VITE_FIREBASE_MESSAGING_SENDER_ID" "$sender_id"

read -p "Enter App ID (1:123...:web:abc...): " app_id
update_env "VITE_FIREBASE_APP_ID" "$app_id"

echo ""
echo -e "${GREEN}✅ Frontend Firebase configuration saved!${NC}"
echo ""

echo ""
echo -e "${YELLOW}🔑 Step 3: Get Service Account Key (for Backend)${NC}"
echo "================================================="
echo ""
echo "1. In Firebase Console, go to Project settings > Service accounts"
echo "2. Click 'Generate new private key'"
echo "3. Click 'Generate key' in the confirmation dialog"
echo "4. A JSON file will be downloaded to your computer"
echo ""
read -p "Press Enter when you've downloaded the service account key..."

echo ""
echo "Please locate the downloaded JSON file and provide its path:"
read -p "Enter full path to service account JSON file: " json_path

if [ ! -f "$json_path" ]; then
    echo -e "${RED}❌ File not found: $json_path${NC}"
    echo "Please run this script again and provide the correct path."
    exit 1
fi

# Extract values from JSON
echo ""
echo "Extracting credentials from JSON file..."

project_id_json=$(grep -o '"project_id": "[^"]*' "$json_path" | sed 's/"project_id": "//')
private_key=$(grep -o '"private_key": "[^"]*' "$json_path" | sed 's/"private_key": "//')
client_email=$(grep -o '"client_email": "[^"]*' "$json_path" | sed 's/"client_email": "//')

if [ -z "$private_key" ] || [ -z "$client_email" ]; then
    echo -e "${RED}❌ Could not extract credentials from JSON file${NC}"
    echo "Please check the file and try again."
    exit 1
fi

# Update backend Firebase config
update_env "FIREBASE_PRIVATE_KEY" "\"$private_key\""
update_env "FIREBASE_CLIENT_EMAIL" "$client_email"

echo -e "${GREEN}✅ Backend Firebase configuration saved!${NC}"
echo ""

echo ""
echo -e "${YELLOW}🌍 Step 4: Authorize Domains${NC}"
echo "============================="
echo ""
echo "For your app to work, you need to authorize your domains:"
echo ""
echo "1. In Firebase Console, go to Authentication > Settings"
echo "2. Scroll to 'Authorized domains'"
echo "3. Click 'Add domain'"
echo "4. Add these domains:"
echo "   - localhost (already there)"
echo "   - 127.0.0.1 (already there)"
echo ""

read -p "Do you have a custom domain to add? (y/n): " has_domain
if [ "$has_domain" = "y" ]; then
    read -p "Enter your domain (e.g., adcreatorpro.com): " custom_domain
    echo ""
    echo "Please add '$custom_domain' to Firebase authorized domains now."
    echo ""
    read -p "Press Enter when done..."
fi

read -p "Do you have a Cloud Run URL to add? (y/n): " has_cloud_run
if [ "$has_cloud_run" = "y" ]; then
    read -p "Enter your Cloud Run URL (without https://): " cloud_run_url
    echo ""
    echo "Please add '$cloud_run_url' to Firebase authorized domains now."
    echo ""
    read -p "Press Enter when done..."
fi

echo ""
echo -e "${GREEN}✅ Domain authorization complete!${NC}"
echo ""

echo ""
echo -e "${YELLOW}📧 Step 5: Configure Email Templates (Optional)${NC}"
echo "================================================"
echo ""
echo "You can customize email templates for:"
echo "  - Email verification"
echo "  - Password reset"
echo ""
echo "To customize:"
echo "1. Go to Authentication > Templates in Firebase Console"
echo "2. Click on each template to edit"
echo "3. Customize subject and body"
echo ""
read -p "Do you want to do this now? (y/n): " customize_emails

if [ "$customize_emails" = "y" ]; then
    echo ""
    echo "Opening Firebase Console..."
    open "https://console.firebase.google.com/project/$project_id/authentication/emails" 2>/dev/null || \
    echo "Please visit: https://console.firebase.google.com/project/$project_id/authentication/emails"
    echo ""
    read -p "Press Enter when done customizing email templates..."
fi

echo ""
echo "======================================="
echo -e "${GREEN}🎉 Firebase Configuration Complete!${NC}"
echo "======================================="
echo ""
echo "Your Firebase credentials have been saved to .env file."
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo "  ✅ Firebase project: $project_id"
echo "  ✅ Frontend config: Saved to .env"
echo "  ✅ Backend config: Saved to .env"
echo "  ✅ Email/Password auth: Enabled"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT SECURITY NOTE:${NC}"
echo "  - Never commit the service account JSON file to git"
echo "  - Never commit the .env file to git"
echo "  - Both files are in .gitignore"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo ""
echo "1. Test your Firebase configuration:"
echo "   npm run dev"
echo "   # Visit http://localhost:8080"
echo "   # Try signing up with email/password"
echo ""
echo "2. If testing locally, make sure your database is running:"
echo "   ./scripts/test-db-connection.sh"
echo ""
echo "3. For production deployment:"
echo "   ./scripts/deploy.sh"
echo ""
echo -e "${GREEN}✨ Firebase is ready to use!${NC}"
echo ""

# Offer to save the JSON file path
read -p "Would you like to save the service account JSON file path for future reference? (y/n): " save_path
if [ "$save_path" = "y" ]; then
    echo "FIREBASE_SERVICE_ACCOUNT_PATH=$json_path" >> .env.local 2>/dev/null || true
    echo ""
    echo "Saved to .env.local (not tracked by git)"
fi

echo ""
echo "Firebase configuration complete! 🔥"
