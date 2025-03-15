/**
 * Unified implementation of the detectStore function
 * This works across both client-side and server-side contexts
 */

export interface StoreConfig {
  name: string;
  affiliateUrlPattern: string;
  requiresDealId: boolean;
  requiresStoreId?: boolean;
  isDirectLink: boolean;
  affiliateParam?: string;
  affiliateCode?: string;
}

const defaultStoreConfig: StoreConfig = {
  name: 'Unknown Store',
  affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
  requiresDealId: true,
  isDirectLink: false
};

const storeConfigs: Record<string, StoreConfig> = {
  '1': { 
    name: 'Steam',
    affiliateUrlPattern: 'https://store.steampowered.com/app/{gameId}',
    requiresDealId: false,
    isDirectLink: true
  },
  // Add more store configs as needed
};

export function detectStore(storeId: string): StoreConfig {
  if (typeof window === 'undefined') {
    // Server-side context
    return storeConfigs[storeId] || defaultStoreConfig;
  } else {
    // Client-side context
    return storeConfigs[storeId] || defaultStoreConfig;
  }
}

export default detectStore; 