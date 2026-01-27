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
            plan: 'convidado',
            planStatus: 'active',
            usage: {
                reportsThisCycle: 0,
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
            // Document exists, just update last login
            await updateDoc(userDocRef, {
                lastLoginAt: serverTimestamp(),
            });
        } else {
            // Document doesn't exist, create it on first login
            await createUserProfile(app, user.uid, user.email);
        }
    } catch (error) {
        console.error("Error during user profile upsert:", error);
        throw error; // Re-throw to be caught by the UI
    }
};
