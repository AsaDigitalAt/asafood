import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytesResumable } from "firebase/storage";

/**
 * Faz upload da imagem do diagnóstico para o Storage e retorna o storagePath
 * que o backend usa para ler a imagem.
 */
export async function uploadDiagnosticImage(
  file: File,
  onProgress?: (pct: number) => void
) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Você precisa estar logado para enviar a imagem.");

  const uid = user.uid;

  // path recomendado (fácil de controlar em rules)
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const ts = Date.now();
  const storagePath = `diagnostics_uploads/${uid}/${ts}-${safeName}`;

  const storage = getStorage();
  const storageRef = ref(storage, storagePath);

  const task = uploadBytesResumable(storageRef, file, {
    contentType: file.type || "image/jpeg",
    customMetadata: {
      uid,
      originalName: file.name,
    },
  });

  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => {
        if (!onProgress) return;
        const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
        onProgress(Math.round(pct));
      },
      (err) => reject(err),
      () => resolve()
    );
  });

  return {
    storagePath,
    imageContentType: file.type || "image/jpeg",
    imageOriginalName: file.name,
  };
}