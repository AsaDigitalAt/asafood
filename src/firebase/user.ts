"use client";

import { FirebaseApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";

interface UserProfileData {
    email: string;
}

// Called when a user signs up for the first time.
export const createUserProfile = async (app: FirebaseApp, uid: string, data: UserProfileData) => {
    const firestore = getFirestore(app);
    const userDocRef = doc(firestore, `users/${uid}`);

    try {
        // Use setDoc without merge to ensure it's a new document.
        // The rule `isCreatingOwnUser` will enforce the initial values.
        await setDoc(userDocRef, {
            ...data,
            role: 'user',
            status: 'active',
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error creating user profile:", error);
        throw error; // Re-throw to be caught by the UI
    }
};

// Called when an existing user signs in.
export const updateUserLastLogin = async (app: FirebaseApp, uid: string) => {
    const firestore = getFirestore(app);
    const userDocRef = doc(firestore, `users/${uid}`);

    try {
        await updateDoc(userDocRef, {
            lastLoginAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error updating user last login:", error);
        // This might fail if the doc doesn't exist, which is a valid state if signup failed.
        // We can ignore this error for login flow or handle it gracefully.
        // For now, just log it.
    }
};
