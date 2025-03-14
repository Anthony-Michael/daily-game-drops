import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, DocumentData } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  const apps = getApps();
  
  if (!apps.length) {
    // Use environment variables for configuration
    // These should be set in your Vercel project settings
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    return initializeApp({
      credential: cert(serviceAccount),
    });
  }

  return apps[0];
}

// Initialize Firestore and export the database client
const app = initializeFirebaseAdmin();
const db = getFirestore(app);

// Define the game deal type
export interface GameDealFromAPI {
  id: string;
  title: string;
  dealID: string;
  slug: string;
  imageUrl: string;
  description?: string;
  originalPrice: string;
  dealPrice: string;
  affiliateUrl: string;
  platform?: string;
  datePosted: string;
  dateAdded: string;
  storeID: string;
  storeName: string;
  savings: string;
  metacriticScore?: string;
  steamRatingPercent?: string;
  steamRatingCount?: string;
  expiryDate?: string;
  // Source information for RSS feeds
  source?: 'api' | 'rss';
  sourceType?: 'cheapshark' | 'humble' | 'epic' | string;
  // Additional properties for RSS deals
  categories?: string[];
  isUpcoming?: boolean;
  releaseDate?: string;
  publisher?: string;
  developer?: string;
}

// Collections
const dealsCollection = 'gameDeals';

// Database operations
export const fetchDealsFromDb = async (limit = 6): Promise<GameDealFromAPI[]> => {
  try {
    const snapshot = await db.collection(dealsCollection)
      .orderBy('dateAdded', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as GameDealFromAPI[];
  } catch (error) {
    console.error('Error fetching deals from Firestore:', error);
    return [];
  }
};

export const saveDealsToDb = async (deals: Partial<GameDealFromAPI>[]): Promise<boolean> => {
  try {
    const batch = db.batch();
    
    deals.forEach(deal => {
      // Create a new document with auto-generated ID
      const docRef = db.collection(dealsCollection).doc();
      batch.set(docRef, {
        ...deal,
        dateAdded: new Date().toISOString(),
      });
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error saving deals to Firestore:', error);
    return false;
  }
};

export { db }; 