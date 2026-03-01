import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

/** Firebase Client App. */
export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

/** Firebase Auth インスタンス. */
export const firebaseAuth = getAuth(firebaseApp);
