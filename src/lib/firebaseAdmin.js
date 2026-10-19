import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Starts the Firebase Admin connection (server only) the first time it is needed
export function getAdmin() {
  let app;

  if (getApps().length > 0) {
    app = getApps()[0];
  } else {
    const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (!encoded) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 is not set');
    }
    const serviceAccount = JSON.parse(Buffer.from(encoded.trim(), 'base64').toString('utf8'));
    app = initializeApp({ credential: cert(serviceAccount) });
  }

  return { adminAuth: getAuth(app), adminDb: getFirestore(app) };
}