
import * as admin from 'firebase-admin';

const firebaseAdminConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'studio-8790382792-31236',
};

/**
 * Inicializa o Admin SDK do Firebase para operações seguras no backend.
 * Configura explicitamente o Storage Bucket para evitar erros de referência nula.
 */
export function getAdminApp() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  // No ambiente do Firebase App Hosting, o credential.applicationDefault() 
  // já possui as permissões necessárias para o projeto.
  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: firebaseAdminConfig.projectId,
    storageBucket: `${firebaseAdminConfig.projectId}.firebasestorage.app`,
  });
}

// Inicializa as instâncias globais para uso nas Server Actions
export const adminDb = getAdminApp().firestore();
export const adminAuth = getAdminApp().auth();
