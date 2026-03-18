import { useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { useDoc } from "@/firebase/firestore/use-doc";
import { doc } from "firebase/firestore";

export interface AccessControlStatus {
  isDeveloper: boolean;
  isSuspended: boolean;
  /** true enquanto o perfil do Firestore ainda não carregou — evita falsos alertas de limite */
  isLoading: boolean;
  diagnostics: {
    canGenerate: boolean;
    used: number;
    max: number;
    remaining: number;
  };
  pricing: {
    canGenerate: boolean;
    used: number;
    max: number;
    remaining: number;
  };
}

export function useAccessControl(): AccessControlStatus {
  const { user } = useUser();
  const firestore = useFirestore();

  // Busca o perfil completo do Firestore (contém plan, features, quota, subscription, usage)
  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userData } = useDoc<any>(userDocRef);

  // Fallback enquanto o perfil ainda está carregando — isLoading:true para suprimir alertas prematuros
  if (!user || !userData) {
    return {
      isDeveloper: false,
      isSuspended: false,
      isLoading: true,
      diagnostics: { canGenerate: false, used: 0, max: 0, remaining: 0 },
      pricing: { canGenerate: false, used: 0, max: 0, remaining: 0 },
    };
  }

  const isDeveloper = userData.plan === "desenvolvedor" || userData.role === "developer";

  // Developer tem acesso ilimitado a tudo
  if (isDeveloper) {
    return {
      isDeveloper: true,
      isSuspended: false,
      isLoading: false,
      diagnostics: { canGenerate: true, used: 0, max: Infinity, remaining: Infinity },
      pricing: { canGenerate: true, used: 0, max: Infinity, remaining: Infinity },
    };
  }

  const isSuspended = !userData.subscription || userData.subscription.status !== "active";

  // Verificações de uso padrão
  const usage = userData.usage || { diagnosticsUsed: 0, productsUsed: 0 };
  const quota = userData.quota || { diagnosticsMax: 0, productsMax: 0 };

  const diagnosticsUsed = Number(usage.diagnosticsUsed || 0);
  const diagnosticsMax = Number(quota.diagnosticsMax || 0);
  const diagnosticsRemaining = Math.max(0, diagnosticsMax - diagnosticsUsed);
  const canGenerateDiagnostic = !isSuspended && userData.features?.diagnosticsEnabled && diagnosticsRemaining > 0;

  const productsUsed = Number(usage.productsUsed || 0);
  const productsMax = Number(quota.productsMax || 0);
  const pricingRemaining = Math.max(0, productsMax - productsUsed);
  const canGeneratePricing = !isSuspended && userData.features?.pricingEnabled && pricingRemaining > 0;

  return {
    isDeveloper: false,
    isSuspended,
    isLoading: false,
    diagnostics: {
      canGenerate: !!canGenerateDiagnostic,
      used: diagnosticsUsed,
      max: diagnosticsMax,
      remaining: diagnosticsRemaining,
    },
    pricing: {
      canGenerate: !!canGeneratePricing,
      used: productsUsed,
      max: productsMax,
      remaining: pricingRemaining,
    },
  };
}
