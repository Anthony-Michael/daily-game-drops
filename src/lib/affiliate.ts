/**
 * Affiliate URL Management System
 * 
 * This module handles the generation and management of affiliate URLs for various game stores.
 * It provides a centralized way to manage affiliate links and ensures consistent formatting
 * across the application.
 * 
 * AFFILIATE LINK GENERATION PROCESS:
 * 1. Each game store has a unique configuration (StoreConfig) that defines how its URLs are formatted
 * 2. When a deal is retrieved from CheapShark, we use the store ID to find the appropriate configuration
 * 3. Based on the store's configuration, we either:
 *    a. Generate a direct store link with affiliate parameters (for stores that support direct linking)
 *    b. Use CheapShark's redirect service (which handles the affiliate tracking)
 *    c. Use a custom affiliate link format for specific programs
 * 4. Additional metadata is attached to these links (rel attributes, target, etc.) for proper tracking and UX
 */

// Store-specific affiliate URL patterns and configurations
export interface StoreConfig {
  name: string;
  affiliateUrlPattern: string;
  requiresDealId: boolean;
  requiresStoreId?: boolean;
  isDirectLink: boolean;
  affiliateParam?: string; // Optional parameter name for affiliate code
  affiliateCode?: string;  // Optional default affiliate code
}

// Store configurations for different retailers
// CheapShark store IDs: https://www.cheapshark.com/api/1.0/stores
const STORE_CONFIGS: Record<string, StoreConfig> = {
  '1': { // Steam
    name: 'Steam',
    affiliateUrlPattern: 'https://store.steampowered.com/app/{gameId}?curator_clanid={affiliateCode}',
    requiresDealId: false,
    requiresStoreId: false,
    isDirectLink: true,
    affiliateParam: 'curator_clanid',
    affiliateCode: '38030065' // Replace with your actual Steam curator ID
  },
  '2': { // GOG
    name: 'GOG',
    affiliateUrlPattern: 'https://www.gog.com/en/game/{gameId}?pp={affiliateCode}',
    requiresDealId: false,
    requiresStoreId: false,
    isDirectLink: true,
    affiliateParam: 'pp',
    affiliateCode: 'a_aid_123' // Replace with your actual GOG affiliate code
  },
  '3': { // GreenManGaming
    name: 'GreenManGaming',
    affiliateUrlPattern: 'https://www.greenmangaming.com/games/{gameId}?tap_a={affiliateCode}',
    requiresDealId: true,
    requiresStoreId: true,
    isDirectLink: false,
    affiliateParam: 'tap_a',
    affiliateCode: 'affiliate_123' // Replace with your actual GMG affiliate code
  },
  '4': { // Humble Store
    name: 'Humble Store',
    affiliateUrlPattern: 'https://www.humblebundle.com/store/{gameId}?partner={affiliateCode}',
    requiresDealId: false,
    requiresStoreId: false,
    isDirectLink: true,
    affiliateParam: 'partner',
    affiliateCode: 'dailygamedrops' // Replace with your actual Humble partner ID
  },
  '5': { // Fanatical
    name: 'Fanatical',
    affiliateUrlPattern: 'https://www.fanatical.com/en/game/{gameId}?aff={affiliateCode}',
    requiresDealId: true,
    requiresStoreId: true,
    isDirectLink: false,
    affiliateParam: 'aff',
    affiliateCode: 'dailygamedrops' // Replace with your actual Fanatical affiliate code
  },
  '6': { // GamersGate
    name: 'GamersGate',
    affiliateUrlPattern: 'https://www.gamersgate.com/product/{gameId}/?aff={affiliateCode}',
    requiresDealId: true,
    requiresStoreId: false,
    isDirectLink: false,
    affiliateParam: 'aff',
    affiliateCode: 'dailygamedrops' // Replace with your actual GamersGate affiliate code
  },
  '7': { // GreenManGaming (duplicated in CheapShark)
    name: 'GreenManGaming',
    affiliateUrlPattern: 'https://www.greenmangaming.com/games/{gameId}?tap_a={affiliateCode}',
    requiresDealId: true,
    requiresStoreId: true,
    isDirectLink: false,
    affiliateParam: 'tap_a',
    affiliateCode: 'affiliate_123' // Replace with your actual GMG affiliate code
  },
  '8': { // GameBillet
    name: 'GameBillet',
    affiliateUrlPattern: 'https://www.gamebillet.com/{gameId}?affiliate={affiliateCode}',
    requiresDealId: true,
    requiresStoreId: false,
    isDirectLink: false,
    affiliateParam: 'affiliate',
    affiliateCode: 'dailygamedrops' // Replace with your actual GameBillet affiliate code
  },
  '9': { // Epic Games Store
    name: 'Epic Games Store',
    affiliateUrlPattern: 'https://store.epicgames.com/en-US/p/{gameId}?epic_affiliate={affiliateCode}',
    requiresDealId: false,
    requiresStoreId: false,
    isDirectLink: true,
    affiliateParam: 'epic_affiliate',
    affiliateCode: 'dailygamedrops_id' // Replace with your actual Epic affiliate ID
  },
  '10': { // WinGameStore
    name: 'WinGameStore',
    affiliateUrlPattern: 'https://www.wingamestore.com/product/{gameId}/?afid={affiliateCode}',
    requiresDealId: true,
    requiresStoreId: false,
    isDirectLink: false,
    affiliateParam: 'afid',
    affiliateCode: 'dailygamedrops' // Replace with your actual WinGameStore affiliate code
  },
  '11': { // GamesPlanet
    name: 'GamesPlanet',
    affiliateUrlPattern: 'https://us.gamesplanet.com/game/{gameId}?ref={affiliateCode}',
    requiresDealId: true,
    requiresStoreId: false,
    isDirectLink: false,
    affiliateParam: 'ref',
    affiliateCode: 'dailygamedrops' // Replace with your actual GamesPlanet affiliate code
  },
  // Add more stores as needed
};

/**
 * Detects the store configuration for a given store ID
 * 
 * This is a key function that finds the appropriate store config based on the store ID.
 * It's used throughout the application to handle different store-specific affiliate formats.
 * 
 * @param storeId - The store's unique identifier
 * @returns The store's configuration or a default/fallback configuration
 */
export function detectStore(storeId: string): StoreConfig {
  try {
    // Return the matching store config or a default config
    return STORE_CONFIGS[storeId] || {
      name: 'Unknown Store',
      affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
      requiresDealId: true,
      isDirectLink: false
    };
  } catch (error) {
    // Fallback in case of any error
    console.warn(`Error detecting store ${storeId}:`, error);
    return {
      name: 'Game Store',
      affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
      requiresDealId: true,
      isDirectLink: false
    };
  }
}

/**
 * Generates an affiliate URL for a game deal
 * 
 * This function takes details about a game deal and constructs an appropriate affiliate URL.
 * The URL generation logic follows these steps:
 * 
 * 1. Find the store configuration for the given store ID
 * 2. If the store config doesn't exist or we're missing required data, use CheapShark's redirect
 * 3. For direct links (supported stores), use the store's URL pattern with affiliate parameters
 * 4. For non-direct links, use CheapShark's redirect service
 * 
 * @param dealId - The unique identifier for the deal
 * @param storeId - The store's unique identifier
 * @param gameId - The game's unique identifier (or slug)
 * @param storeUrl - The original store URL (fallback)
 * @returns The properly formatted affiliate URL
 */
export function generateAffiliateUrl(
  dealId: string,
  storeId: string,
  gameId?: string,
  storeUrl?: string
): string {
  try {
    const storeConfig = detectStore(storeId);
    
    // If no store config exists or we don't have required data, use CheapShark redirect
    if (!storeConfig || (storeConfig.requiresDealId && !dealId) || 
        (storeConfig.requiresStoreId && !storeId)) {
      return `https://www.cheapshark.com/redirect?dealID=${dealId}`;
    }

    // For direct links (like Steam), use the store's URL pattern with affiliate parameters
    if (storeConfig.isDirectLink && gameId) {
      let url = storeConfig.affiliateUrlPattern.replace('{gameId}', gameId);
      
      // Add affiliate code if the store supports it
      if (storeConfig.affiliateParam && storeConfig.affiliateCode) {
        url = url.replace(`{${storeConfig.affiliateParam}}`, storeConfig.affiliateParam)
                .replace('{affiliateCode}', storeConfig.affiliateCode);
      }
      
      return url;
    }

    // For stores requiring deal ID, use CheapShark redirect (which handles affiliate tracking)
    return `https://www.cheapshark.com/redirect?dealID=${dealId}`;
  } catch (error) {
    // Fallback to CheapShark redirect in case of any error
    console.warn(`Error generating affiliate URL:`, error);
    return dealId ? `https://www.cheapshark.com/redirect?dealID=${dealId}` : '#';
  }
}

/**
 * Determines if a store supports direct affiliate links
 * 
 * Some stores allow direct linking with affiliate parameters, while others
 * require going through an affiliate network or redirect service.
 * 
 * @param storeId - The store's unique identifier
 * @returns boolean indicating if the store supports direct links
 */
export function supportsDirectAffiliateLinks(storeId: string): boolean {
  try {
    return detectStore(storeId)?.isDirectLink || false;
  } catch (error) {
    console.warn(`Error checking direct links support:`, error);
    return false;
  }
}

/**
 * Gets the store name from its ID
 * 
 * @param storeId - The store's unique identifier
 * @returns The store's display name or 'Unknown Store'
 */
export function getStoreName(storeId: string): string {
  try {
    return detectStore(storeId)?.name || 'Unknown Store';
  } catch (error) {
    console.warn(`Error getting store name:`, error);
    return 'Game Store';
  }
}

/**
 * Generates HTML attributes for affiliate links
 * 
 * These attributes ensure:
 * 1. Links open in a new tab (target="_blank")
 * 2. Security is maintained by preventing the new page from navigating this page (rel="noopener")
 * 3. Search engines understand the relationship (rel="noreferrer")
 * 4. Links are accessible (aria-label)
 * 5. Links are marked as affiliate links for transparency (data-affiliate)
 * 
 * @returns Object containing HTML attributes for affiliate links
 */
export function getAffiliateLinkAttributes(): Record<string, string> {
  return {
    target: '_blank',
    rel: 'noopener noreferrer',
    'aria-label': 'Opens in a new tab (affiliate link)',
    'data-affiliate': 'true'
  };
}

/**
 * Format an affiliate URL with proper UTM parameters for analytics tracking
 * 
 * This adds additional tracking parameters to help identify which part of your
 * site generated the affiliate click.
 * 
 * @param url - The base affiliate URL
 * @param source - The source of the click (e.g., 'homepage', 'deal_page')
 * @returns The URL with UTM parameters added
 */
export function addTrackingParameters(url: string, source: string = 'homepage'): string {
  try {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}utm_source=dailygamedrops&utm_medium=affiliate&utm_campaign=${source}`;
  } catch (error) {
    console.warn(`Error adding tracking parameters:`, error);
    return url;
  }
}

/**
 * Creates a properly formatted affiliate disclosure for a specific store
 * 
 * This helps meet FTC requirements for disclosing affiliate relationships.
 * 
 * @param storeName - The name of the store
 * @returns A disclosure statement for the specified store
 */
export function getAffiliateDisclosure(storeName: string = ''): string {
  try {
    const storeText = storeName ? ` to ${storeName}` : '';
    return `This is an affiliate link${storeText}. We may earn a commission on purchases made through this link.`;
  } catch (error) {
    console.warn(`Error generating affiliate disclosure:`, error);
    return `This is an affiliate link. We may earn a commission on purchases made through this link.`;
  }
}

// Default export for compatibility with different import patterns
export default {
  detectStore,
  generateAffiliateUrl,
  supportsDirectAffiliateLinks,
  getStoreName,
  getAffiliateLinkAttributes,
  addTrackingParameters,
  getAffiliateDisclosure
}; 