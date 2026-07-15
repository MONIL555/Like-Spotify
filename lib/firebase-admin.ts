// ============================================================
// SpotTunes — Firebase Admin Setup
// ============================================================

import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  try {
    // VERCEL FIX: We must use environment variables instead of the .json file 
    // because the .json file is gitignored and won't exist on Vercel's servers.
    const serviceAccount = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const authAdmin = getAuth();
