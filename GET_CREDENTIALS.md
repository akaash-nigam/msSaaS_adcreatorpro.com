# Get Your Credentials - Quick Guide

Follow these steps to get your OpenAI and Firebase credentials.

---

## 🤖 Part 1: OpenAI API Key (2 minutes)

### Steps:
1. Go to: https://platform.openai.com/api-keys
2. Sign in to your OpenAI account
3. Click **"+ Create new secret key"**
4. Name: "AdCreatorPro Production"
5. Click **"Create secret key"**
6. **COPY THE KEY NOW** (you can only see it once!)
   - It starts with `sk-proj-` or `sk-`
7. Paste it somewhere temporarily

### Add Credits (if needed):
- Go to: https://platform.openai.com/account/billing
- Add $5-10 in credits
- Cost: ~$0.002 per ad (~500 ads for $1)

### Example Key:
```
sk-proj-abc123XYZ...
```

---

## 🔥 Part 2: Firebase Credentials (15 minutes)

### A. Create/Select Firebase Project

1. Go to: https://console.firebase.google.com
2. Click **"Add project"** or select existing project
3. Name: **adcreatorpro** (or any name you prefer)
4. Click Continue through the setup steps
5. Google Analytics: Optional (can skip)
6. Click **"Create project"** and wait ~30 seconds

### B. Enable Email/Password Authentication

1. In your Firebase project, click **"Authentication"** in left sidebar
2. Click **"Get started"**
3. Click **"Email/Password"** provider
4. Toggle **"Enable"** switch to ON
5. Click **"Save"**

### C. Get Web App Configuration (Frontend)

1. In Firebase Console, click **⚙️ Settings** (gear icon) → **Project settings**
2. Scroll down to **"Your apps"** section
3. Click the **Web icon** `</>` to create a web app
4. App nickname: **AdCreatorPro Web**
5. Check **"Also set up Firebase Hosting"** (optional)
6. Click **"Register app"**
7. You'll see a `firebaseConfig` object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "adcreatorpro.firebaseapp.com",
  projectId: "adcreatorpro",
  storageBucket: "adcreatorpro.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123..."
};
```

**Copy these 6 values:**
- ✅ apiKey
- ✅ authDomain
- ✅ projectId
- ✅ storageBucket
- ✅ messagingSenderId
- ✅ appId

### D. Get Service Account Key (Backend)

1. Still in **Project Settings** → Click **"Service accounts"** tab
2. Click **"Generate new private key"**
3. Click **"Generate key"** to download JSON file
4. Save the file (e.g., `adcreatorpro-firebase-adminsdk.json`)

The JSON file looks like:
```json
{
  "type": "service_account",
  "project_id": "adcreatorpro",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xyz@adcreatorpro.iam.gserviceaccount.com",
  "client_id": "123456789012",
  ...
}
```

**Copy these 3 values from the JSON:**
- ✅ project_id
- ✅ private_key (the entire string with \n characters)
- ✅ client_email

### E. Add Authorized Domain

1. In Firebase Console → **Authentication** → **Settings** tab
2. Scroll to **"Authorized domains"**
3. Click **"Add domain"**
4. Add: **adcreatorpro.com**
5. Click **"Add"**

---

## 📝 Credentials Checklist

Once you have everything, you should have:

### OpenAI (1 value)
- [ ] API Key (sk-proj-... or sk-...)

### Firebase Backend (3 values)
- [ ] Project ID
- [ ] Client Email
- [ ] Private Key (with -----BEGIN PRIVATE KEY----- header)

### Firebase Frontend (6 values)
- [ ] API Key
- [ ] Auth Domain
- [ ] Project ID
- [ ] Storage Bucket
- [ ] Messaging Sender ID
- [ ] App ID

**Total: 10 values to copy**

---

## 🚀 Next Step: Update Deployment

Once you have all credentials, paste them when prompted and I'll update your deployment!

---

## 📋 Template for Easy Copy-Paste

```
=== OPENAI ===
API_KEY: sk-proj-...

=== FIREBASE BACKEND ===
PROJECT_ID: adcreatorpro
CLIENT_EMAIL: firebase-adminsdk-xyz@adcreatorpro.iam.gserviceaccount.com
PRIVATE_KEY: -----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASC...
-----END PRIVATE KEY-----

=== FIREBASE FRONTEND ===
API_KEY: AIzaSyC...
AUTH_DOMAIN: adcreatorpro.firebaseapp.com
PROJECT_ID: adcreatorpro
STORAGE_BUCKET: adcreatorpro.appspot.com
MESSAGING_SENDER_ID: 123456789012
APP_ID: 1:123456789012:web:abc123...
```

Copy this template and fill in your actual values!
