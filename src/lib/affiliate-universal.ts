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

// Expanded store configurations
const storeConfigs: Record<string, StoreConfig> = {
  '1': { 
    name: 'Steam',
    affiliateUrlPattern: 'https://store.steampowered.com/app/{gameId}',
    requiresDealId: false,
    isDirectLink: true
  },
  '2': {
    name: 'GamersGate',
    affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
    requiresDealId: true,
    isDirectLink: false
  },
  '3': {
    name: 'GreenManGaming',
    affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
    requiresDealId: true,
    isDirectLink: false
  },
  '4': {
    name: 'Amazon',
    affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
    requiresDealId: true,
    isDirectLink: false
  },
  '5': {
    name: 'GameStop',
    affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
    requiresDealId: true,
    isDirectLink: false
  },
  '6': {
    name: 'Direct2Drive',
    affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
    requiresDealId: true,
    isDirectLink: false
  },
  '7': {
    name: 'GOG',
    affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
    requiresDealId: true,
    isDirectLink: false
  },
  '8': {
    name: 'Origin',
    affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
    requiresDealId: true,
    isDirectLink: false
  },
  '9': {
    name: 'Humble Store',
    affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
    requiresDealId: true,
    isDirectLink: false
  },
  '10': {
    name: 'Uplay',
    affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
    requiresDealId: true,
    isDirectLink: false
  },
  '11': {
    name: 'Fanatical',
    affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
    requiresDealId: true,
    isDirectLink: false
  },
  '12': {
    name: 'Epic Games Store',
    affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
    requiresDealId: true,
    isDirectLink: false
  },
  '13': {
    name: 'WinGameStore',
    affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
    requiresDealId: true,
    isDirectLink: false
  }
};

/**
 * Detects the store configuration based on the store ID
 * Works in both server-side and client-side contexts
 * 
 * @param storeId - The ID of the store to detect
 * @returns The store configuration object
 */
export function detectStore(storeId: string | undefined | null): StoreConfig {
  try {
    // Basic input validation
    if (!storeId) {
      console.log('detectStore called with empty storeId, using default config');
      return defaultStoreConfig;
    }
    
    // Normalize the store ID
    const normalizedId = String(storeId).trim();
    
    // Retrieve the store config or use the default
    const config = storeConfigs[normalizedId];
    
    if (!config) {
      console.log(`No configuration found for storeId: ${normalizedId}, using default config`);
      return defaultStoreConfig;
    }
    
    return config;
  } catch (error) {
    // Log the error but don't break the application
    console.error('Error in detectStore:', error);
    return defaultStoreConfig;
  }
}

// Both named and default exports for maximum compatibility
export default detectStore; 