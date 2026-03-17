import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

/**
 * Faz upload da imagem do diagnóstico para o Storage seguindo path determinístico:
 * diagnostics/uploads/{uid}/{timestamp}_{filename}
 */
export async function uploadDiagnosticImage(
  file: File,
  onProgress?: (pct: number) => void
) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Você precisa estar logado para enviar a imagem.");

  const uid = user.uid;
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const storagePath = `diagnostics/uploads/${uid}/${timestamp}_${safeName}`;

  const storage = getStorage();
  const storageRef = ref(storage, storagePath);

  const metadata = {
    contentType: file.type || "image/jpeg",
    customMetadata: {
      uid,
      originalName: file.name,
    },
  };

  const task = uploadBytesResumable(storageRef, file, metadata);

  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => {
        if (onProgress) {
          const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
          onProgress(Math.round(pct));
        }
      },
      (err) => reject(err),
      () => resolve()
    );
  });

  const downloadURL = await getDownloadURL(storageRef);

  return {
    storagePath,
    imageContentType: metadata.contentType,
    imageOriginalName: file.name,
    downloadURL,
  };
}
