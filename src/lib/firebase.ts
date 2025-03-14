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
    const timestamp = new Date();
    const batchId = `batch_${timestamp.getTime()}`;
    console.log(`Creating batch ${batchId} with ${deals.length} deals`);
    
    deals.forEach(deal => {
      // Use dealID as the document ID for consistency and to prevent duplicates
      const docId = deal.dealID || deal.id || `deal_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      const docRef = db.collection(dealsCollection).doc(docId);
      
      // Prepare the deal data with additional metadata
      const dealData = {
        ...deal,
        dateAdded: deal.dateAdded || timestamp.toISOString(),
        lastUpdated: timestamp.toISOString(),
        batchId: batchId,
        // Add additional fields for querying and filtering
        searchableTitle: deal.title?.toLowerCase(),
        dealActiveTimestamp: timestamp,
        // Add a TTL field to automatically expire old deals
        expiresAt: new Date(timestamp.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      };
      
      // Set with merge: true to update existing deals rather than overwrite
      batch.set(docRef, dealData, { merge: true });
    });
    
    console.log(`Committing batch ${batchId} to Firestore...`);
    await batch.commit();
    console.log(`Batch ${batchId} successfully committed!`);
    return true;
  } catch (error) {
    console.error('Error saving deals to Firestore:', error);
    return false;
  }
};

export { db }; 