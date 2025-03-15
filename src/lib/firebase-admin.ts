import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from './firebase-config';

// Type for serialized Firestore documents
export interface FirestoreDoc {
  id: string;
  [key: string]: any;
}

/**
 * Initialize Firebase Admin SDK for server-side operations
 * This ensures we only initialize the app once
 */
function initializeFirebaseAdmin() {
  const apps = getApps();
  
  if (!apps.length) {
    try {
      // Use environment variables for service account
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace escaped newlines in the private key
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };

      return initializeApp({
        credential: cert(serviceAccount),
      });
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
      throw new Error('Firebase Admin initialization failed');
    }
  }

  return apps[0];
}

// Initialize Firebase Admin and get Firestore
const app = initializeFirebaseAdmin();
const adminDb = getFirestore(app);

/**
 * Helper function to serialize Firestore documents
 * Converts Timestamps and other Firestore-specific types to standard JS types
 */
export function serializeFirestoreDocument<T = any>(document: any): T {
  if (!document) return document;
  
  // Handle arrays
  if (Array.isArray(document)) {
    return document.map(item => serializeFirestoreDocument(item)) as any;
  }
  
  if (typeof document !== 'object') return document;

  // Create a new object to hold the serialized values
  const serialized: Record<string, any> = {};
  
  // Process each key in the document
  for (const [key, value] of Object.entries(document)) {
    // Check if the value is a Firestore Timestamp
    if (value instanceof Timestamp) {
      serialized[key] = value.toDate().toISOString();
    } 
    // Handle Firestore DocumentReference
    else if (value && typeof value === 'object' && value.path) {
      serialized[key] = value.path;
    }
    // Handle nested objects
    else if (value && typeof value === 'object') {
      serialized[key] = serializeFirestoreDocument(value);
    } 
    // Handle regular values
    else {
      serialized[key] = value;
    }
  }
  
  return serialized as T;
}

/**
 * Fetch a document from Firestore by ID
 * @param collection Collection name
 * @param id Document ID
 * @returns The document data with ID
 */
export async function getDocById<T = FirestoreDoc>(collection: string, id: string): Promise<T | null> {
  try {
    const docRef = adminDb.collection(collection).doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return null;
    }
    
    const data = doc.data();
    return serializeFirestoreDocument({ id: doc.id, ...data }) as T;
  } catch (error) {
    console.error(`Error fetching ${collection} document ${id}:`, error);
    return null;
  }
}

/**
 * Query documents from a Firestore collection
 * @param collection Collection name
 * @param queryFn Function to build the query
 * @param limit Maximum number of documents to return
 * @returns Array of serialized documents
 */
export async function queryCollection<T = FirestoreDoc>(
  collection: string,
  queryFn?: (query: FirebaseFirestore.Query) => FirebaseFirestore.Query,
  limit = 100
): Promise<T[]> {
  try {
    let query = adminDb.collection(collection);
    
    if (queryFn) {
      query = queryFn(query);
    }
    
    // Apply limit
    query = query.limit(limit);
    
    const snapshot = await query.get();
    
    // Map results to a serialized format
    return snapshot.docs.map(doc => 
      serializeFirestoreDocument({ id: doc.id, ...doc.data() })
    ) as T[];
  } catch (error) {
    console.error(`Error querying ${collection}:`, error);
    return [];
  }
}

/**
 * Add a document to a Firestore collection
 * @param collection Collection name
 * @param data Document data
 * @returns The document ID if successful
 */
export async function addDocument(collection: string, data: any): Promise<string | null> {
  try {
    // Add timestamps
    const docData = {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };
    
    const docRef = await adminDb.collection(collection).add(docData);
    return docRef.id;
  } catch (error) {
    console.error(`Error adding document to ${collection}:`, error);
    return null;
  }
}

/**
 * Update a document in a Firestore collection
 * @param collection Collection name
 * @param id Document ID
 * @param data Updated data (partial)
 * @returns Whether the update was successful
 */
export async function updateDocument(collection: string, id: string, data: any): Promise<boolean> {
  try {
    const docRef = adminDb.collection(collection).doc(id);
    
    // Add timestamp
    const updateData = {
      ...data,
      updatedAt: FieldValue.serverTimestamp()
    };
    
    await docRef.update(updateData);
    return true;
  } catch (error) {
    console.error(`Error updating document ${id} in ${collection}:`, error);
    return false;
  }
}

/**
 * Delete a document from a Firestore collection
 * @param collection Collection name
 * @param id Document ID
 * @returns Whether the deletion was successful
 */
export async function deleteDocument(collection: string, id: string): Promise<boolean> {
  try {
    await adminDb.collection(collection).doc(id).delete();
    return true;
  } catch (error) {
    console.error(`Error deleting document ${id} from ${collection}:`, error);
    return false;
  }
}

// Export the Firestore instance and collections
export { adminDb, COLLECTIONS };

// Export types
export type FirestoreTimestamp = FirebaseFirestore.Timestamp;
export type FirestoreQuery = FirebaseFirestore.Query; 