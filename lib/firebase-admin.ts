// ============================================================
// MoniStream — Firebase Admin Setup
// ============================================================

import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

if (!getApps().length) {
  try {
    // VERCEL FIX: We must use environment variables instead of the .json file 
    // because the .json file is gitignored and won't exist on Vercel's servers.
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    
    // Clean up private key to handle accidental quotes or trailing commas from copy/pasting JSON
    let rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY || '';
    rawPrivateKey = rawPrivateKey.replace(/^["']|["']$/g, ''); // Remove leading/trailing quotes
    rawPrivateKey = rawPrivateKey.replace(/,$/g, ''); // Remove trailing comma
    rawPrivateKey = rawPrivateKey.replace(/^["']|["']$/g, ''); // Remove quotes again if they were inside the comma
    
    const privateKey = rawPrivateKey.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      const serviceAccount = { projectId, clientEmail, privateKey };
      // Note: Make sure NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is set in env
      let storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;
      if (storageBucket.includes('firebasestorage.app')) {
        storageBucket = storageBucket.replace('.firebasestorage.app', '.appspot.com');
      }
      
      initializeApp({ 
        credential: cert(serviceAccount),
        storageBucket: storageBucket
      });
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

export const storageAdmin = {
  bucket: () => {
    return getStorage().bucket();
  }
};
