# Firebase Authentication - Quick Start Guide

This guide will help you configure Firebase authentication for AdCreatorPro in **under 30 minutes**.

## Option 1: Automated Setup (Recommended)

Run our interactive setup script:

```bash
./scripts/setup-firebase.sh
```

The script will guide you through:
1. Creating/selecting a Firebase project
2. Enabling authentication providers
3. Getting web app configuration
4. Downloading service account key
5. Configuring environment variables
6. Setting up authorized domains

**Time:** ~15-20 minutes

---

## Option 2: Manual Setup

### Step 1: Create Firebase Project (5 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"+ Add project"** or **"Create a project"**
3. Enter project name: `adcreatorpro` (or your choice)
4. (Optional) Enable Google Analytics
5. Click **"Create project"**
6. Wait for project to be created
7. Click **"Continue"**

### Step 2: Enable Email/Password Authentication (2 minutes)

1. In your Firebase project, click **"Build"** > **"Authentication"**
2. Click **"Get started"** (if first time)
3. Go to **"Sign-in method"** tab
4. Find **"Email/Password"** in the list
5. Click on it
6. Toggle **"Enable"** to ON
7. Click **"Save"**

**Optional: Enable Google Sign-In**
1. In the same "Sign-in method" tab
2. Click **"Google"**
3. Toggle **"Enable"** to ON
4. Enter support email (your email)
5. Click **"Save"**

### Step 3: Get Frontend Configuration (3 minutes)

1. Click the **gear icon (⚙️)** next to "Project Overview"
2. Click **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **Web icon (`</>`)**
5. Enter app nickname: `AdCreatorPro Web`
6. (Optional) Check "Also set up Firebase Hosting"
7. Click **"Register app"**

You'll see a configuration object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

8. **Copy these values** - you'll need them next

### Step 4: Get Backend Service Account Key (3 minutes)

1. Still in Project settings, click **"Service accounts"** tab
2. Click **"Generate new private key"** button
3. Click **"Generate key"** in the confirmation dialog
4. A JSON file will download - **save it securely**
5. **IMPORTANT:** Never commit this file to git!

The JSON file contains:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  ...
}
```

### Step 5: Update Environment Variables (5 minutes)

Open your `.env` file and update these values:

#### Frontend Configuration (from Step 3):

```bash
VITE_FIREBASE_API_KEY=AIzaSyC-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

#### Backend Configuration (from Step 4 JSON file):

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgk...(your full private key)...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

**Important Notes:**
- Keep the quotes around `FIREBASE_PRIVATE_KEY`
- Keep the `\n` characters in the private key (they represent newlines)
- The private key should be one long line with `\n` where line breaks should be

### Step 6: Authorize Domains (2 minutes)

1. In Firebase Console, go to **Authentication** > **Settings**
2. Scroll to **"Authorized domains"**
3. By default, you'll see:
   - `localhost` ✅
   - `your-project.firebaseapp.com` ✅

4. If deploying to production, click **"Add domain"** and add:
   - Your custom domain (e.g., `adcreatorpro.com`)
   - Your Cloud Run URL (e.g., `adcreatorpro-xxx.run.app`)

5. Click **"Add"** for each domain

---

## Testing Your Configuration

### Test Locally (5 minutes)

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   ```
   http://localhost:8080
   ```

3. **Test Signup:**
   - Click "Sign Up"
   - Enter email: `test@example.com`
   - Enter password: `Test123!`
   - Enter name: `Test User`
   - Click "Sign Up"

4. **Check for verification email:**
   - Check the email inbox for `test@example.com`
   - You should receive a verification email from Firebase
   - Click the verification link

5. **Test Login:**
   - Go back to app
   - Click "Login"
   - Enter your test credentials
   - You should be logged in and see the dashboard

### Verify in Firebase Console

1. Go to **Authentication** > **Users**
2. You should see your test user listed
3. Check the "Email verified" column

---

## Common Issues & Solutions

### Issue: "Invalid API key"

**Solution:**
- Check that `VITE_FIREBASE_API_KEY` matches the value from Firebase Console
- Make sure there are no extra spaces or quotes
- Restart dev server after changing .env

### Issue: "Unauthorized domain"

**Solution:**
- Go to Firebase Console > Authentication > Settings > Authorized domains
- Add `localhost` if not present
- Add your production domain

### Issue: "Invalid token" on backend

**Solution:**
- Check that `FIREBASE_PRIVATE_KEY` includes the full key with `\n` characters
- Check that `FIREBASE_PROJECT_ID` matches your Firebase project
- Make sure the key is wrapped in quotes: `FIREBASE_PRIVATE_KEY="..."`

### Issue: Email verification not sending

**Solution:**
- Check spam folder
- Verify authentication is enabled in Firebase Console
- Check that you're using a real email address (not @example.com in production)

### Issue: "Failed to create user in database"

**Solution:**
- Make sure PostgreSQL is running
- Run: `./scripts/test-db-connection.sh`
- Check database credentials in .env

---

## Environment Variables Checklist

Before starting the app, verify these are set:

### Frontend (must start with `VITE_`):
- [ ] `VITE_FIREBASE_API_KEY`
- [ ] `VITE_FIREBASE_AUTH_DOMAIN`
- [ ] `VITE_FIREBASE_PROJECT_ID`
- [ ] `VITE_FIREBASE_STORAGE_BUCKET`
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `VITE_FIREBASE_APP_ID`

### Backend:
- [ ] `FIREBASE_PROJECT_ID`
- [ ] `FIREBASE_PRIVATE_KEY`
- [ ] `FIREBASE_CLIENT_EMAIL`

---

## Security Best Practices

### DO ✅
- Keep the service account JSON file secure
- Add `.env` to `.gitignore` (already done)
- Use environment variables for all credentials
- Enable email verification for production
- Use strong password requirements
- Rotate service account keys every 90 days

### DON'T ❌
- Commit the service account JSON to git
- Commit the `.env` file to git
- Share your private key publicly
- Use the same Firebase project for dev and production (consider separate projects)
- Disable email verification in production

---

## Advanced Configuration

### Custom Email Templates

1. Go to Firebase Console > Authentication > Templates
2. Click on each template (Email verification, Password reset)
3. Customize:
   - Subject line
   - Email body
   - Sender name (requires domain verification)

### Enable Additional Providers

**Google Sign-In:**
1. Authentication > Sign-in method
2. Click "Google"
3. Enable and add support email
4. Users can now sign in with Google accounts

**Other Providers:**
- Facebook
- Twitter
- GitHub
- Microsoft
- Apple
- Anonymous

### Multi-Factor Authentication (MFA)

Coming soon - Firebase supports SMS and TOTP-based MFA

### Custom Claims for Roles

You can add custom claims to tokens for role-based access:

```typescript
// Backend example
admin.auth().setCustomUserClaims(uid, {
  role: 'admin',
  tier: 'pro'
});
```

---

## Production Deployment

When deploying to Cloud Run:

1. **Set environment variables in Cloud Run:**
   ```bash
   gcloud run services update adcreatorpro \
     --region us-central1 \
     --set-env-vars="FIREBASE_PROJECT_ID=your-project-id,FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...,VITE_FIREBASE_API_KEY=..."
   ```

2. **Or use the deployment script:**
   ```bash
   ./scripts/deploy.sh
   ```
   (It automatically reads from .env)

3. **Add Cloud Run URL to authorized domains** in Firebase Console

4. **Test authentication** on the deployed app

---

## Monitoring Authentication

### View Users
Firebase Console > Authentication > Users

### View Sign-in Activity
Firebase Console > Authentication > Usage

### Set Up Alerts
Firebase Console > Authentication > Settings > Monitoring

---

## Cost Information

Firebase Authentication pricing:

- **Free tier (Spark):**
  - Phone authentication: 10,000 verifications/month
  - Everything else: Unlimited

- **Paid tier (Blaze):**
  - Phone auth: $0.006 per verification
  - Email/password, Google, etc.: Free and unlimited

**Recommendation:** Start with the free Spark plan.

---

## Next Steps

After Firebase is configured:

1. ✅ Configure Firebase ← **You are here**
2. Configure OpenAI (for AI ad generation)
3. Configure Stripe (for payments)
4. Set up database (PostgreSQL)
5. Deploy to production

---

## Support

**Documentation:**
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [AdCreatorPro Firebase Setup Guide](docs/FIREBASE_SETUP.md)

**Need Help?**
- Check `docs/FIREBASE_SETUP.md` for detailed troubleshooting
- Review Firebase Console > Authentication > Usage for diagnostics
- Check browser console for errors
- Check backend logs for authentication failures

---

**Estimated Setup Time:** 15-30 minutes

**Difficulty:** ⭐⭐☆☆☆ (Beginner-friendly)

**Status:** Firebase authentication is the foundation for all user features in AdCreatorPro!
