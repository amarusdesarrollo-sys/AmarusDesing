import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
};

// Check if we have valid Firebase config
const hasValidConfig = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId
);

// Initialize Firebase (only if not already initialized)
// During build, if config is missing, use dummy values to prevent build failures
let app: FirebaseApp;
try {
  if (getApps().length === 0) {
    if (hasValidConfig) {
      app = initializeApp(firebaseConfig);
    } else {
      // During build without env vars, create a minimal app to prevent errors
      // This will fail at runtime if actually used, but won't break the build
      console.warn(
        "Firebase: Environment variables not configured. " +
        "Using dummy config for build. Please set Firebase env vars in Vercel."
      );
      app = initializeApp({
        apiKey: "dummy-key",
        authDomain: "dummy.firebaseapp.com",
        projectId: "dummy-project",
        storageBucket: "dummy.appspot.com",
        messagingSenderId: "123456789",
        appId: "1:123456789:web:dummy",
      });
    }
  } else {
    app = getApps()[0];
  }
} catch (error) {
  // If initialization fails, try with dummy config
  console.warn("Firebase initialization failed, using dummy config:", error);
  app = initializeApp({
    apiKey: "dummy-key",
    authDomain: "dummy.firebaseapp.com",
    projectId: "dummy-project",
    storageBucket: "dummy.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:dummy",
  });
}

// Initialize Firebase services (safe for SSR)
export const db: Firestore = getFirestore(app);

// Initialize Auth lazily to avoid validation during build/prerender
let authInstance: Auth | null = null;

export const getAuthInstance = (): Auth => {
  if (!authInstance) {
    // Check if we have a valid API key before initializing
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "dummy-key") {
      throw new Error(
        "Firebase Auth: API key not configured. " +
        "Please set NEXT_PUBLIC_FIREBASE_API_KEY in your environment variables."
      );
    }
    
    try {
      authInstance = getAuth(app);
    } catch (error: any) {
      // During build/prerender on Vercel, if API key is invalid,
      // we need to handle it gracefully
      const errorMessage = error?.message || String(error);
      
      if (errorMessage.includes("invalid-api-key")) {
        // This is likely a build-time issue where env vars aren't configured in Vercel
        console.error(
          "Firebase Auth: Invalid API key during build. " +
          "Please ensure all Firebase environment variables are set in Vercel: " +
          "NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, etc."
        );
        // Still create the auth instance - it will fail at runtime if used
        // This allows the build to continue
        authInstance = getAuth(app);
      } else {
        throw error;
      }
    }
  }
  return authInstance;
};

// Export auth as a Proxy that initializes lazily only when accessed
// This prevents initialization during build/prerender
// The auth instance will only be created when actually used
export const auth = new Proxy({} as Auth, {
  get(_target, prop, _receiver) {
    const auth = getAuthInstance();
    const value = (auth as any)[prop];
    if (typeof value === "function") {
      return value.bind(auth);
    }
    return value;
  },
  set(_target, prop, value, _receiver) {
    const auth = getAuthInstance();
    (auth as any)[prop] = value;
    return true;
  },
});

export const storage: FirebaseStorage = getStorage(app);

// Initialize Analytics lazily (only in browser/client-side)
// This prevents initialization during build time on Vercel
let analyticsInstance: Analytics | null = null;

export const getAnalyticsInstance = (): Analytics | null => {
  // Only initialize in browser
  if (typeof window === "undefined") return null;
  
  // Lazy initialization - only create when actually needed
  if (!analyticsInstance) {
    try {
      analyticsInstance = getAnalytics(app);
    } catch (error) {
      console.warn("Firebase Analytics initialization failed:", error);
      return null;
    }
  }
  
  return analyticsInstance;
};

// Export analytics as a getter function for safe access
// During build, this will be null
export const analytics: Analytics | null = null;

export default app;
