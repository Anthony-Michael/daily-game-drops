import { NextResponse } from 'next/server';
import { saveDealsToDb, GameDealFromAPI } from '@/lib/firebase';
import { generateAffiliateUrl, getStoreName } from '@/lib/affiliate';
import { fetchRSSFeeds } from '@/lib/rss';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * API Configuration Constants
 */
// Default number of deals to fetch per source
const DEFAULT_LIMIT = 10;
const DEFAULT_RSS_LIMIT = 5;

// CheapShark API endpoints
const CHEAPSHARK_API_URL = 'https://www.cheapshark.com/api/1.0';
const CHEAPSHARK_DEALS_ENDPOINT = `${CHEAPSHARK_API_URL}/deals`;
const CHEAPSHARK_STORES_ENDPOINT = `${CHEAPSHARK_API_URL}/stores`;

// Minimum savings percentage to consider a deal worth including
const MIN_SAVINGS_PERCENT = 20;

/**
 * Fetches game deals from the CheapShark API
 * 
 * This function retrieves the latest and best game deals from CheapShark,
 * applying quality filters to ensure only relevant deals are returned.
 * Each deal is transformed to match our application's data model.
 * 
 * @param limit - Maximum number of deals to fetch
 * @returns Promise resolving to an array of formatted game deals
 */
async function fetchCheapSharkDeals(limit: number): Promise<GameDealFromAPI[]> {
  console.log(`🎮 Fetching CheapShark deals (target: ${limit} quality deals)`);
  
  try {
    // Fetch more deals than requested to allow for filtering
    const fetchLimit = limit * 3;
    
    // We'll make multiple requests to get a diverse set of deals
    const requests = [
      // Recent deals (newest first)
      fetchDealsWithParams({
        pageSize: fetchLimit.toString(),
        sortBy: 'recent',
        onSale: 'true',
        desc: '0'
      }),
      // Best savings (highest discount first)
      fetchDealsWithParams({
        pageSize: fetchLimit.toString(),
        sortBy: 'savings',
        onSale: 'true',
        desc: '0' 
      }),
      // Highly rated deals (best ratings first)
      fetchDealsWithParams({
        pageSize: Math.floor(fetchLimit / 2).toString(),
        sortBy: 'metacritic',
        metacritic: '80',
        onSale: 'true',
        desc: '0'
      }),
      // Free games
      fetchDealsWithParams({
        pageSize: Math.floor(fetchLimit / 3).toString(),
        upperPrice: '0',
        desc: '0'
      })
    ];
    
    // Execute all requests in parallel
    console.log(`🔄 Making multiple requests to CheapShark API for diverse deals...`);
    const results = await Promise.all(requests);
    
    // Combine and deduplicate results
    const allDeals = results.flat();
    console.log(`✅ Received ${allDeals.length} total deals (before deduplication)`);
    
    // Deduplicate deals by dealID
    const dedupedDeals = Array.from(
      new Map(allDeals.map(deal => [deal.dealID, deal])).values()
    );
    console.log(`✅ Deduplicated to ${dedupedDeals.length} unique deals`);
    
    // Apply filters for quality
    const filteredDeals = dedupedDeals
      // Only include deals with images
      .filter((deal) => deal.thumb)
      // Only include deals with good savings (unless they're free)
      .filter((deal) => 
        parseFloat(deal.salePrice) === 0 || 
        parseFloat(deal.savings) >= MIN_SAVINGS_PERCENT
      )
      // Sort by a combination of recency and savings
      .sort((a, b) => {
        // Prioritize free games
        if (parseFloat(a.salePrice) === 0 && parseFloat(b.salePrice) !== 0) return -1;
        if (parseFloat(a.salePrice) !== 0 && parseFloat(b.salePrice) === 0) return 1;
        
        // Then sort by savings percentage
        return parseFloat(b.savings) - parseFloat(a.savings);
      })
      // Limit to requested number
      .slice(0, limit);
    
    console.log(`⭐ Filtered to ${filteredDeals.length} high-quality deals`);
    
    // Transform raw deals into our application format
    return filteredDeals.map(transformDealToAppFormat);
  } catch (error) {
    console.error('❌ Error fetching CheapShark deals:', error);
    return [];
  }
}

/**
 * Fetches deals from CheapShark API with specific parameters
 * 
 * @param params - Query parameters for the CheapShark API
 * @returns Promise resolving to an array of raw game deals
 */
async function fetchDealsWithParams(params: Record<string, string>): Promise<any[]> {
  try {
    // Build the API URL with parameters
    const apiUrl = new URL(CHEAPSHARK_DEALS_ENDPOINT);
    Object.entries(params).forEach(([key, value]) => {
      apiUrl.searchParams.append(key, value);
    });
    
    console.log(`📡 Requesting data from: ${apiUrl.toString()}`);
    
    // Fetch data from CheapShark API
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'DailyGameDrops/1.0 (https://dailygamedrops.com)'
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`CheapShark API error: ${response.status} ${response.statusText}`);
    }
    
    // Parse the response as JSON
    const data = await response.json();
    console.log(`✅ Received ${data.length} deals from ${apiUrl.toString()}`);
    
    return data;
  } catch (error) {
    console.error(`❌ Error fetching deals with params ${JSON.stringify(params)}:`, error);
    return [];
  }
}

/**
 * Transforms a raw CheapShark deal into our application format
 * 
 * @param deal - Raw deal data from CheapShark API
 * @returns Formatted game deal for our application
 */
function transformDealToAppFormat(deal: any): GameDealFromAPI {
  // Generate a unique ID using deal information
  const uniqueId = deal.dealID || `cheapshark-${deal.gameID}-${Date.now()}`;
  
  // Generate the appropriate affiliate URL
  const affiliateUrl = generateAffiliateUrl(
    uniqueId,
    deal.storeID,
    deal.gameID,
    deal.dealID
  );

  // Get store name for better display
  const storeName = getStoreName(deal.storeID);
  
  // Create a descriptive message about the deal
  const savingsPercent = Math.round(parseFloat(deal.savings));
  const description = createDealDescription(deal.title, storeName, savingsPercent, deal.metacriticScore);

  // Generate a clean, SEO-friendly slug
  const slug = generateSlug(deal.title, deal.gameID);

  // Format prices consistently
  const originalPrice = formatPrice(deal.normalPrice);
  const dealPrice = formatPrice(deal.salePrice);
  
  // Create timestamp for better sorting and querying
  const now = new Date();
  
  // Return the formatted deal
  return {
    id: uniqueId,
    title: deal.title,
    dealID: deal.dealID,
    imageUrl: deal.thumb,
    description,
    originalPrice,
    dealPrice,
    affiliateUrl,
    storeID: deal.storeID,
    storeName,
    savings: deal.savings,
    metacriticScore: deal.metacriticScore,
    steamRatingPercent: deal.steamRatingPercent,
    steamRatingCount: deal.steamRatingCount,
    slug,
    platform: 'PC',
    datePosted: now.toISOString(),
    dateAdded: now.toISOString(),
    source: 'api',
    sourceType: 'cheapshark',
    // Add any additional game metadata if available
    publisher: deal.publisher || undefined,
    developer: deal.developer || undefined,
    releaseDate: deal.releaseDate ? new Date(deal.releaseDate).toISOString() : undefined,
  };
}

/**
 * Generates a slug from a game title and ID
 * 
 * Creates a URL-friendly slug by combining the sanitized title with the game ID
 * for uniqueness. This ensures SEO-friendly URLs and prevents collisions.
 * 
 * @param title - The game title
 * @param gameId - The unique game identifier
 * @returns A URL-friendly slug string
 */
function generateSlug(title: string, gameId: string): string {
  // Convert title to lowercase and replace non-alphanumeric characters with hyphens
  const sanitizedTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')     // Remove leading/trailing hyphens
    .replace(/-{2,}/g, '-')      // Replace multiple consecutive hyphens with a single one
    .slice(0, 50);               // Limit length for readability
  
  // Combine with game ID for uniqueness (if available)
  return gameId 
    ? `${sanitizedTitle}-${gameId}` 
    : sanitizedTitle;
}

/**
 * Creates a descriptive message for a game deal
 * 
 * Generates a user-friendly description highlighting key aspects of the deal
 * including savings percentage, store information, and game ratings if available.
 * 
 * @param title - Game title
 * @param storeName - Name of the store offering the deal
 * @param savingsPercent - Percentage discount
 * @param metacriticScore - Optional Metacritic score
 * @returns Formatted description string
 */
function createDealDescription(
  title: string, 
  storeName: string, 
  savingsPercent: number,
  metacriticScore?: string
): string {
  let description = `${title} is now ${savingsPercent}% off at ${storeName}!`;
  
  // Add metacritic info if available
  if (metacriticScore && parseInt(metacriticScore) > 0) {
    description += ` This game has a Metacritic score of ${metacriticScore}.`;
  }
  
  // Add call-to-action
  description += ` Don't miss this limited-time offer.`;
  
  return description;
}

/**
 * Formats a price value consistently
 * 
 * Ensures all prices are formatted with dollar sign and two decimal places.
 * 
 * @param price - The raw price value (string or number)
 * @returns Formatted price string (e.g., "$19.99")
 */
function formatPrice(price: string | number): string {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  // Handle free games
  if (numericPrice === 0) {
    return 'Free';
  }
  
  // Format with dollar sign and two decimal places
  return `$${numericPrice.toFixed(2)}`;
}

/**
 * GET handler for the /api/fetch-deals endpoint
 * 
 * This function fetches deals from CheapShark API and RSS feeds,
 * combines them, saves them to Firebase Firestore, and returns them.
 * It can be triggered manually or via browser for testing.
 * 
 * @param request - The incoming request
 * @returns A JSON response with the fetched deals
 */
export async function GET(request: Request) {
  console.log('📥 Processing GET request to /api/fetch-deals');
  
  try {
    // Get the limit from query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT));
    const rssLimit = Math.floor(limit / 2) || DEFAULT_RSS_LIMIT;
    
    console.log(`🔢 Requested limits: CheapShark=${limit}, RSS=${rssLimit}`);
    
    // Record start time for performance tracking
    const startTime = Date.now();
    
    // Fetch deals from both sources in parallel
    console.log('🔄 Fetching deals from multiple sources in parallel...');
    const [cheapSharkDeals, rssDeals] = await Promise.all([
      fetchCheapSharkDeals(limit),
      fetchRSSFeeds(rssLimit)
    ]);
    
    // Calculate fetch duration
    const fetchDuration = (Date.now() - startTime) / 1000;
    console.log(`⏱️ Fetch completed in ${fetchDuration.toFixed(2)} seconds`);
    console.log(`📊 Results: ${cheapSharkDeals.length} CheapShark deals, ${rssDeals.length} RSS deals`);
    
    // Combine all deals and sort by date (newest first)
    const allDeals = [...cheapSharkDeals, ...rssDeals]
      .sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime());
    
    // Add a timestamp for tracking in the database
    const batchTimestamp = new Date().toISOString();
    const dealsWithBatchInfo = allDeals.map(deal => ({
      ...deal,
      batchTimestamp,
      lastUpdated: new Date().toISOString()
    }));
    
    // Save the deals to Firestore
    console.log(`💾 Saving ${dealsWithBatchInfo.length} deals to Firestore...`);
    const success = await saveDealsToDb(dealsWithBatchInfo);
    
    if (!success) {
      console.error('❌ Failed to save deals to Firestore');
      return NextResponse.json({ 
        error: 'Database storage error',
        message: 'Failed to save deals to database'
      }, { status: 500 });
    }
    
    console.log('✅ Deals successfully saved to Firestore');
    
    // Return success response with statistics
    return NextResponse.json({ 
      success: true, 
      count: allDeals.length,
      sources: {
        cheapshark: cheapSharkDeals.length,
        rss: {
          total: rssDeals.length,
          humble: rssDeals.filter(deal => deal.sourceType === 'humble').length,
          epic: rssDeals.filter(deal => deal.sourceType === 'epic').length,
        }
      },
      executionTime: `${fetchDuration.toFixed(2)} seconds`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in fetch-deals API route:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch and process deals',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST handler for the /api/fetch-deals endpoint
 * 
 * This handler is specifically designed for Vercel Cron Jobs.
 * It verifies the request is authenticated with the CRON_SECRET,
 * then processes the deal fetching and storage.
 * 
 * @param request - The incoming request from Vercel Cron
 * @returns A JSON response with the result
 */
export async function POST(request: Request) {
  console.log('🔒 Processing POST request to /api/fetch-deals (cron job)');
  
  // Verify request is from Vercel Cron with proper authentication
  const authHeader = request.headers.get('Authorization');
  
  // Check if CRON_SECRET environment variable is configured
  if (!process.env.CRON_SECRET) {
    console.error('⚠️ CRON_SECRET environment variable is not set');
    return NextResponse.json({ 
      error: 'Server configuration error',
      message: 'CRON_SECRET environment variable is not configured'
    }, { status: 500 });
  }
  
  // Validate the authorization header
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('🚫 Unauthorized POST request to /api/fetch-deals');
    return NextResponse.json({ 
      error: 'Unauthorized',
      message: 'Invalid or missing authorization token'
    }, { status: 401 });
  }
  
  console.log('✅ Cron job request authenticated successfully');
  
  // Use the same logic as GET, but with fixed limits for cron job
  try {
    // Record start time for performance tracking
    const startTime = Date.now();
    
    // Fixed limits for cron job - fetch more deals for the daily update
    const cronLimit = DEFAULT_LIMIT * 2; // Double the default for cron jobs
    const rssLimit = DEFAULT_RSS_LIMIT * 2;
    
    console.log(`📊 Cron job fetch limits: CheapShark=${cronLimit}, RSS=${rssLimit}`);
    
    // Fetch deals from both sources in parallel
    const [cheapSharkDeals, rssDeals] = await Promise.all([
      fetchCheapSharkDeals(cronLimit),
      fetchRSSFeeds(rssLimit)
    ]);
    
    // Calculate fetch duration
    const fetchDuration = (Date.now() - startTime) / 1000;
    console.log(`⏱️ Cron job fetch completed in ${fetchDuration.toFixed(2)} seconds`);
    
    // Combine all deals and sort by date (newest first)
    const allDeals = [...cheapSharkDeals, ...rssDeals]
      .sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime());
    
    // Add batch information for tracking in the database
    const batchTimestamp = new Date().toISOString();
    const dealsWithBatchInfo = allDeals.map(deal => ({
      ...deal,
      batchTimestamp,
      lastUpdated: new Date().toISOString(),
      fetchMethod: 'cron'
    }));
    
    // Save the deals to Firestore
    console.log(`💾 Cron job saving ${dealsWithBatchInfo.length} deals to Firestore...`);
    const success = await saveDealsToDb(dealsWithBatchInfo);
    
    if (!success) {
      console.error('❌ Cron job failed to save deals to Firestore');
      return NextResponse.json({ 
        error: 'Database storage error',
        message: 'Failed to save deals to database during cron job'
      }, { status: 500 });
    }
    
    console.log('✅ Cron job successfully saved all deals to Firestore');
    
    // Return success response with statistics
    return NextResponse.json({ 
      success: true, 
      cronJob: true,
      count: allDeals.length,
      sources: {
        cheapshark: cheapSharkDeals.length,
        rss: {
          total: rssDeals.length,
          humble: rssDeals.filter(deal => deal.sourceType === 'humble').length,
          epic: rssDeals.filter(deal => deal.sourceType === 'epic').length,
        }
      },
      executionTime: `${fetchDuration.toFixed(2)} seconds`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in cron job fetch-deals route:', error);
    return NextResponse.json({ 
      error: 'Cron job failed',
      message: error instanceof Error ? error.message : 'Unknown error during cron job execution',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Ensure this route is not cached
export const dynamic = 'force-dynamic'; 