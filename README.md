# Daily Game Drops

A Next.js application that displays daily game deals and discounts from various online stores, automatically fetching fresh deals every day using the CheapShark API.

## Features

- Daily updated game deals from CheapShark API
- Automated fetching via Vercel Cron Jobs
- Firebase database integration for persistence
- SEO optimized with metadata, sitemap, and structured data
- Responsive design for all devices
- Filter and sort deals by price and type

## Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Go to Project Settings > Service Accounts
4. Generate a new private key for Firebase Admin SDK
5. Set up the following environment variables in your Vercel project:
   - `FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `FIREBASE_CLIENT_EMAIL`: Client email from your service account
   - `FIREBASE_PRIVATE_KEY`: The private key from your service account (with quotes)

6. Enable Firestore Database in your Firebase project
   - Start in test mode for development
   - Set up security rules for production

7. For client-side Firebase access, create a web app in Firebase console
8. Set the following public environment variables in your Vercel project:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

### 2. Vercel Cron Jobs Setup

1. Add a `vercel.json` file to your project root (already included):
   ```json
   {
     "crons": [
       {
         "path": "/api/fetch-deals",
         "schedule": "0 0 * * *"
       }
     ]
   }
   ```

2. Set a `CRON_SECRET` environment variable in your Vercel project for securing cron job requests
3. Deploy your project to Vercel

### 3. Local Development

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env.local` file with all required environment variables
4. Run the development server with `npm run dev`

### 4. Testing Automated Deal Fetching

To test the deal fetching without waiting for the cron job:

1. Visit `/api/fetch-deals` in your browser (for testing only)
2. For production, the endpoint is secured with the `CRON_SECRET`

## Tech Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- Firebase (Firestore)
- Vercel Cron Jobs
- CheapShark API

## License

MIT

## Deployment

Last deployed: <!-- Deployment timestamp: --> ${new Date().toISOString()}
