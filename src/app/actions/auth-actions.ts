"use server";

import { adminAuth } from "@/lib/firebase-admin";

export async function checkUserExists(email: string): Promise<boolean> {
  try {
    const userRecord = await adminAuth.getUserByEmail(email);
    return !!userRecord;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return false;
    }
    console.error("Erro ao verificar usuário por e-mail no Firebase Admin:", error);
    // Em vez de retornar falso silenciosamente, lança o erro para o frontend ver se é problema de credencial
    throw new Error(`Falha no Firebase Admin: ${error.message || error.code || 'Erro desconhecido'}`);
  }
}
