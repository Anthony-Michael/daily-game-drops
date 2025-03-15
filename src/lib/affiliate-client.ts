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
  getAffiliateLinkAttributes,
  addTrackingParameters,
  getAffiliateDisclosure
};

export default defaultExport; 