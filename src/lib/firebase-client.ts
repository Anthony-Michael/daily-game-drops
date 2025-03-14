import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, limit, getDocs, Firestore } from 'firebase/firestore';
import { GameDealFromAPI } from './firebase';

let firebaseApp: FirebaseApp | undefined;
let firestoreDb: Firestore;

// Firebase configuration for client side
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase client
function initializeFirebase() {
  const apps = getApps();
  
  if (!firebaseApp && apps.length === 0) {
    firebaseApp = initializeApp(firebaseConfig);
  } else if (apps.length > 0) {
    firebaseApp = apps[0];
  }
  
  if (!firestoreDb && firebaseApp) {
    firestoreDb = getFirestore(firebaseApp);
  }
  
  return { app: firebaseApp, db: firestoreDb };
}

// Initialize the app and get the database
const { db } = initializeFirebase();

// Fetch deals from Firestore
export async function fetchDeals(limitCount = 6): Promise<GameDealFromAPI[]> {
  try {
    if (!db) {
      console.error('Firestore database not initialized');
      return [];
    }
    
    const dealsQuery = query(
      collection(db, 'gameDeals'),
      orderBy('dateAdded', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(dealsQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as GameDealFromAPI[];
  } catch (error) {
    console.error('Error fetching deals:', error);
    return [];
  }
}

export { db }; 