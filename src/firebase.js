import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// These values can be overridden via a local .env file (e.g. VITE_FIREBASE_API_KEY)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDEhvEoINtb7M2VX_Sr-kj8DbNHA7GhdyI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ucds-website-90c8d.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ucds-website-90c8d",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ucds-website-90c8d.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "988581746465",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:988581746465:web:f3e0faa19ceab7340f1060",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-7MS799Z37R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Initialize Analytics conditionally (it may not be supported in some environments/SSR)
let analytics = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch((err) => {
  console.warn("Analytics initialization failed or not supported in this environment:", err);
});

export { app, db, auth, analytics };

