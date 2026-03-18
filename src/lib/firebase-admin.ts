import * as admin from "firebase-admin";

/**
 * Firebase Admin SDK (Next.js / Server)
 * - Funciona local e produção
 * - Evita inicialização duplicada
 * - Garante storageBucket configurado
 */
export function getAdminApp() {
  if (admin.apps.length > 0) return admin.apps[0]!;

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "studio-8790382792-31236";

  // Bucket:
  // 1) FIREBASE_STORAGE_BUCKET (recomendado)
  // 2) fallback: <projectId>.appspot.com
  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;

  /**
   * Credenciais:
   * - Preferência: GOOGLE_APPLICATION_CREDENTIALS apontando para o JSON
   * - Alternativa: FIREBASE_SERVICE_ACCOUNT com JSON stringificado
   */
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId,
      storageBucket,
    });
  } else {
    // Usa Application Default Credentials (ADC)
    // Funciona com GOOGLE_APPLICATION_CREDENTIALS e em ambientes Google Cloud
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId,
      storageBucket,
    });
  }

  return admin.apps[0]!;
}

// Instâncias globais para Server Actions / API Routes
export const adminDb = getAdminApp().firestore();
export const adminAuth = getAdminApp().auth();
export const adminStorage = getAdminApp().storage();