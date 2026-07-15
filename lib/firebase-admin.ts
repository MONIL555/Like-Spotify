// ============================================================
// SpotTunes — Firebase Admin Setup
// ============================================================

import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  try {
    // Using the downloaded service account key
    const serviceAccount = require('../spottunes-baf0c-firebase-adminsdk-fbsvc-fc011e10c2.json');

    initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const authAdmin = getAuth();
