// This is a client-side version of affiliate utilities to ensure proper imports in client components

/**
 * Client-side version of the store detection logic
 * This helps prevent issues with module resolution in client components
 */

interface StoreConfig {
  name: string;
  affiliateUrlPattern: string;
  requiresDealId: boolean;
  requiresStoreId?: boolean;
  isDirectLink: boolean;
  affiliateParam?: string;
  affiliateCode?: string;
}

/**
 * Client-side store detection function to avoid "undefined" errors
 * This provides a safe fallback when the main detectStore function can't be properly imported
 */
export function detectStore(storeId: string): StoreConfig {
  // Default configuration for when store ID isn't found
  const defaultConfig: StoreConfig = {
    name: 'Unknown Store',
    affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
    requiresDealId: true,
    isDirectLink: false
  };
  
  // Simple client-side store configs for the most common stores
  const clientStoreConfigs: Record<string, StoreConfig> = {
    '1': { 
      name: 'Steam',
      affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
      requiresDealId: true,
      isDirectLink: false
    },
    '4': { 
      name: 'Humble Store',
      affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
      requiresDealId: true,
      isDirectLink: false
    },
    '9': { 
      name: 'Epic Games Store',
      affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
      requiresDealId: true,
      isDirectLink: false
    }
  };
  
  return clientStoreConfigs[storeId] || defaultConfig;
}

/**
 * Get affiliate link attributes for HTML elements
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
 * Add tracking parameters to URLs
 */
export function addTrackingParameters(url: string, source: string = 'homepage'): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}utm_source=dailygamedrops&utm_medium=affiliate&utm_campaign=${source}`;
}

/**
 * Get the proper disclosure text for affiliate links
 */
export function getAffiliateDisclosure(storeName: string = ''): string {
  const storeText = storeName ? ` to ${storeName}` : '';
  return `This is an affiliate link${storeText}. We may earn a commission on purchases made through this link.`;
}

// Default export to ensure compatibility with different import patterns
const defaultExport = {
  detectStore,
  getAffiliateLinkAttributes,
  addTrackingParameters,
  getAffiliateDisclosure
};

export default defaultExport; 