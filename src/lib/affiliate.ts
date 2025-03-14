/**
 * Affiliate URL Management System
 * 
 * This module handles the generation and management of affiliate URLs for various game stores.
 * It provides a centralized way to manage affiliate links and ensures consistent formatting
 * across the application.
 */

// Store-specific affiliate URL patterns and configurations
interface StoreConfig {
  name: string;
  affiliateUrlPattern: string;
  requiresDealId: boolean;
  requiresStoreId: boolean;
  isDirectLink: boolean;
}

// Store configurations for different retailers
const STORE_CONFIGS: Record<string, StoreConfig> = {
  '1': { // Steam
    name: 'Steam',
    affiliateUrlPattern: 'https://store.steampowered.com/app/{gameId}',
    requiresDealId: false,
    requiresStoreId: false,
    isDirectLink: true
  },
  '2': { // GOG
    name: 'GOG',
    affiliateUrlPattern: 'https://www.gog.com/game/{gameId}',
    requiresDealId: false,
    requiresStoreId: false,
    isDirectLink: true
  },
  '3': { // GreenManGaming
    name: 'GreenManGaming',
    affiliateUrlPattern: 'https://www.greenmangaming.com/games/{gameId}',
    requiresDealId: true,
    requiresStoreId: true,
    isDirectLink: false
  },
  '4': { // Humble Store
    name: 'Humble Store',
    affiliateUrlPattern: 'https://www.humblebundle.com/store/{gameId}',
    requiresDealId: false,
    requiresStoreId: false,
    isDirectLink: true
  },
  '5': { // Fanatical
    name: 'Fanatical',
    affiliateUrlPattern: 'https://www.fanatical.com/en/game/{gameId}',
    requiresDealId: true,
    requiresStoreId: true,
    isDirectLink: false
  },
  // Add more stores as needed
};

/**
 * Generates an affiliate URL for a game deal
 * @param dealId - The unique identifier for the deal
 * @param storeId - The store's unique identifier
 * @param gameId - The game's unique identifier
 * @param storeUrl - The original store URL (fallback)
 * @returns The properly formatted affiliate URL
 */
export function generateAffiliateUrl(
  dealId: string,
  storeId: string,
  gameId?: string,
  storeUrl?: string
): string {
  const storeConfig = STORE_CONFIGS[storeId];
  
  // If no store config exists or we don't have required data, use CheapShark redirect
  if (!storeConfig || (storeConfig.requiresDealId && !dealId) || 
      (storeConfig.requiresStoreId && !storeId)) {
    return `https://www.cheapshark.com/redirect?dealID=${dealId}`;
  }

  // For direct links (like Steam), use the store's URL pattern
  if (storeConfig.isDirectLink && gameId) {
    return storeConfig.affiliateUrlPattern.replace('{gameId}', gameId);
  }

  // For stores requiring deal ID, use CheapShark redirect
  return `https://www.cheapshark.com/redirect?dealID=${dealId}`;
}

/**
 * Determines if a store supports direct affiliate links
 * @param storeId - The store's unique identifier
 * @returns boolean indicating if the store supports direct links
 */
export function supportsDirectAffiliateLinks(storeId: string): boolean {
  return STORE_CONFIGS[storeId]?.isDirectLink || false;
}

/**
 * Gets the store name from its ID
 * @param storeId - The store's unique identifier
 * @returns The store's display name or 'Unknown Store'
 */
export function getStoreName(storeId: string): string {
  return STORE_CONFIGS[storeId]?.name || 'Unknown Store';
}

/**
 * Generates HTML attributes for affiliate links
 * @returns Object containing HTML attributes for affiliate links
 */
export function getAffiliateLinkAttributes(): Record<string, string> {
  return {
    target: '_blank',
    rel: 'noopener noreferrer',
    'aria-label': 'Opens in a new tab',
    'data-affiliate': 'true'
  };
} 