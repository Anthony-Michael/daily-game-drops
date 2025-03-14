import { XMLParser } from 'fast-xml-parser';
import { GameDealFromAPI } from './firebase';
import { generateAffiliateUrl } from './affiliate';

/**
 * Interface for standardized RSS feed items to parse
 */
interface RSSFeedItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string;
  'content:encoded'?: string;
  enclosure?: {
    '@_url'?: string;
    url?: string;
  };
  category?: string | string[];
}

/**
 * Interface for standard RSS feed structure
 */
interface RSSFeed {
  rss: {
    channel: {
      item: RSSFeedItem[] | RSSFeedItem;
      title?: string;
      description?: string;
    };
  };
}

/**
 * Configuration for RSS feed sources
 */
interface RSSFeedSource {
  url: string;
  name: string;
  type: string;
  storeId: string;
  parser: (data: any) => Promise<GameDealFromAPI[]>;
}

/**
 * Available RSS feed sources
 */
const RSS_SOURCES: RSSFeedSource[] = [
  {
    url: 'https://www.humblebundle.com/store/rss',
    name: 'Humble Store',
    type: 'humble',
    storeId: '4',
    parser: parseHumbleFeed
  },
  {
    // Epic Games doesn't provide a true RSS feed, so we use their API endpoint
    url: 'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions',
    name: 'Epic Games Store',
    type: 'epic',
    storeId: '9',
    parser: parseEpicGamesFeed
  },
  // Add new RSS feed sources here
];

/**
 * Fetches and parses RSS feeds from various game stores
 * 
 * This function attempts to fetch from multiple RSS sources in parallel.
 * If any source fails, the others will still be processed.
 * Each source has its own parser that converts the feed data to our standard GameDealFromAPI format.
 * 
 * @param limit - Optional limit on the number of deals to return per source
 * @returns Promise resolving to an array of GameDealFromAPI objects
 */
export async function fetchRSSFeeds(limit = 3): Promise<GameDealFromAPI[]> {
  console.log('Fetching RSS feeds from sources:', RSS_SOURCES.map(s => s.name).join(', '));
  
  // Fetch all feeds in parallel
  const feedPromises = RSS_SOURCES.map(async (source) => {
    try {
      console.log(`Fetching from ${source.name}...`);
      const response = await fetch(source.url, {
        headers: {
          'User-Agent': 'Daily Game Drops/1.0 (https://dailygamedrops.com)'
        },
        next: { revalidate: 3600 } // Cache for 1 hour
      });
      
      if (!response.ok) {
        console.error(`Error fetching ${source.name} feed: ${response.status} ${response.statusText}`);
        return [];
      }
      
      // Parse the response based on the content type
      const contentType = response.headers.get('content-type') || '';
      let data;
      
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      // Parse the data with the source's specific parser
      const deals = await source.parser(data);
      console.log(`Fetched ${deals.length} deals from ${source.name}`);
      
      // Apply the limit if specified
      return deals.slice(0, limit);
    } catch (error) {
      console.error(`Error processing ${source.name} feed:`, error);
      return [];
    }
  });
  
  // Wait for all feed fetches to complete
  const results = await Promise.all(feedPromises);
  
  // Flatten the results and return
  const allDeals = results.flat();
  console.log(`Total RSS deals fetched: ${allDeals.length}`);
  
  return allDeals;
}

/**
 * Parses Humble Bundle RSS feed
 * 
 * @param xmlText - The XML text from the Humble Bundle RSS feed
 * @returns Array of parsed game deals
 */
async function parseHumbleFeed(xmlText: string): Promise<GameDealFromAPI[]> {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    });
    
    const feed: RSSFeed = parser.parse(xmlText);
    
    // Handle case where there's only a single item
    const items = Array.isArray(feed.rss.channel.item) 
      ? feed.rss.channel.item 
      : [feed.rss.channel.item];
    
    return items.map(item => {
      // Extract price information from description
      const priceMatch = item.description.match(/\$(\d+\.?\d*)/);
      const originalPrice = priceMatch ? `$${priceMatch[1]}` : 'Price not available';
      
      // Process deal price - try to find if it's on sale
      const saleMatch = item.description.match(/now (\$\d+\.?\d*)/i);
      const dealPrice = saleMatch ? saleMatch[1] : 'Free';
      
      // Determine if this is a free game
      const isFree = dealPrice === 'Free' || item.title.toLowerCase().includes('free');
      
      // Calculate savings
      let savings = '0';
      if (isFree) {
        savings = '100';
      } else if (priceMatch && saleMatch) {
        const original = parseFloat(priceMatch[1]);
        const sale = parseFloat(saleMatch[1].replace('$', ''));
        if (original > 0) {
          savings = ((original - sale) / original * 100).toFixed(0);
        }
      }
      
      // Create a slug from the title
      const slug = item.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 50); // Keep slugs reasonably sized
      
      // Generate a unique ID
      const id = item.guid || `humble-${slug}-${Date.now()}`;
      
      // Extract better image if available
      let imageUrl = extractImageUrl(item['content:encoded'] || '');
      
      // Check for enclosure image as backup
      if (!imageUrl && item.enclosure && (item.enclosure['@_url'] || item.enclosure.url)) {
        imageUrl = item.enclosure['@_url'] || item.enclosure.url || '';
      }
      
      // Generate affiliate URL
      const affiliateUrl = generateAffiliateUrl(
        `humble-${id}`,
        '4', // Humble Store ID
        slug,
        item.link
      );
      
      return {
        id,
        title: item.title,
        dealID: `humble-${id}`,
        slug,
        imageUrl,
        description: cleanDescription(item.description),
        originalPrice,
        dealPrice,
        affiliateUrl,
        platform: 'PC',
        datePosted: new Date(item.pubDate).toISOString(),
        dateAdded: new Date().toISOString(),
        storeID: '4', // Humble Store ID
        storeName: 'Humble Store',
        savings,
        source: 'rss',
        sourceType: 'humble',
        // Additional metadata
        categories: extractCategories(item),
      };
    });
  } catch (error) {
    console.error('Error parsing Humble Bundle feed:', error);
    return [];
  }
}

/**
 * Parses Epic Games API response for free games
 * 
 * @param data - The JSON data from Epic Games API
 * @returns Array of parsed game deals
 */
async function parseEpicGamesFeed(data: any): Promise<GameDealFromAPI[]> {
  try {
    if (!data?.data?.Catalog?.searchStore?.elements) {
      console.error('Unexpected Epic Games API response format');
      return [];
    }

    return data.data.Catalog.searchStore.elements
      .filter((game: any) => {
        // Filter for games that have active promotions or are coming soon
        return (
          // Current free games
          (game.promotions?.promotionalOffers?.length > 0) ||
          // Upcoming free games
          (game.promotions?.upcomingPromotionalOffers?.length > 0)
        );
      })
      .map((game: any) => {
        // Determine if this is a current or upcoming promotion
        const hasCurrentPromotion = game.promotions?.promotionalOffers?.length > 0;
        const hasUpcomingPromotion = game.promotions?.upcomingPromotionalOffers?.length > 0;
        
        // Get the relevant promotion data
        let promotion;
        let isUpcoming = false;
        
        if (hasCurrentPromotion) {
          promotion = game.promotions.promotionalOffers[0].promotionalOffers[0];
        } else if (hasUpcomingPromotion) {
          promotion = game.promotions.upcomingPromotionalOffers[0].promotionalOffers[0];
          isUpcoming = true;
        } else {
          // Fallback if structure changes
          promotion = { 
            startDate: new Date().toISOString(), 
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() 
          };
        }
        
        const startDate = new Date(promotion.startDate);
        const endDate = new Date(promotion.endDate);
        
        // Create a slug from the title
        const slug = game.title.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .slice(0, 50); // Keep slugs reasonably sized
        
        // Find the best image
        const imageUrl = findBestEpicImage(game.keyImages) || '';
        
        // Create a more descriptive title for upcoming games
        const title = isUpcoming
          ? `Coming Soon: ${game.title} (Free ${formatDate(startDate)})`
          : game.title;
        
        // Create a better description
        const description = createEpicGameDescription(game, isUpcoming, startDate, endDate);
        
        // Generate affiliate URL with proper Epic Store affiliate parameters
        const affiliateUrl = generateAffiliateUrl(
          `epic-${game.id}`,
          '9', // Epic Store ID
          game.urlSlug || slug,
          `https://store.epicgames.com/en-US/p/${game.urlSlug || slug}`
        );
        
        return {
          id: game.id,
          title,
          dealID: `epic-${game.id}`,
          slug,
          imageUrl,
          description,
          originalPrice: game.price?.totalPrice?.fmtPrice?.originalPrice || 'Price not available',
          dealPrice: isUpcoming ? 'Coming Soon' : 'Free',
          affiliateUrl,
          platform: 'PC',
          datePosted: startDate.toISOString(),
          dateAdded: new Date().toISOString(),
          storeID: '9', // Epic Store ID
          storeName: 'Epic Games Store',
          savings: '100',
          expiryDate: endDate.toISOString(),
          source: 'rss',
          sourceType: 'epic',
          // Additional metadata
          isUpcoming,
          categories: game.categories?.map((c: any) => c.name) || [],
        };
      });
  } catch (error) {
    console.error('Error parsing Epic Games feed:', error);
    return [];
  }
}

/**
 * Extracts image URL from HTML content
 * 
 * @param html - HTML content to search for images
 * @returns The first image URL found, or empty string if none
 */
function extractImageUrl(html: string): string {
  try {
    // Try to find the first image with decent size attributes
    const qualityImgMatch = html.match(/<img[^>]+src="([^"]+)"[^>]+(width|height)="([2-9][0-9]{2,}|[1-9][0-9]{3,})"/i);
    if (qualityImgMatch) {
      return qualityImgMatch[1];
    }
    
    // Fallback to any image
    const imgMatch = html.match(/<img[^>]+src="([^">]+)"/);
    return imgMatch ? imgMatch[1] : '';
  } catch (error) {
    console.error('Error extracting image URL:', error);
    return '';
  }
}

/**
 * Finds the best image from Epic Games keyImages array
 * 
 * @param keyImages - Array of image objects from Epic Games API
 * @returns The URL of the best image found
 */
function findBestEpicImage(keyImages: any[]): string | undefined {
  if (!keyImages || !Array.isArray(keyImages)) {
    return undefined;
  }
  
  // Prioritize certain image types
  const imageTypePriority = [
    'OfferImageWide', 
    'Thumbnail', 
    'DieselStoreFrontWide', 
    'OfferImageTall',
    'ProductLogo'
  ];
  
  // Try to find an image based on priority
  for (const type of imageTypePriority) {
    const image = keyImages.find(img => img.type === type);
    if (image?.url) {
      return image.url;
    }
  }
  
  // Fallback to any image
  return keyImages[0]?.url;
}

/**
 * Cleans up HTML and excessive whitespace from descriptions
 * 
 * @param description - Raw description text
 * @returns Cleaned description text
 */
function cleanDescription(description: string): string {
  return description
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ')    // Collapse whitespace
    .trim();
}

/**
 * Extracts categories from RSS feed item
 * 
 * @param item - RSS feed item
 * @returns Array of categories
 */
function extractCategories(item: RSSFeedItem): string[] {
  if (!item.category) {
    return [];
  }
  
  return Array.isArray(item.category) 
    ? item.category 
    : [item.category];
}

/**
 * Formats a date in a user-friendly format
 * 
 * @param date - Date to format
 * @returns Formatted date string
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Creates a descriptive message for Epic Games
 * 
 * @param game - Game data from Epic API
 * @param isUpcoming - Whether this is an upcoming free game
 * @param startDate - Start date of promotion
 * @param endDate - End date of promotion
 * @returns Formatted description
 */
function createEpicGameDescription(
  game: any, 
  isUpcoming: boolean, 
  startDate: Date, 
  endDate: Date
): string {
  const baseDescription = game.description || 'No description available.';
  
  if (isUpcoming) {
    return `Coming Soon: ${baseDescription} This game will be free from ${formatDate(startDate)} to ${formatDate(endDate)}.`;
  } else {
    return `Free Now: ${baseDescription} Claim this free game before the offer ends on ${formatDate(endDate)}.`;
  }
} 