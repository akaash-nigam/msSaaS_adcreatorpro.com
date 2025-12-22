import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';

// Initialize Firebase Admin (will be called from main server file)
export function initializeFirebase() {
  if (admin.apps.length === 0) {
    // In production, use Application Default Credentials from Cloud Run
    // In development, use service account key file
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      // Use default credentials in Cloud Run
      admin.initializeApp();
    }
    console.log('✅ Firebase Admin initialized');
  }
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        email_verified?: boolean;
      };
    }
  }
}

// Middleware to verify Firebase auth token
export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Attach user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified
    };

    next();
  } catch (error: any) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Optional auth - doesn't fail if no token, but attaches user if present
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);

      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        email_verified: decodedToken.email_verified
      };
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
}
