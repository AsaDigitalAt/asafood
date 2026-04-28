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
  freeAnalysis: {
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
  subscriptionDetail: {
    daysRemaining: number | null;
    status: string;
    isExpired: boolean;
  };
}

const PLAN_LIMITS: Record<string, { diagnostics: number; freeAnalysis: number; pricing: number }> = {
  convidado: { diagnostics: 1, freeAnalysis: 3, pricing: 5 },
  plano_unico: { diagnostics: 2, freeAnalysis: 10, pricing: 10 },
  plano_duplo: { diagnostics: 4, freeAnalysis: 25, pricing: 100 },
  plano_acelerador: { diagnostics: 10, freeAnalysis: 50, pricing: 200 },
};

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
    const empty = { canGenerate: false, used: 0, max: 0, remaining: 0 };
    return {
      isDeveloper: false,
      isSuspended: false,
      isLoading: true,
      diagnostics: empty,
      freeAnalysis: empty,
      pricing: empty,
      subscriptionDetail: { daysRemaining: null, status: 'loading', isExpired: false },
    };
  }

  const isDeveloper = userData.plan === "desenvolvedor" || userData.role === "developer";

  // Developer tem acesso ilimitado a tudo
  if (isDeveloper) {
    const unlimited = { canGenerate: true, used: 0, max: Infinity, remaining: Infinity };
    return {
      isDeveloper: true,
      isSuspended: false,
      isLoading: false,
      diagnostics: unlimited,
      freeAnalysis: unlimited,
      pricing: unlimited,
      subscriptionDetail: { daysRemaining: Infinity, status: 'active', isExpired: false },
    };
  }

  const isSuspended = !userData.subscription || userData.subscription.status !== "active";
  
  // Cálculo de dias restantes
  let daysRemaining: number | null = null;
  let isExpired = false;
  if (userData.subscription?.expiresAt) {
    const expiresAt = userData.subscription.expiresAt.toDate ? 
      userData.subscription.expiresAt.toDate() : 
      new Date(userData.subscription.expiresAt);
    
    const now = new Date();
    const diffTime = expiresAt.getTime() - now.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffTime <= 0) {
      isExpired = true;
      daysRemaining = 0;
    }
  }

  // Verificações de uso padrão
  const usage = userData.usage || { diagnosticsUsed: 0, freeAnalysisUsed: 0, productsUsed: 0 };
  const planKey = userData.plan || "convidado";
  const defaultQuota = PLAN_LIMITS[planKey] || PLAN_LIMITS.convidado;
  
  // Quota pode vir do DB ou do fallback fixo baseado no plano
  const quota = {
    diagnosticsMax: userData.quota?.diagnosticsMax ?? defaultQuota.diagnostics,
    freeAnalysisMax: userData.quota?.freeAnalysisMax ?? defaultQuota.freeAnalysis,
    productsMax: userData.quota?.productsMax ?? defaultQuota.pricing,
  };

  const diagnosticsUsed = Number(usage.diagnosticsUsed || 0);
  const diagnosticsMax = Number(quota.diagnosticsMax || 0);
  const diagnosticsRemaining = Math.max(0, diagnosticsMax - diagnosticsUsed);
  const canGenerateDiagnostic = !isSuspended && (userData.features?.diagnosticsEnabled !== false) && diagnosticsRemaining > 0;

  const freeUsed = Number(usage.freeAnalysisUsed || 0);
  const freeMax = Number(quota.freeAnalysisMax || 0);
  const freeRemaining = Math.max(0, freeMax - freeUsed);
  const canGenerateFree = !isSuspended && (userData.features?.freeAnalysisEnabled !== false) && freeRemaining > 0;

  const productsUsed = Number(usage.productsUsed || 0);
  const productsMax = Number(quota.productsMax || 0);
  const pricingRemaining = Math.max(0, productsMax - productsUsed);
  const canGeneratePricing = !isSuspended && (userData.features?.pricingEnabled !== false) && pricingRemaining > 0;

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
    freeAnalysis: {
      canGenerate: !!canGenerateFree,
      used: freeUsed,
      max: freeMax,
      remaining: freeRemaining,
    },
    pricing: {
      canGenerate: !!canGeneratePricing,
      used: productsUsed,
      max: productsMax,
      remaining: pricingRemaining,
    },
    subscriptionDetail: {
      daysRemaining,
      status: userData.subscription?.status || 'inactive',
      isExpired,
    }
  };
}
