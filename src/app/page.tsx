import { Metadata } from "next";
import dailyDeals from "../../data/dailyDeals";
import HomePage from "../components/HomePage";

// Export metadata for this page
export const metadata: Metadata = {
  title: "Daily Game Drops - Best Game Deals & Free Games",
  description: "Discover the best daily video game deals, discounts, and free games across PC, PlayStation, Xbox, and Nintendo Switch. Updated daily with the hottest gaming offers.",
  keywords: ["game deals", "video game discounts", "free games", "gaming offers", "PC games", "PlayStation deals", "Xbox deals", "Nintendo Switch deals"],
  openGraph: {
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Daily Game Drops - Best Game Deals & Free Games",
      },
    ],
  },
};

// JSON-LD structured data for the homepage
export default function Page() {
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
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomePage deals={dailyDeals} />
    </>
  );
}
