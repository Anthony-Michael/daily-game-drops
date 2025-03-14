/**
 * Interface defining the structure of a game deal
 */
export interface GameDeal {
  id: number;
  title: string;
  slug: string; // SEO-friendly URL slug
  imageUrl: string;
  description: string;
  originalPrice: string;
  dealPrice: string; // Can be a price or 'Free'
  affiliateUrl: string;
  datePosted: string; // ISO date string
  platform?: string; // Optional platform information
  expiryDate?: string; // Optional expiry date
  // SEO fields
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
}

// Helper function to generate a slug from a title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

/**
 * Array of daily game deals
 */
const dailyDeals: GameDeal[] = [
  {
    id: 1,
    title: "Elden Ring",
    slug: "elden-ring",
    imageUrl: "https://placehold.co/600x400/3a1c71/ffffff?text=Elden+Ring",
    description: "Embark on a journey through a meticulously crafted world on the brink of a shattering event in FromSoftware's largest game to-date.",
    originalPrice: "$59.99",
    dealPrice: "$39.99",
    affiliateUrl: "https://example.com/affiliate/elden-ring",
    datePosted: "2023-03-14T08:00:00Z",
    platform: "PC, PlayStation, Xbox",
    expiryDate: "2023-03-21T23:59:59Z",
    metaTitle: "Elden Ring | 33% Off | Daily Game Drops",
    metaDescription: "Save $20 on Elden Ring, FromSoftware's critically acclaimed action RPG with a vast open world and challenging combat.",
    keywords: ["elden ring", "fromsoft", "rpg", "game deal", "discount", "action rpg"]
  },
  {
    id: 2,
    title: "Horizon Forbidden West",
    slug: "horizon-forbidden-west",
    imageUrl: "https://placehold.co/600x400/3a1c71/ffffff?text=Horizon+Forbidden+West",
    description: "Join Aloy as she braves the Forbidden West, a majestic but dangerous frontier that conceals mysterious new threats.",
    originalPrice: "$69.99",
    dealPrice: "$29.99",
    affiliateUrl: "https://example.com/affiliate/horizon-forbidden-west",
    datePosted: "2023-03-14T08:30:00Z",
    platform: "PlayStation",
    metaTitle: "Horizon Forbidden West | 57% Off | Daily Game Drops",
    metaDescription: "Grab Horizon Forbidden West at a massive discount and continue Aloy's journey in this breathtaking PlayStation exclusive.",
    keywords: ["horizon", "forbidden west", "aloy", "playstation", "ps5", "game deal"]
  },
  {
    id: 3,
    title: "Epic Games Store - Weekly Free Game",
    slug: "epic-games-weekly-free",
    imageUrl: "https://placehold.co/600x400/3a1c71/ffffff?text=Epic+Games+Free",
    description: "Claim this week's free game from Epic Games Store. Available for a limited time only.",
    originalPrice: "$24.99",
    dealPrice: "Free",
    affiliateUrl: "https://example.com/affiliate/epic-free-game",
    datePosted: "2023-03-14T09:00:00Z",
    platform: "PC",
    expiryDate: "2023-03-21T15:00:00Z",
    metaTitle: "Free PC Game This Week | Epic Games Store | Daily Game Drops",
    metaDescription: "Claim a free PC game from Epic Games Store this week. Limited time offer - don't miss out!",
    keywords: ["free game", "epic games", "pc gaming", "free", "epic store", "giveaway"]
  }
];

export default dailyDeals; 