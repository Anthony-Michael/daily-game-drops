/**
 * Server-side adapter for detectStore function
 * This is used specifically to prevent SSR errors
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

/**
 * Server-safe implementation of detectStore
 * This ensures that server components don't crash when trying to access
 * browser-specific functionality
 */
export function detectStore(storeId: string): StoreConfig {
  // Simple mapping for common stores
  const storeMap: Record<string, string> = {
    '1': 'Steam',
    '2': 'GamersGate',
    '3': 'GreenManGaming',
    '4': 'Amazon',
    '5': 'GameStop',
    '6': 'Direct2Drive',
    '7': 'GoG',
    '8': 'Origin',
    '9': 'Get Games',
    '10': 'Shiny Loot',
    '11': 'Humble Store',
    '12': 'Desura',
    '13': 'Uplay',
    '14': 'IndieGameStand',
    '15': 'Fanatical',
    '16': 'Gamesrocket',
    '17': 'Games Republic',
    '18': 'SilaGames',
    '19': 'Playfield',
    '20': 'ImperialGames',
    '21': 'WinGameStore',
    '22': 'FunStockDigital',
    '23': 'GameBillet',
    '24': 'Voidu',
    '25': 'Epic Games Store',
    '26': 'Razer Game Store',
    '27': 'Gamesplanet',
    '28': 'Gamesload',
    '29': 'TwoGame',
    '30': 'IndieGala',
    '31': 'Blizzard Shop',
    '32': 'AllYouPlay',
    '33': 'DLGamer',
    '34': 'Noctre',
    '35': 'DreamGame',
  };

  return {
    name: storeMap[storeId] || 'Game Store',
    affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
    requiresDealId: true,
    isDirectLink: false
  };
}

/**
 * Server-safe implementation of generateAffiliateUrl
 * @param dealId The CheapShark deal ID
 * @param storeId The store ID
 * @param gameId Optional game ID
 * @param storeUrl Optional store URL
 * @returns A properly formatted affiliate URL
 */
export function generateAffiliateUrl(
  dealId: string,
  storeId: string,
  gameId?: string,
  storeUrl?: string
): string {
  // In server context, we always use the CheapShark redirect for safety
  return `https://www.cheapshark.com/redirect?dealID=${dealId}`;
}

/**
 * Server-safe implementation of getStoreName
 * @param storeId The store ID
 * @returns The store name
 */
export function getStoreName(storeId: string): string {
  // Use the same store mapping we created for detectStore
  const storeMap: Record<string, string> = {
    '1': 'Steam',
    '2': 'GamersGate',
    '3': 'GreenManGaming',
    '4': 'Amazon',
    '5': 'GameStop',
    '6': 'Direct2Drive',
    '7': 'GoG',
    '8': 'Origin',
    '9': 'Get Games',
    '10': 'Shiny Loot',
    '11': 'Humble Store',
    '12': 'Desura',
    '13': 'Uplay',
    '14': 'IndieGameStand',
    '15': 'Fanatical',
    '16': 'Gamesrocket',
    '17': 'Games Republic',
    '18': 'SilaGames',
    '19': 'Playfield',
    '20': 'ImperialGames',
    '21': 'WinGameStore',
    '22': 'FunStockDigital',
    '23': 'GameBillet',
    '24': 'Voidu',
    '25': 'Epic Games Store',
    '26': 'Razer Game Store',
    '27': 'Gamesplanet',
    '28': 'Gamesload',
    '29': 'TwoGame',
    '30': 'IndieGala',
    '31': 'Blizzard Shop',
    '32': 'AllYouPlay',
    '33': 'DLGamer',
    '34': 'Noctre',
    '35': 'DreamGame',
  };

  return storeMap[storeId] || 'Game Store';
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

// To ensure compatibility with various import patterns
export default {
  detectStore,
  generateAffiliateUrl,
  getStoreName,
  getAffiliateLinkAttributes,
  addTrackingParameters,
  getAffiliateDisclosure
}; 