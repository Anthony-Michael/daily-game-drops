import { NextResponse } from 'next/server';
import { saveDealsToDb, GameDealFromAPI } from '@/lib/firebase';
import { generateAffiliateUrl, getStoreName } from '@/lib/affiliate';
import { fetchRSSFeeds } from '@/lib/rss';
import { detectStore } from '@/lib/affiliate-universal';

/**
 * AUTOMATED GAME DEALS FETCHER API ROUTE
 * 
 * This API route is responsible for fetching game deals from various sources
 * and storing them in Firebase Firestore. It is designed to be triggered:
 * 
 * 1. Manually by accessing GET /api/fetch-deals (for testing)
 * 2. Automatically by a scheduled cron job via POST /api/fetch-deals
 * 
 * SETTING UP THE CRON JOB:
 * To set up automated daily fetching, add a cron job in Vercel:
 * 
 * 1. Go to your Vercel project dashboard
 * 2. Navigate to Settings > Cron Jobs
 * 3. Add a new cron job with:
 *    - Name: "Daily Game Deals Fetch"
 *    - Schedule: "0 0 * * *" (runs at midnight UTC daily)
 *    - HTTP Method: POST
 *    - Path: /api/fetch-deals
 *    - Headers: Add "Authorization: Bearer YOUR_CRON_SECRET"
 * 
 * 4. Set CRON_SECRET in your environment variables
 */

// =================== CONFIGURATION CONSTANTS ====================

// Default number of deals to fetch per source
const DEFAULT_LIMIT = 10;
const DEFAULT_RSS_LIMIT = 5;

// CheapShark API settings
const CHEAPSHARK_API_URL = 'https://www.cheapshark.com/api/1.0';
const CHEAPSHARK_DEALS_ENDPOINT = `${CHEAPSHARK_API_URL}/deals`;
const CHEAPSHARK_STORES_ENDPOINT = `${CHEAPSHARK_API_URL}/stores`;

// Deal filtering criteria
const MIN_SAVINGS_PERCENT = 20;    // Minimum savings to be considered a good deal
const MAX_PRICE_FILTER = 15;       // Maximum price to include in deals ($15)
const DEAL_LIMIT = 10;             // Default number of deals to fetch per request

// =================== PUBLIC API HANDLERS ====================

/**
 * GET handler - Manual trigger for fetching and storing deals
 * 
 * This endpoint allows manual testing of the deal fetching process.
 * It's not meant to be called regularly in production.
 */
export async function GET(request: Request) {
  console.log('📊 Processing GET request to /api/fetch-deals (manual)');
  
  try {
    // 1. Fetch deals from CheapShark API
    const deals = await fetchCheapSharkDeals();
    
    // 2. Process the raw deal data into our application format
    const processedDeals = deals.map(processDeal);
    
    // 3. Save the processed deals to Firestore
    console.log(`💾 Saving ${processedDeals.length} deals to Firestore...`);
    const success = await saveDealsToDb(processedDeals);
    
    if (!success) {
      console.error('❌ Failed to save deals to Firestore');
      return NextResponse.json({ 
        error: 'Database error', 
        message: 'Failed to save deals to database' 
      }, { status: 500 });
    }
    
    // 4. Return success response with the processed deals
    return NextResponse.json({ 
      success: true, 
      count: processedDeals.length,
      deals: processedDeals,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in fetch-deals API route:', error);
    return NextResponse.json({ 
      error: 'API error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * POST handler - Automated cron job trigger for fetching and storing deals
 * 
 * This endpoint is designed to be triggered by a Vercel cron job.
 * It verifies the request is authenticated with CRON_SECRET,
 * then fetches and stores deals from multiple sources.
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
    
    // Fetch deals from multiple sources in parallel
    const [cheapSharkDeals, rssDeals] = await Promise.all([
      fetchCheapSharkDeals(20, 25), // Fetch more deals with higher savings threshold for cron job
      fetchRSSFeeds(rssLimit)
    ]);
    
    // Calculate fetch duration
    const fetchDuration = (Date.now() - startTime) / 1000;
    console.log(`⏱️ Cron job fetch completed in ${fetchDuration.toFixed(2)} seconds`);
    
    // Process the CheapShark deals
    const processedCheapSharkDeals = cheapSharkDeals.map(processDeal);
    
    // Combine all deals and sort by date (newest first)
    const allDeals = [...processedCheapSharkDeals, ...rssDeals]
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
        cheapshark: processedCheapSharkDeals.length,
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

// =================== HELPER FUNCTIONS ====================

/**
 * Fetches deals from the CheapShark API
 * 
 * @param limit - Number of deals to fetch (default: DEAL_LIMIT)
 * @param minSavings - Minimum savings percentage to include (default: MIN_SAVINGS_PERCENT) 
 * @returns Promise resolving to an array of raw game deals
 */
async function fetchCheapSharkDeals(limit = DEAL_LIMIT, minSavings = MIN_SAVINGS_PERCENT): Promise<any[]> {
  // Build the API URL with the specified parameters
  const apiUrl = new URL(CHEAPSHARK_DEALS_ENDPOINT);
  
  // Add query parameters for filtering deals
  apiUrl.searchParams.append('storeID', '1'); // Steam store
  apiUrl.searchParams.append('upperPrice', MAX_PRICE_FILTER.toString()); // Under $15
  apiUrl.searchParams.append('pageSize', limit.toString()); // Limit number of deals
  apiUrl.searchParams.append('sortBy', 'recent'); // Sort by most recent
  apiUrl.searchParams.append('onSale', 'true'); // Only include deals on sale
  apiUrl.searchParams.append('steamAppID', '1'); // Has Steam App ID
  
  // Only include deals with significant savings
  if (minSavings > 0) {
    apiUrl.searchParams.append('lowerPrice', '0.01'); // Exclude free games for savings filter
    apiUrl.searchParams.append('steamRating', '50'); // Only games with decent ratings
    apiUrl.searchParams.append('metacritic', '70'); // Only games with decent Metacritic scores
  }
  
  console.log(`🔍 Fetching deals from: ${apiUrl.toString()}`);
  
  // Make the API request
  const response = await fetch(apiUrl.toString(), {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    next: { revalidate: 3600 } // Cache for 1 hour
  });
  
  // Check if the request was successful
  if (!response.ok) {
    throw new Error(`CheapShark API error: ${response.status} ${response.statusText}`);
  }
  
  // Parse the response as JSON
  const deals = await response.json();
  console.log(`📦 Received ${deals.length} deals from CheapShark API`);
  
  // Apply additional filtering if needed
  let filteredDeals = deals;
  if (minSavings > 0) {
    filteredDeals = deals.filter(deal => parseFloat(deal.savings) >= minSavings);
    console.log(`⚡ Filtered down to ${filteredDeals.length} deals with savings ≥ ${minSavings}%`);
  }
  
  return filteredDeals;
}

/**
 * Processes a raw deal into our application format
 * 
 * @param deal - Raw deal data from CheapShark API
 * @returns Processed deal in our application's format
 */
function processDeal(deal: Record<string, any>): GameDealFromAPI {
  try {
    // Generate a unique ID
    const uniqueId = deal.dealID;
    
    // Create a SEO-friendly slug from the title
    const slug = generateSlug(deal.title);
    
    // Current timestamp
    const now = new Date();
    
    // Construct affiliate link - attempt to use detectStore safely
    let affiliateUrl = `https://www.cheapshark.com/redirect?dealID=${deal.dealID}`;
    try {
      const storeConfig = detectStore(deal.storeID || '1');
      if (storeConfig && storeConfig.affiliateUrlPattern) {
        // Use store-specific affiliate URL pattern if available
        affiliateUrl = generateAffiliateUrl(
          deal.dealID,
          deal.storeID || '1', 
          deal.steamAppID || '',
          undefined
        );
      }
    } catch (error) {
      console.warn(`⚠️ Error generating affiliate URL: ${error}. Using default URL.`);
    }
    
    // Format prices with dollar sign
    const originalPrice = `$${parseFloat(deal.normalPrice).toFixed(2)}`;
    const dealPrice = parseFloat(deal.salePrice) === 0 ? 'Free' : `$${parseFloat(deal.salePrice).toFixed(2)}`;
    
    // Calculate savings percentage
    const savingsPercent = Math.round(parseFloat(deal.savings));
    
    // Get store name safely
    let storeName = 'Unknown Store';
    try {
      storeName = getStoreName(deal.storeID) || 'Unknown Store';
    } catch (error) {
      console.warn(`⚠️ Error getting store name: ${error}`);
    }
    
    // Create a descriptive message for the deal
    const description = `${deal.title} is now available on ${storeName} for ${dealPrice}! Save ${savingsPercent}% off the original price of ${originalPrice}.`;
    
    // Return the processed deal
    return {
      id: uniqueId,
      title: deal.title,
      dealID: deal.dealID,
      slug: slug,
      imageUrl: deal.thumb,
      description: description,
      originalPrice: originalPrice,
      dealPrice: dealPrice,
      affiliateUrl: affiliateUrl,
      storeID: deal.storeID || '1', // Default to Steam
      storeName: storeName,
      savings: deal.savings,
      metacriticScore: deal.metacriticScore,
      steamRatingPercent: deal.steamRatingPercent,
      steamRatingCount: deal.steamRatingCount,
      platform: 'PC',
      datePosted: now.toISOString(),
      dateAdded: now.toISOString(),
      source: 'api',
      sourceType: 'cheapshark'
    };
  } catch (error) {
    console.error(`❌ Error processing deal: ${error}`, { deal });
    throw new Error(`Failed to process deal: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generates a SEO-friendly slug from a title
 * 
 * @param title - The game title
 * @returns A SEO-friendly slug
 */
function generateSlug(title: string): string {
  if (!title) return `game-${Date.now()}`;
  
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')     // Remove leading/trailing hyphens
    .replace(/-{2,}/g, '-')      // Replace multiple consecutive hyphens with a single one
    .slice(0, 50);               // Limit length for readability
}

// Ensure this route is not cached
export const dynamic = 'force-dynamic'; 