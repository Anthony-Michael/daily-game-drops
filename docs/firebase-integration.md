# Firebase Firestore Integration with Next.js

This document provides an overview of how Firebase Firestore is integrated with Next.js in this application.

## Table of Contents

1. [Setup & Configuration](#setup--configuration)
2. [Server-Side Integration](#server-side-integration)
3. [Client-Side Integration](#client-side-integration)
4. [Common Use Cases](#common-use-cases)
5. [Best Practices](#best-practices)

## Setup & Configuration

### Environment Variables

Required environment variables for Firebase:

**.env.local**:
```
# Firebase Client (public)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (private)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY=your_private_key
```

### Firebase Project Setup

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Add a Web App to your project
3. Create a Firestore database
4. Set up appropriate security rules
5. Generate a service account key for server-side access

## Server-Side Integration

Server-side Firestore integration is implemented in `/src/lib/firebase-admin.ts`. This allows for:

- Secure server-side access to Firestore
- Data fetching in API routes
- Data fetching in server components and pages

Key features:

- Single initialization pattern to prevent multiple Firebase instances
- Type-safe document serialization to handle Firestore types (Timestamps, etc.)
- Helper functions for common operations (get, query, add, update, delete)

Example usage in an API route:

```typescript
import { getDocById, COLLECTIONS } from '@/lib/firebase-admin';

export async function GET(request: Request, { params }) {
  const id = params.id;
  const document = await getDocById(COLLECTIONS.GAME_DEALS, id);
  
  if (!document) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  
  return Response.json(document);
}
```

Example usage in a Server Component:

```typescript
import { queryCollection, COLLECTIONS } from '@/lib/firebase-admin';

export default async function ServerComponent() {
  const documents = await queryCollection(
    COLLECTIONS.GAME_DEALS,
    (q) => q.orderBy('dateAdded', 'desc').limit(10)
  );
  
  return (
    <div>
      {documents.map(doc => (
        <div key={doc.id}>{doc.title}</div>
      ))}
    </div>
  );
}
```

## Client-Side Integration

Client-side Firestore integration is implemented in `/src/lib/firebase-client.ts`. This provides:

- React hooks for real-time data
- Functions for one-time data fetching
- Helper functions for client-side data manipulation

Key features:

- Custom hooks for documents and collections
- Real-time updates with Firebase's `onSnapshot`
- Type safety with TypeScript generics

Example usage of hooks:

```typescript
'use client';

import { useDocument, useCollection, COLLECTIONS } from '@/lib/firebase-client';
import { where, orderBy } from 'firebase/firestore';

function ClientComponent() {
  // Fetch a single document with real-time updates
  const { data: game, loading, error } = useDocument(
    COLLECTIONS.GAME_DEALS,
    'document-id'
  );
  
  // Fetch multiple documents with query constraints
  const { data: games, loading: gamesLoading } = useCollection(
    COLLECTIONS.GAME_DEALS,
    [
      where('dealPrice', '==', 'Free'),
      orderBy('dateAdded', 'desc')
    ],
    10 // limit
  );
  
  if (loading || gamesLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h1>{game?.title}</h1>
      <h2>Other Games:</h2>
      {games.map(g => (
        <div key={g.id}>{g.title}</div>
      ))}
    </div>
  );
}
```

## Common Use Cases

### 1. Fetching Documents for a Page

```typescript
// In a server component or page:
const document = await getDocById(COLLECTIONS.GAME_DEALS, id);

// In a client component:
const { data, loading } = useDocument(COLLECTIONS.GAME_DEALS, id);
```

### 2. Querying Collections

```typescript
// In a server component or page:
const documents = await queryCollection(
  COLLECTIONS.GAME_DEALS,
  (q) => q.where('dealPrice', '==', 'Free').orderBy('dateAdded', 'desc'),
  10
);

// In a client component:
import { where, orderBy } from 'firebase/firestore';

const { data, loading } = useCollection(
  COLLECTIONS.GAME_DEALS,
  [
    where('dealPrice', '==', 'Free'),
    orderBy('dateAdded', 'desc')
  ],
  10
);
```

### 3. Adding Documents

```typescript
// In a server API route:
import { addDocument, COLLECTIONS } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  const data = await request.json();
  const documentId = await addDocument(COLLECTIONS.GAME_DEALS, data);
  return Response.json({ id: documentId });
}

// In a client component:
import { addDocument, COLLECTIONS } from '@/lib/firebase-client';

async function handleSubmit(data) {
  const documentId = await addDocument(COLLECTIONS.GAME_DEALS, data);
  console.log('Added document:', documentId);
}
```

### 4. Updating Documents

```typescript
// In a server API route:
import { updateDocument, COLLECTIONS } from '@/lib/firebase-admin';

export async function PATCH(request: Request) {
  const { id, ...data } = await request.json();
  const success = await updateDocument(COLLECTIONS.GAME_DEALS, id, data);
  return Response.json({ success });
}

// In a client component:
import { updateDocument, COLLECTIONS } from '@/lib/firebase-client';

async function handleUpdate(id, data) {
  const success = await updateDocument(COLLECTIONS.GAME_DEALS, id, data);
  console.log('Updated document:', success);
}
```

### 5. Deleting Documents

```typescript
// In a server API route:
import { deleteDocument, COLLECTIONS } from '@/lib/firebase-admin';

export async function DELETE(request: Request, { params }) {
  const id = params.id;
  const success = await deleteDocument(COLLECTIONS.GAME_DEALS, id);
  return Response.json({ success });
}

// In a client component:
import { deleteDocument, COLLECTIONS } from '@/lib/firebase-client';

async function handleDelete(id) {
  const success = await deleteDocument(COLLECTIONS.GAME_DEALS, id);
  console.log('Deleted document:', success);
}
```

## Best Practices

1. **Use Server Components for Initial Data Load**
   - Fetch initial data on the server for better SEO and performance
   - Use client-side hooks for real-time updates after initial load

2. **Use Collection Constants**
   - Define collection names in a central place (`COLLECTIONS` object)
   - Avoid hardcoding collection names to prevent typos

3. **Handle Timestamps Properly**
   - Always use `serializeFirestoreDocument` when returning Firestore data from API routes
   - Use `formatTimestamp` helper on the client when working with timestamp fields

4. **Error Handling**
   - Always include proper error handling with try/catch blocks
   - Log errors on the server for debugging
   - Provide user-friendly error messages on the client

5. **Security**
   - Never expose Firebase Admin credentials to the client
   - Use proper authentication and authorization for sensitive operations
   - Set up Firestore security rules to restrict access at the database level

6. **Performance Optimization**
   - Use query limits to avoid fetching too much data
   - Implement pagination for large collections
   - Consider caching for frequently accessed data
   - Use the `where` clause effectively to filter data on the server

7. **Data Validation**
   - Validate data before saving to Firestore
   - Define clear data models with TypeScript interfaces

8. **Real-time Updates**
   - Only use real-time listeners (`onSnapshot`) when necessary
   - Clean up listeners with the returned unsubscribe function to prevent memory leaks 