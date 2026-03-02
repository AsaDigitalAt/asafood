
import * as admin from 'firebase-admin';

const firebaseAdminConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'studio-8790382792-31236',
  // In a real environment, you'd use a service account key JSON from env vars
  // clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

export function getAdminApp() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  // If we are in local development or App Hosting with ADC (Application Default Credentials)
  // we can initialize without explicit credentials if the environment allows.
  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: firebaseAdminConfig.projectId,
  });
}

export const adminDb = getAdminApp().firestore();
export const adminAuth = getAdminApp().auth();
