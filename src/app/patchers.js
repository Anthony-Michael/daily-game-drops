/**
 * Module-level patchers to fix module resolution issues in Next.js
 * 
 * This file is imported in layout.tsx and executes before any components are rendered.
 * It ensures that the problematic 'detectStore' function is always available even
 * during server-side rendering.
 */

// Create a simple fallback config for the store detection
const fallbackStoreConfig = {
  name: 'Game Store',
  affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
  requiresDealId: true,
  isDirectLink: false
};

// Fallback function that always returns a valid result
const detectStoreFallback = function(storeId) {
  const storeMap = {
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
  };
  
  return {
    ...fallbackStoreConfig,
    name: storeMap[storeId] || 'Game Store'
  };
};

// Export the patcher function that runs when imported
export function patchModules() {
  // If running on server
  if (typeof window === 'undefined') {
    if (typeof global !== 'undefined') {
      // Add fallbacks to global object for SSR
      global.detectStore = detectStoreFallback;
      
      // Handle the a.default pattern causing errors
      if (typeof global.a === 'undefined') {
        global.a = { default: { detectStore: detectStoreFallback } };
      } else if (!global.a.default) {
        global.a.default = { detectStore: detectStoreFallback };
      } else if (!global.a.default.detectStore) {
        global.a.default.detectStore = detectStoreFallback;
      }
    }
  } 
  // If running on client
  else {
    // Add fallbacks to window object for CSR
    window.detectStore = detectStoreFallback;
    
    // Handle the a.default pattern causing errors
    if (typeof window.a === 'undefined') {
      window.a = { default: { detectStore: detectStoreFallback } };
    } else if (!window.a.default) {
      window.a.default = { detectStore: detectStoreFallback };
    } else if (!window.a.default.detectStore) {
      window.a.default.detectStore = detectStoreFallback;
    }
  }
}

// Run the patcher immediately when this module is imported
patchModules(); 