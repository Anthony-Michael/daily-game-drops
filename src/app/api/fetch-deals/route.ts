import { NextResponse } from 'next/server';
import { saveDealsToDb, GameDealFromAPI } from '@/lib/firebase';
import { generateAffiliateUrl, getStoreName } from '@/lib/affiliate';
import { fetchRSSFeeds } from '@/lib/rss';

// Default number of deals to fetch
const DEFAULT_LIMIT = 6;

// Environment variables for API configuration
const CHEAPSHARK_API_URL = 'https://www.cheapshark.com/api/1.0';

/**
 * Fetches deals from CheapShark API
 */
async function fetchCheapSharkDeals(limit: number): Promise<GameDealFromAPI[]> {
  const response = await fetch(`${CHEAPSHARK_API_URL}/deals?pageSize=${limit * 2}&sortBy=recent`);
  
  if (!response.ok) {
    throw new Error(`CheapShark API error: ${response.status}`);
  }
  
  const cheapSharkDeals = await response.json();
  
  return cheapSharkDeals
    .filter((deal: any) => deal.thumb) // Only deals with images
    .slice(0, limit) // Limit to requested number
    .map((deal: any) => {
      // Generate the appropriate affiliate URL based on store and deal
      const affiliateUrl = generateAffiliateUrl(
        deal.dealID,
        deal.storeID,
        deal.gameID,
        deal.cheapestDealID
      );

      // Create a descriptive message about the deal
      const storeName = getStoreName(deal.storeID);
      const savingsPercent = Math.round(parseFloat(deal.savings));
      const description = `${deal.title} is now available at ${storeName}! Save ${savingsPercent}% off the original price.`;

      return {
        title: deal.title,
        dealID: deal.dealID,
        imageUrl: deal.thumb,
        description,
        originalPrice: `$${parseFloat(deal.normalPrice).toFixed(2)}`,
        dealPrice: deal.isOnSale === '0' ? 'Free' : `$${parseFloat(deal.salePrice).toFixed(2)}`,
        affiliateUrl,
        storeID: deal.storeID,
        storeName,
        savings: deal.savings,
        metacriticScore: deal.metacriticScore,
        steamRatingPercent: deal.steamRatingPercent,
        steamRatingCount: deal.steamRatingCount,
        // Create a slug from the title
        slug: deal.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        // Identify platform (mostly PC for CheapShark, but add detection logic if needed)
        platform: 'PC',
        // Add datePosted for compatibility with existing code
        datePosted: new Date().toISOString(),
        // Mark source as API
        source: 'api',
        sourceType: 'cheapshark'
      };
    });
}

export async function GET(request: Request) {
  try {
    // Get the limit from query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT));
    
    // Fetch deals from both sources
    const [cheapSharkDeals, rssDeals] = await Promise.all([
      fetchCheapSharkDeals(limit),
      fetchRSSFeeds()
    ]);
    
    // Combine and sort all deals by date
    const allDeals = [...cheapSharkDeals, ...rssDeals]
      .sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime())
      .slice(0, limit);
    
    // Save the deals to the database
    const success = await saveDealsToDb(allDeals);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to save deals to database' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      count: allDeals.length,
      deals: allDeals,
      sources: {
        api: cheapSharkDeals.length,
        rss: rssDeals.length
      }
    });
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 });
  }
}

// Authorize only POST requests from Vercel cron jobs
export async function POST(request: Request) {
  // Verify request is from Vercel Cron
  const authHeader = request.headers.get('Authorization');
  
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Reuse the GET handler logic
  return GET(request);
}

// Configure the route handler
export const dynamic = 'force-dynamic'; 