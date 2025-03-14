import { NextResponse } from 'next/server';
import { saveDealsToDb, GameDealFromAPI } from '@/lib/firebase';
import { generateAffiliateUrl, getStoreName } from '@/app/api/detect-store-adapter';
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
 * API Route: /api/fetch-deals
 * 
 * This handler fetches the latest game deals from CheapShark API,
 * processes them into a structured format, and saves them to Firestore.
 * It focuses specifically on Steam deals (storeID=1) under $15.
 */

// Number of deals to fetch and display
const DEAL_LIMIT = 10;

/**
 * GET handler for the /api/fetch-deals endpoint
 * 
 * Fetches game deals from CheapShark API, processes them,
 * and saves them to Firebase Firestore database.
 * 
 * @param request - The incoming request
 * @returns A JSON response with the fetched and processed deals
 */
export async function GET(request: Request) {
  console.log('Processing GET request to /api/fetch-deals');
  
  try {
    // 1. Fetch deals from CheapShark API
    const deals = await fetchCheapSharkDeals();
    
    // 2. Process the raw deal data into our application format
    const processedDeals = deals.map(processDeal);
    
    // 3. Save the processed deals to Firestore
    console.log(`Saving ${processedDeals.length} deals to Firestore...`);
    const success = await saveDealsToDb(processedDeals);
    
    if (!success) {
      console.error('Failed to save deals to Firestore');
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
    console.error('Error in fetch-deals API route:', error);
    return NextResponse.json({ 
      error: 'API error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * Fetches deals from the CheapShark API
 * 
 * Makes a request to the CheapShark API to fetch Steam deals under $15,
 * limited to the most recent deals.
 * 
 * @returns Promise resolving to an array of raw game deals
 */
async function fetchCheapSharkDeals(): Promise<any[]> {
  // Build the API URL with the specified parameters
  const apiUrl = new URL(CHEAPSHARK_DEALS_ENDPOINT);
  
  // Add query parameters as specified in requirements
  apiUrl.searchParams.append('storeID', '1'); // Steam store
  apiUrl.searchParams.append('upperPrice', '15'); // Under $15
  apiUrl.searchParams.append('pageSize', DEAL_LIMIT.toString()); // Limit to 10 deals
  apiUrl.searchParams.append('sortBy', 'recent'); // Sort by most recent
  
  console.log(`Fetching deals from: ${apiUrl.toString()}`);
  
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
  console.log(`Received ${deals.length} deals from CheapShark API`);
  
  return deals;
}

/**
 * Processes a raw deal into our application format
 * 
 * Extracts and formats the relevant information from a raw CheapShark deal.
 * 
 * @param deal - Raw deal data from CheapShark API
 * @returns Processed deal in our application's format
 */
function processDeal(deal: any): GameDealFromAPI {
  // Generate a unique ID
  const uniqueId = deal.dealID;
  
  // Create a SEO-friendly slug from the title
  const slug = generateSlug(deal.title);
  
  // Current timestamp
  const now = new Date();
  
  // Construct affiliate link
  const affiliateUrl = `https://www.cheapshark.com/redirect?dealID=${deal.dealID}`;
  
  // Format prices with dollar sign
  const originalPrice = `$${parseFloat(deal.normalPrice).toFixed(2)}`;
  const dealPrice = deal.isOnSale === '0' ? 'Free' : `$${parseFloat(deal.salePrice).toFixed(2)}`;
  
  // Calculate savings percentage
  const savingsPercent = Math.round(parseFloat(deal.savings));
  
  // Create a descriptive message for the deal
  const description = `${deal.title} is now available on Steam for ${dealPrice}! Save ${savingsPercent}% off the original price of ${originalPrice}.`;
  
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
    storeID: '1', // Steam
    storeName: 'Steam',
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
}

/**
 * Generates a SEO-friendly slug from a title
 * 
 * Converts a game title into a URL-friendly string by:
 * 1. Converting to lowercase
 * 2. Removing special characters
 * 3. Replacing spaces with hyphens
 * 4. Removing leading/trailing hyphens
 * 5. Limiting the length
 * 
 * @param title - The game title
 * @returns A SEO-friendly slug
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')     // Remove leading/trailing hyphens
    .replace(/-{2,}/g, '-')      // Replace multiple consecutive hyphens with a single one
    .slice(0, 50);               // Limit length for readability
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
      fetchCheapSharkDeals(),
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