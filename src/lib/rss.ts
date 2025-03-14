import { XMLParser } from 'fast-xml-parser';
import { GameDealFromAPI } from './firebase';

interface RSSFeedItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string;
  'content:encoded'?: string;
}

interface RSSFeed {
  rss: {
    channel: {
      item: RSSFeedItem[];
    };
  };
}

/**
 * Fetches and parses RSS feeds from various game stores
 */
export async function fetchRSSFeeds(): Promise<GameDealFromAPI[]> {
  const deals: GameDealFromAPI[] = [];
  
  try {
    // Fetch Humble Bundle RSS feed
    const humbleResponse = await fetch('https://www.humblebundle.com/store/rss');
    if (humbleResponse.ok) {
      const humbleText = await humbleResponse.text();
      const humbleDeals = await parseHumbleFeed(humbleText);
      deals.push(...humbleDeals);
    }

    // Fetch Epic Games free games (using their API endpoint)
    const epicResponse = await fetch('https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions');
    if (epicResponse.ok) {
      const epicData = await epicResponse.json();
      const epicDeals = parseEpicGamesFeed(epicData);
      deals.push(...epicDeals);
    }
  } catch (error) {
    console.error('Error fetching RSS feeds:', error);
  }

  return deals;
}

/**
 * Parses Humble Bundle RSS feed
 */
async function parseHumbleFeed(xmlText: string): Promise<GameDealFromAPI[]> {
  const parser = new XMLParser();
  const feed: RSSFeed = parser.parse(xmlText);
  
  return feed.rss.channel.item.map(item => {
    // Extract price information from description
    const priceMatch = item.description.match(/\$(\d+\.?\d*)/);
    const originalPrice = priceMatch ? `$${priceMatch[1]}` : 'Price not available';
    
    // Create a slug from the title
    const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    return {
      id: item.guid,
      title: item.title,
      dealID: `humble-${item.guid}`,
      slug,
      imageUrl: extractImageUrl(item['content:encoded'] || ''),
      description: item.description,
      originalPrice,
      dealPrice: 'Free', // Humble RSS feed items are typically free games
      affiliateUrl: item.link,
      platform: 'PC',
      datePosted: new Date(item.pubDate).toISOString(),
      dateAdded: new Date().toISOString(),
      storeID: '4', // Humble Store ID
      storeName: 'Humble Store',
      savings: '100', // Free games are 100% savings
      source: 'rss',
      sourceType: 'humble'
    };
  });
}

/**
 * Parses Epic Games API response
 */
function parseEpicGamesFeed(data: any): GameDealFromAPI[] {
  if (!data?.data?.Catalog?.searchStore?.elements) {
    return [];
  }

  return data.data.Catalog.searchStore.elements
    .filter((game: any) => game.promotions?.promotionalOffers?.length > 0)
    .map((game: any) => {
      const promotion = game.promotions.promotionalOffers[0];
      const startDate = new Date(promotion.startDate);
      const endDate = new Date(promotion.endDate);
      
      // Create a slug from the title
      const slug = game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      return {
        id: game.id,
        title: game.title,
        dealID: `epic-${game.id}`,
        slug,
        imageUrl: game.keyImages.find((img: any) => img.type === 'OfferImageWide')?.url || '',
        description: game.description,
        originalPrice: game.price?.totalPrice?.fmtPrice?.originalPrice || 'Price not available',
        dealPrice: 'Free',
        affiliateUrl: `https://store.epicgames.com/en-US/p/${game.urlSlug}`,
        platform: 'PC',
        datePosted: startDate.toISOString(),
        dateAdded: new Date().toISOString(),
        storeID: 'epic', // Custom store ID for Epic
        storeName: 'Epic Games Store',
        savings: '100',
        expiryDate: endDate.toISOString(),
        source: 'rss',
        sourceType: 'epic'
      };
    });
}

/**
 * Extracts image URL from HTML content
 */
function extractImageUrl(html: string): string {
  const imgMatch = html.match(/<img[^>]+src="([^">]+)"/);
  return imgMatch ? imgMatch[1] : '';
} 