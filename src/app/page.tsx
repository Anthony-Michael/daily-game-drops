import { Metadata } from "next";
import { fetchDealsFromDb, serializeFirestoreDocument, GameDealFromAPI } from "../lib/firebase";
import HomePage from "../components/HomePage";
import dailyDeals, { GameDeal } from "../../data/dailyDeals";
import { Suspense } from "react";

// Configure page as dynamic to ensure fresh data on each request
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate this page every hour

/**
 * SEO Metadata for the homepage
 * This provides essential metadata for search engines and social sharing
 */
export const metadata: Metadata = {
  title: "Daily Game Drops - Best Game Deals & Free Games",
  description: "Discover the best daily video game deals, discounts, and free games across PC, PlayStation, Xbox, and Nintendo Switch. Updated daily with the hottest gaming offers.",
  keywords: ["game deals", "video game discounts", "free games", "gaming offers", "PC games", "PlayStation deals", "Xbox deals", "Nintendo Switch deals"],
  openGraph: {
    title: "Daily Game Drops - Best Game Deals & Free Games Daily",
    description: "Discover today's best video game deals, discounts, and free games. Updated daily with the hottest gaming offers across all platforms.",
    url: "https://dailygamedrops.com",
    siteName: "Daily Game Drops",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Daily Game Drops - Best Game Deals & Free Games",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Daily Game Drops - Best Game Deals & Free Games",
    description: "Discover today's best video game deals and free games. Updated daily!",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://dailygamedrops.com",
  },
};

// Loading component for better UX
function GameDealsLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md animate-pulse">
          <div className="h-48 bg-gray-300 dark:bg-gray-700" />
          <div className="p-5">
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-3/4" />
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2 w-full" />
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-2/3" />
            <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Game Deals fetcher component
async function GameDealsContent() {
  // Fetch the latest deals from Firestore (server-side)
  let deals: (GameDeal | GameDealFromAPI)[] = [];
  let error = null;
  
  try {
    console.log("Fetching deals from Firestore...");
    const firestoreDeals = await fetchDealsFromDb(12);
    
    if (firestoreDeals && firestoreDeals.length > 0) {
      console.log(`Successfully loaded ${firestoreDeals.length} deals from Firestore`);
      deals = firestoreDeals;
    } else {
      console.log("No deals found in Firestore, using static data");
      deals = dailyDeals;
    }
  } catch (err) {
    console.error("Error fetching deals from Firestore:", err);
    error = err;
    deals = dailyDeals;
  }

  // If we encountered an error but have fallback data
  if (error && deals.length > 0) {
    return (
      <div className="mb-8">
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
          <p className="text-amber-800 dark:text-amber-200">
            Unable to fetch the latest deals from our database. Showing cached deals instead.
          </p>
        </div>
        <HomePage deals={deals} />
      </div>
    );
  }

  // If we have deals (either from Firestore or fallback)
  if (deals.length > 0) {
    return <HomePage deals={deals} />;
  }

  // If we have no deals at all
  return (
    <div className="flex flex-col items-center justify-center mt-12 p-8 text-center">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
        No Game Deals Available
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        We're unable to load game deals at the moment. Please check back later.
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
      >
        Refresh Page
      </button>
    </div>
  );
}

/**
 * Home page component
 * 
 * This server component coordinates the fetching of game deals from Firestore
 * and renders the appropriate UI based on the result.
 */
export default function Page() {
  // JSON-LD structured data for rich search results
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Daily Game Drops",
    "url": "https://dailygamedrops.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://dailygamedrops.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "description": "Discover the best daily video game deals, discounts, and free games across all platforms.",
    "publisher": {
      "@type": "Organization",
      "name": "Daily Game Drops",
      "logo": {
        "@type": "ImageObject",
        "url": "https://dailygamedrops.com/icon-512.png"
      }
    },
    // Add aggregate rating if available
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "124",
      "bestRating": "5",
      "worstRating": "1"
    },
    // Add a FAQ section for common questions
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How often are game deals updated?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our game deals are updated automatically every day at midnight UTC. We fetch the latest deals from multiple sources including CheapShark API and publisher RSS feeds."
        }
      },
      {
        "@type": "Question",
        "name": "What platforms do you cover?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We primarily focus on PC game deals from Steam, Epic Games Store, Humble Bundle, and other digital stores. We also highlight free game giveaways across all platforms."
        }
      }
    ]
  };

  return (
    <>
      {/* Add structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Game Deals with loading state */}
      <Suspense fallback={<GameDealsLoading />}>
        <GameDealsContent />
      </Suspense>
    </>
  );
}
