/**
 * Server-side patches
 * This file applies immediate patches to the global object during server-side rendering
 * It should be imported at the very top of next.config.js to ensure it runs before any other code
 */

if (typeof window === 'undefined') {
  // Ensure we're running server-side
  try {
    // Define fallback store config
    const fallbackConfig = {
      name: 'Unknown Store',
      affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
      requiresDealId: true,
      isDirectLink: false
    };
    
    // Define fallback detectStore function
    const patchedDetectStore = function(storeId) {
      console.log('[Server Patches] Using patched detectStore for:', storeId);
      return fallbackConfig;
    };
    
    // Apply patches to global object
    global.a = global.a || {};
    global.a.default = global.a.default || {};
    global.a.default.detectStore = global.a.default.detectStore || patchedDetectStore;
    
    // Also patch the global detectStore function
    global.detectStore = global.detectStore || patchedDetectStore;
    
    // This should ensure detectStore is available for browser extensions during SSR
    console.log('[Server Patches] Successfully applied global patches');
  } catch (error) {
    console.error('[Server Patches] Error applying patches:', error);
  }
}

// Export the patched function so it can be imported elsewhere
module.exports = {
  patchGlobal: function() {
    // This function can be called to reapply patches if needed
    if (typeof window === 'undefined') {
      global.a = global.a || {};
      global.a.default = global.a.default || {};
      global.a.default.detectStore = function(storeId) {
        return {
          name: 'Unknown Store',
          affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
          requiresDealId: true,
          isDirectLink: false
        };
      };
    }
  }
}; 