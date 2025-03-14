import { Metadata } from "next";
import { fetchDealsFromDb, GameDealFromAPI } from "../lib/firebase";
import HomePage from "../components/HomePage";
import dailyDeals, { GameDeal } from "../../data/dailyDeals";

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

/**
 * Home page component
 * 
 * This server component fetches the latest game deals from Firestore
 * and passes them to the client-side HomePage component.
 * 
 * If Firestore fetch fails, it falls back to static data.
 */
export default async function Page() {
  // Fetch the latest deals from Firestore (server-side)
  let deals: (GameDeal | GameDealFromAPI)[];
  try {
    console.log("Fetching deals from Firestore for homepage...");
    const firestoreDeals = await fetchDealsFromDb(12);
    
    // Only use Firestore deals if we got some results
    if (firestoreDeals && firestoreDeals.length > 0) {
      console.log(`Successfully loaded ${firestoreDeals.length} deals from Firestore`);
      deals = firestoreDeals;
    } else {
      console.log("No deals found in Firestore, using static data");
      deals = dailyDeals;
    }
  } catch (error) {
    // If Firestore fetch fails, fall back to static data
    console.error("Error fetching deals from Firestore:", error);
    deals = dailyDeals;
  }

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
    "description": "Discover the best daily video game deals, discounts, and free games across PC, PlayStation, Xbox, and Nintendo Switch.",
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

  // ItemList structured data for the deals
  const itemListData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": deals.slice(0, 10).map((deal, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": deal.title,
        "description": deal.description || `${deal.title} on sale`,
        "offers": {
          "@type": "Offer",
          "price": deal.dealPrice === "Free" ? "0" : deal.dealPrice.replace("$", ""),
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "url": `https://dailygamedrops.com/deals/${deal.slug}`
        },
        "image": deal.imageUrl
      }
    }))
  };

  return (
    <>
      {/* Add structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListData) }}
      />
      
      {/* Pass deals to the client component */}
      <HomePage deals={deals as any} />
    </>
  );
}
