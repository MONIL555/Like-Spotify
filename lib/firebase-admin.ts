// ============================================================
// SpotTunes — Firebase Admin Setup
// ============================================================

import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  try {
    // VERCEL FIX: We must use environment variables instead of the .json file 
    // because the .json file is gitignored and won't exist on Vercel's servers.
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      const serviceAccount = { projectId, clientEmail, privateKey };
      initializeApp({ credential: cert(serviceAccount) });
    } else {
      console.warn('Firebase Admin env vars missing. Skipping initialization at build time.');
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

// Lazily invoke getAuth() at runtime to prevent Next.js build-time crashes 
// when environment variables are not yet injected by Vercel.
export const authAdmin = {
  verifyIdToken: async (idToken: string) => {
    return getAuth().verifyIdToken(idToken);
  }
};
