"use client";

import { FirebaseApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

interface UserProfileData {
    email: string;
}

export const updateUserProfile = async (app: FirebaseApp, uid: string, data: UserProfileData) => {
    const firestore = getFirestore(app);
    const userDocRef = doc(firestore, `users/${uid}`);

    try {
        await setDoc(userDocRef, {
            ...data,
            lastLoginAt: serverTimestamp(),
            // Set these only on creation
            role: 'user',
            status: 'active',
            createdAt: serverTimestamp(),
        }, { merge: true });
    } catch (error) {
        console.error("Error updating user profile:", error);
        // Here you could emit a global error or handle it as needed
        throw error;
    }
};
