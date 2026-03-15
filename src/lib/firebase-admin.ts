
import * as admin from 'firebase-admin';

/**
 * Inicializa o Admin SDK do Firebase para operações seguras no backend.
 * Utiliza variáveis de ambiente para garantir compatibilidade com o ambiente de execução.
 */
export function getAdminApp() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'studio-8790382792-31236';

  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: projectId,
    storageBucket: `${projectId}.firebasestorage.app`,
  });
}

// Inicializa as instâncias globais para uso nas Server Actions
export const adminDb = getAdminApp().firestore();
export const adminAuth = getAdminApp().auth();
