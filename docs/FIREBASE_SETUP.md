# Firebase Setup Guide

This guide walks you through setting up Firebase Authentication for AdCreatorPro.

## Prerequisites

- Google account
- Access to [Firebase Console](https://console.firebase.google.com/)

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: `adcreatorpro` (or your preferred name)
4. Enable Google Analytics (optional but recommended)
5. Click "Create project"

## Step 2: Enable Authentication Providers

1. In the Firebase Console, select your project
2. Navigate to **Build** > **Authentication**
3. Click "Get started" if this is your first time
4. Go to the **Sign-in method** tab

### Enable Email/Password Authentication

1. Click on "Email/Password" provider
2. Toggle **Enable** switch to ON
3. Leave "Email link (passwordless sign-in)" disabled
4. Click "Save"

### Enable Google Authentication

1. Click on "Google" provider
2. Toggle **Enable** switch to ON
3. Enter project support email (your email)
4. Click "Save"

## Step 3: Get Firebase Web Configuration

1. In Firebase Console, go to **Project settings** (gear icon)
2. Scroll to "Your apps" section
3. Click the Web icon (`</>`) to add a web app
4. Enter app nickname: `AdCreatorPro Web`
5. Check "Also set up Firebase Hosting" (optional)
6. Click "Register app"

7. Copy the `firebaseConfig` object. It should look like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "adcreatorpro-xxxxx.firebaseapp.com",
  projectId: "adcreatorpro-xxxxx",
  storageBucket: "adcreatorpro-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

8. Add these values to your frontend `.env` file:

```bash
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=adcreatorpro-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=adcreatorpro-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=adcreatorpro-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

## Step 4: Create Service Account for Backend

The backend needs a service account to verify Firebase ID tokens.

1. In Firebase Console, go to **Project settings** > **Service accounts**
2. Click "Generate new private key"
3. A JSON file will be downloaded. This contains:
   - `project_id`
   - `private_key`
   - `client_email`

4. Extract values from the JSON and add to backend `.env`:

```bash
FIREBASE_PROJECT_ID=adcreatorpro-xxxxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nXXXXX\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@adcreatorpro-xxxxx.iam.gserviceaccount.com
```

**IMPORTANT**: The `private_key` must keep the `\n` newline characters. If storing in environment variables, keep it as a single line with literal `\n` strings.

## Step 5: Configure Email Templates (Optional)

Customize the emails Firebase sends for password reset and email verification:

1. In Firebase Console, go to **Authentication** > **Templates**
2. You can customize:
   - Email address verification
   - Password reset
   - Email address change

For each template:
- Customize the email subject
- Customize the email body
- Change the "From" name (requires domain verification for custom domain)

## Step 6: Set Up Authorized Domains

Firebase only allows authentication requests from authorized domains.

1. Go to **Authentication** > **Settings** > **Authorized domains**
2. By default, `localhost` and your Firebase subdomain are authorized
3. Add your production domain:
   - Click "Add domain"
   - Enter your domain (e.g., `adcreatorpro.com`)
   - Click "Add"

**For Cloud Run deployment:**
- Add your Cloud Run URL: `adcreatorpro-1022196473572.us-central1.run.app`

## Step 7: Security Rules (Future)

If you plan to use Firestore or Cloud Storage:

### Firestore Rules Example
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Storage Rules Example
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 8: Verify Setup

### Test Frontend Authentication

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the signup page
3. Create a test account with email/password
4. Check Firebase Console > Authentication > Users
5. Your test user should appear in the list

### Test Backend Token Verification

1. Start your backend server:
   ```bash
   npm run dev
   ```

2. Get a Firebase ID token from your frontend (check browser console or Network tab)
3. Test a protected endpoint:
   ```bash
   curl http://localhost:8080/api/user/profile \
     -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
   ```

4. Should return user profile data if token is valid

## Troubleshooting

### "Firebase: Error (auth/invalid-api-key)"
- Check that `VITE_FIREBASE_API_KEY` matches your Firebase config
- Verify the API key in Firebase Console > Project settings

### "Firebase: Error (auth/unauthorized-domain)"
- Add your domain to authorized domains list
- For local development, ensure `localhost` is authorized

### "Invalid token" on backend
- Verify `FIREBASE_PROJECT_ID` matches your Firebase project
- Check that `FIREBASE_PRIVATE_KEY` includes `\n` newline characters
- Ensure service account has not been deleted

### Email verification emails not sending
- Check spam folder
- Verify sender email in Firebase Console > Authentication > Templates
- For custom domain emails, you need to verify domain ownership

### Users not showing up in Firebase Console
- Check browser console for errors
- Verify authentication provider is enabled
- Ensure frontend is using correct Firebase config

## Environment Variables Summary

### Frontend (.env)
```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### Backend (.env)
```bash
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
```

## Security Best Practices

1. **Never commit Firebase config to public repositories**
   - Use `.env` files (already in `.gitignore`)
   - For frontend, these values are public but API key is restricted by domain

2. **Rotate service account keys periodically**
   - Generate new keys every 90 days
   - Delete old keys after rotation

3. **Use Firebase App Check** (advanced)
   - Protects against abuse and unauthorized clients
   - Add to frontend for production

4. **Monitor authentication usage**
   - Check Firebase Console > Authentication > Usage
   - Set up billing alerts

5. **Enable multi-factor authentication** (future)
   - Available in Firebase Authentication
   - Adds extra security layer for users

## Next Steps

After Firebase is set up:

1. ✅ Update frontend and backend `.env` files
2. ✅ Test authentication flow locally
3. ✅ Deploy to Cloud Run with environment variables
4. ✅ Add production domain to authorized domains
5. ✅ Customize email templates
6. ✅ Monitor authentication usage

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase Pricing](https://firebase.google.com/pricing)
