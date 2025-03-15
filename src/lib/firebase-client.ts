'use client';

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, getDoc, getDocs, 
  query, where, orderBy, limit, addDoc, updateDoc, 
  deleteDoc, onSnapshot, serverTimestamp, Timestamp,
  DocumentData, QueryConstraint, Firestore
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { firebaseConfig, COLLECTIONS } from './firebase-config';

// Initialize Firebase for client-side use
let app;
let db: Firestore;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  // Most likely already initialized
  console.warn("Firebase client initialization error:", error);
}

// Convert Firestore timestamp to ISO string
export function formatTimestamp(timestamp: any): string | null {
  if (!timestamp) return null;
  
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  
  if (timestamp.seconds && timestamp.nanoseconds) {
    return new Date(
      timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000
    ).toISOString();
  }
  
  return null;
}

// =================== FIRESTORE HOOKS ====================

/**
 * Hook to fetch a document from Firestore by ID
 * @param collectionName The collection to fetch from
 * @param documentId The document ID
 * @returns The document data, loading state, and error
 */
export function useDocument<T = DocumentData>(
  collectionName: string,
  documentId: string | null
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!documentId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const unsubscribe = onSnapshot(
      doc(db, collectionName, documentId),
      (snapshot) => {
        if (snapshot.exists()) {
          const docData = { 
            id: snapshot.id, 
            ...snapshot.data() 
          } as unknown as T;
          setData(docData);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error(`Error getting document from ${collectionName}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, [collectionName, documentId]);

  return { data, loading, error };
}

/**
 * Hook to fetch multiple documents from a Firestore collection with optional query
 * @param collectionName The collection to fetch from
 * @param queryConstraints Optional array of query constraints (where, orderBy, etc.)
 * @param queryLimit Optional limit for the query results
 * @returns Array of documents, loading state, and error
 */
export function useCollection<T = DocumentData>(
  collectionName: string,
  queryConstraints: QueryConstraint[] = [],
  queryLimit: number = 100
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    
    // Create collection reference
    const collectionRef = collection(db, collectionName);
    
    // Build query with constraints
    const queryRef = query(
      collectionRef,
      ...queryConstraints,
      limit(queryLimit)
    );
    
    // Listen to query results
    const unsubscribe = onSnapshot(
      queryRef,
      (snapshot) => {
        const documents = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as unknown as T[];
        
        setData(documents);
        setLoading(false);
      },
      (err) => {
        console.error(`Error querying ${collectionName}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, [collectionName, queryConstraints, queryLimit]);

  return { data, loading, error };
}

// =================== FIRESTORE OPERATIONS ====================

/**
 * Fetch a document from Firestore by ID (one-time fetch)
 * @param collectionName The collection to fetch from
 * @param documentId The document ID
 * @returns The document data
 */
export async function fetchDocument<T = DocumentData>(
  collectionName: string,
  documentId: string
): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as unknown as T;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching document from ${collectionName}:`, error);
    return null;
  }
}

/**
 * Fetch documents from a Firestore collection with optional query (one-time fetch)
 * @param collectionName The collection to fetch from
 * @param queryConstraints Optional array of query constraints (where, orderBy, etc.)
 * @param queryLimit Optional limit for the query results
 * @returns Array of documents
 */
export async function fetchCollection<T = DocumentData>(
  collectionName: string,
  queryConstraints: QueryConstraint[] = [],
  queryLimit: number = 100
): Promise<T[]> {
  try {
    const collectionRef = collection(db, collectionName);
    
    const queryRef = query(
      collectionRef,
      ...queryConstraints,
      limit(queryLimit)
    );
    
    const querySnapshot = await getDocs(queryRef);
    
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as unknown as T[];
  } catch (error) {
    console.error(`Error fetching collection ${collectionName}:`, error);
    return [];
  }
}

/**
 * Add a document to a Firestore collection
 * @param collectionName The collection to add to
 * @param data The document data
 * @returns The new document ID if successful
 */
export async function addDocument(
  collectionName: string,
  data: any
): Promise<string | null> {
  try {
    const docData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, collectionName), docData);
    return docRef.id;
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    return null;
  }
}

/**
 * Update a document in a Firestore collection
 * @param collectionName The collection containing the document
 * @param documentId The document ID
 * @param data The fields to update
 * @returns Whether the update was successful
 */
export async function updateDocument(
  collectionName: string,
  documentId: string,
  data: any
): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, documentId);
    
    const updateData = {
      ...data,
      updatedAt: serverTimestamp(),
    };
    
    await updateDoc(docRef, updateData);
    return true;
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    return false;
  }
}

/**
 * Delete a document from a Firestore collection
 * @param collectionName The collection containing the document
 * @param documentId The document ID
 * @returns Whether the deletion was successful
 */
export async function deleteDocument(
  collectionName: string,
  documentId: string
): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, documentId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    return false;
  }
}

// =================== GAME DEALS HELPERS ====================

/**
 * Fetch game deals from Firestore
 * @param limit Maximum number of deals to fetch
 * @returns Array of game deals
 */
export async function fetchDeals(limit: number = 10) {
  return fetchCollection(
    COLLECTIONS.GAME_DEALS,
    [orderBy('dateAdded', 'desc')],
    limit
  );
}

/**
 * Hook to fetch game deals from Firestore
 * @param limit Maximum number of deals to fetch
 * @returns Game deals data, loading state, and error
 */
export function useDeals(limit: number = 10) {
  return useCollection(
    COLLECTIONS.GAME_DEALS,
    [orderBy('dateAdded', 'desc')],
    limit
  );
}

/**
 * Fetch free game deals from Firestore
 * @param limit Maximum number of deals to fetch
 * @returns Array of free game deals
 */
export async function fetchFreeDeals(limit: number = 10) {
  return fetchCollection(
    COLLECTIONS.GAME_DEALS,
    [
      where('dealPrice', '==', 'Free'),
      orderBy('dateAdded', 'desc')
    ],
    limit
  );
}

export { db, COLLECTIONS };

// Export Firestore functions from firebase/firestore for convenience
export { 
  collection, doc, getDoc, getDocs, query, 
  where, orderBy, limit, onSnapshot, serverTimestamp 
}; 