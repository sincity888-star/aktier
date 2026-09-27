import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAUP4EmdtP8pzsUEFfXdr7K5r45dB649W4",
  authDomain: "gen-lang-client-0913151128.firebaseapp.com",
  projectId: "gen-lang-client-0913151128",
  storageBucket: "gen-lang-client-0913151128.firebasestorage.app",
  messagingSenderId: "25386529940",
  appId: "1:25386529940:web:f9aa2f93dfb6cc5dcff081"
};

let app;
let db;
let auth;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
  auth = getAuth(app);
} catch (err) {
  console.warn("Firebase initialisering fejlede", err);
}

export { db, auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut };

// Gem portefølje, beholdninger og alarmer i Firestore
export async function savePortfolioToCloud(userId = "user_portfolio", data) {
  if (!db) return false;
  try {
    const ref = doc(db, "stock_portfolios", userId);
    await setDoc(ref, {
      ...data,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn("Kunne ikke gemme til Firestore:", err);
    return false;
  }
}

// Synkroniser portefølje i realtid fra Firestore (på tværs af mobil og PC)
export function subscribeToCloudPortfolio(userId = "user_portfolio", onUpdate) {
  if (!db) return () => {};
  try {
    const ref = doc(db, "stock_portfolios", userId);
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data());
      }
    }, (err) => {
      console.warn("Firestore subscription error:", err);
    });
  } catch (err) {
    return () => {};
  }
}
