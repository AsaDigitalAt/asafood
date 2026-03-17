"use client";

import { FirebaseApp } from "firebase/app";
import { User } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp, updateDoc, getDoc } from "firebase/firestore";

// This data is set when a user's profile is created for the first time.
export const createUserProfile = async (app: FirebaseApp, uid: string, email: string) => {
    const firestore = getFirestore(app);
    const userDocRef = doc(firestore, `users/${uid}`);

    try {
        await setDoc(userDocRef, {
            email: email,
            tenantId: uid, // Inicia o tenantId como o próprio UID do usuário para garantir isolamento inicial
            plan: 'plano_acelerador',
            planStatus: 'active',
            usage: {
                reportsThisCycle: 0,
                pricingThisCycle: 0,
                cycleStart: serverTimestamp()
            },
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
            // Migração: se não tiver tenantId, define como uid
            const updates: any = {
                lastLoginAt: serverTimestamp(),
            };
            if (!data.tenantId) {
                updates.tenantId = user.uid;
            }
            await updateDoc(userDocRef, updates);
        } else {
            // Document doesn't exist, create it on first login
            await createUserProfile(app, user.uid, user.email);
        }
    } catch (error) {
        console.error("Error during user profile upsert:", error);
        throw error; // Re-throw to be caught by the UI
    }
};
