"use client";

import { FirebaseApp } from "firebase/app";
import { User } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp, updateDoc, getDoc } from "firebase/firestore";

// Perfil padrão para usuários criados manualmente (sem webhook da XGrow).
// Recebem acesso de desenvolvedor com gerações ilimitadas.
// Nota: Firestore não serializa Infinity — usamos 9999 como sentinela. O hook
// useAccessControl já faz bypass total baseado em plan === 'desenvolvedor'.
const DEVELOPER_PROFILE = {
    role: 'developer',           // Preservado pelo webhook (nunca sobrescrito via {merge:true})
    plan: 'desenvolvedor',
    subscription: { status: 'active', provider: 'manual' },
    features: { diagnosticsEnabled: true, pricingEnabled: true },
    quota: { diagnosticsMax: 9999, productsMax: 9999 },
    usage: { diagnosticsUsed: 0, productsUsed: 0, reportsThisCycle: 0, pricingThisCycle: 0 },
};

// This data is set when a user's profile is created for the first time (manual Auth Console user).
export const createUserProfile = async (app: FirebaseApp, uid: string, email: string) => {
    const firestore = getFirestore(app);
    const userDocRef = doc(firestore, `users/${uid}`);

    try {
        await setDoc(userDocRef, {
            email,
            tenantId: uid,
            ...DEVELOPER_PROFILE,
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error creating user profile:", error);
        throw error;
    }
};

// Called on every login to ensure a profile exists and to update the last login time.
export const upsertUserProfileOnLogin = async (app: FirebaseApp, user: User) => {
    if (!user.email) {
        throw new Error("User email is not available for profile creation.");
    }
    const firestore = getFirestore(app);
    const userDocRef = doc(firestore, `users/${user.uid}`);

    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            const updates: any = { lastLoginAt: serverTimestamp() };

            // Migração: garantir que tenantId exista
            if (!data.tenantId) updates.tenantId = user.uid;

            // Promover/restaurar developer se:
            // 1. Ainda não tem features (criado antes deste sistema), OU
            // 2. Tem role:'developer' mas plan foi degradado pelo webhook, OU
            // 3. Não tem subscriberPlanId real do xgrow (conta criada manualmente)
            const hasRealXgrowSubscription =
                !!(data.subscription?.subscriberPlanId || data.subscription?.subscriberId);
            const needsDeveloperPromotion =
                !data.features ||
                data.role === 'developer' ||
                (!hasRealXgrowSubscription && data.plan !== 'desenvolvedor');

            if (needsDeveloperPromotion) {
                updates.role = DEVELOPER_PROFILE.role;
                updates.plan = DEVELOPER_PROFILE.plan;
                updates.subscription = DEVELOPER_PROFILE.subscription;
                updates.features = DEVELOPER_PROFILE.features;
                updates.quota = DEVELOPER_PROFILE.quota;
                if (!data.usage) updates.usage = DEVELOPER_PROFILE.usage;
            }

            await updateDoc(userDocRef, updates);
        } else {
            // Perfil não existe — usuário criado manualmente no Auth Console
            await createUserProfile(app, user.uid, user.email);
        }
    } catch (error) {
        console.error("Error during user profile upsert:", error);
        throw error;
    }
};
