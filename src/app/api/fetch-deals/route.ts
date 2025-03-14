import { NextResponse } from 'next/server';
import { saveDealsToDb, GameDealFromAPI } from '@/lib/firebase';
import { generateAffiliateUrl, getStoreName } from '@/lib/affiliate';
import { fetchRSSFeeds } from '@/lib/rss';

// Default number of deals to fetch
const DEFAULT_LIMIT = 6;

// Configure CheapShark API
const CHEAPSHARK_API_URL = 'https://www.cheapshark.com/api/1.0';
const CHEAPSHARK_STORES_URL = `${CHEAPSHARK_API_URL}/stores`;

/**
 * Fetches deals from CheapShark API
 * 
 * This function fetches the latest deals from the CheapShark API,
 * filters them to include only quality deals with images,
 * and formats them to match our application's data structure.
 * 
 * @param limit - Number of deals to fetch
 * @returns Promise resolving to an array of game deals
 */
async function fetchCheapSharkDeals(limit: number): Promise<GameDealFromAPI[]> {
  console.log(`Fetching ${limit * 2} deals from CheapShark API (will filter down to ~${limit})...`);
  
  try {
    const response = await fetch(`${CHEAPSHARK_API_URL}/deals?pageSize=${limit * 2}&sortBy=recent`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) {
      throw new Error(`CheapShark API error: ${response.status}`);
    }
    
    const cheapSharkDeals = await response.json();
    console.log(`Received ${cheapSharkDeals.length} deals from CheapShark API`);
    
    const filteredDeals = cheapSharkDeals
      .filter((deal: any) => deal.thumb) // Only deals with images
      .slice(0, limit); // Limit to requested number
    
    console.log(`Filtered to ${filteredDeals.length} quality deals with images`);
    
    return filteredDeals.map((deal: any) => {
      // Generate the appropriate affiliate URL based on store and deal
      const affiliateUrl = generateAffiliateUrl(
        deal.dealID,
        deal.storeID,
        deal.gameID,
        deal.cheapestDealID
      );

      // Get store name for better display and affiliate context
      const storeName = getStoreName(deal.storeID);
      
      // Create a descriptive message about the deal
      const savingsPercent = Math.round(parseFloat(deal.savings));
      const description = `${deal.title} is now available at ${storeName}! Save ${savingsPercent}% off the original price.`;

      // Extract game ID or URL-friendly name for the slug
      // For Steam games, the gameID is the Steam AppID which works well as an identifier
      const gameIdForSlug = deal.gameID || '';
      
      // Create a slug from the title (used for routing)
      // Use a combination of title and ID to ensure uniqueness
      const titleSlug = deal.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const slug = titleSlug + (gameIdForSlug ? `-${gameIdForSlug}` : '');

      // Parse prices for consistent formatting
      const originalPrice = `$${parseFloat(deal.normalPrice).toFixed(2)}`;
      const dealPrice = deal.isOnSale === '0' ? 'Free' : `$${parseFloat(deal.salePrice).toFixed(2)}`;
      
      // Current date for timely deals
      const now = new Date();
      
      return {
        id: deal.dealID,
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
        sourceType: 'cheapshark'
      };
    });
  } catch (error) {
    console.error('Error fetching CheapShark deals:', error);
    return [];
  }
}

/**
 * GET handler for the /api/fetch-deals endpoint
 * 
 * This function fetches deals from multiple sources (CheapShark API and RSS feeds),
 * combines them, saves them to the database, and returns them to the client.
 * 
 * @param request - The incoming request
 * @returns A JSON response with the fetched deals
 */
export async function GET(request: Request) {
  console.log('Processing GET request to /api/fetch-deals');
  
  try {
    // Get the limit from query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT));
    console.log(`Requested limit: ${limit} deals`);
    
    // Fetch deals from both sources
    const fetchPromises = [
      fetchCheapSharkDeals(limit),
      fetchRSSFeeds(Math.floor(limit / 2)) // Fetch half as many RSS deals
    ];
    
    console.log('Fetching deals from multiple sources in parallel...');
    const [cheapSharkDeals, rssDeals] = await Promise.all(fetchPromises);
    
    console.log(`Fetched ${cheapSharkDeals.length} CheapShark deals and ${rssDeals.length} RSS deals`);
    
    // Combine and sort all deals by date
    const allDeals = [...cheapSharkDeals, ...rssDeals]
      .sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime())
      .slice(0, limit);
    
    console.log(`Combined and limited to ${allDeals.length} total deals`);
    
    // Save the deals to the database
    console.log('Saving deals to database...');
    const success = await saveDealsToDb(allDeals);
    
    if (!success) {
      console.error('Failed to save deals to database');
      return NextResponse.json({ error: 'Failed to save deals to database' }, { status: 500 });
    }
    
    console.log('Deals successfully saved to database');
    
    // Group deals by source for the response
    const dealsBySource = {
      api: allDeals.filter(deal => deal.source === 'api'),
      rss: allDeals.filter(deal => deal.source === 'rss')
    };
    
    // Group RSS deals by type
    const rssDealsByType = {
      humble: rssDeals.filter(deal => deal.sourceType === 'humble').length,
      epic: rssDeals.filter(deal => deal.sourceType === 'epic').length,
      // Add more sources as they're implemented
    };
    
    return NextResponse.json({ 
      success: true, 
      count: allDeals.length,
      deals: allDeals,
      sources: {
        api: cheapSharkDeals.length,
        rss: {
          total: rssDeals.length,
          ...rssDealsByType
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in fetch-deals API route:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch deals',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST handler for the /api/fetch-deals endpoint
 * 
 * This function is used by Vercel Cron Jobs to automatically fetch deals.
 * It requires authorization via the CRON_SECRET environment variable.
 * 
 * @param request - The incoming request
 * @returns A JSON response from the GET handler
 */
export async function POST(request: Request) {
  console.log('Processing POST request to /api/fetch-deals (cron job)');
  
  // Verify request is from Vercel Cron
  const authHeader = request.headers.get('Authorization');
  
  if (!process.env.CRON_SECRET) {
    console.error('CRON_SECRET environment variable is not set');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('Unauthorized POST request to /api/fetch-deals');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  console.log('Request authorized, reusing GET handler');
  
  // Reuse the GET handler logic
  return GET(request);
}

// Configure the route handler to be dynamic (not cached)
export const dynamic = 'force-dynamic'; 