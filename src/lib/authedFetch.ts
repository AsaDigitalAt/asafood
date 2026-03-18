import { getAuth } from "firebase/auth";

type Json = Record<string, any>;

/**
 * Realiza um POST autenticado para o backend.
 * O ID Token é recuperado e enviado no header Authorization.
 */
export async function authedPost<T = any>(url: string, body: Json): Promise<T> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Sessão expirada. Por favor, faça login novamente.");
  }

  try {
    const idToken = await user.getIdToken(true);

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      throw new Error(data?.message || data?.error || `Erro no servidor: ${resp.status}`);
    }

    return data as T;
  } catch (error: any) {
    console.error(`Erro ao chamar endpoint ${url}:`, error);
    throw error;
  }
}
