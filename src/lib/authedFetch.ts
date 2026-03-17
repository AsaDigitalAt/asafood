import { getAuth } from "firebase/auth";

type Json = Record<string, any>;

export async function authedPost<T = any>(url: string, body: Json): Promise<T> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) throw new Error("Você precisa estar logado.");

  const idToken = await user.getIdToken(true); // true força refresh se necessário

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok || data?.ok === false) {
    throw new Error(data?.error || `Erro HTTP ${resp.status}`);
  }

  return data as T;
}