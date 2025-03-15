/**
 * Browser extension conflict fix script
 * This script patches window.a references that might be causing issues with browser extensions
 * It runs early as a script tag in the head of the document
 */
(function() {
  try {
    console.log('[BrowserFix] Initializing...');
    
    // Create fallback store config
    const fallbackConfig = {
      name: 'Unknown Store',
      affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
      requiresDealId: true,
      isDirectLink: false
    };
    
    // Create a patched detectStore function
    const patchedDetectStore = function(storeId) {
      try {
        // Basic validation
        if (!storeId) return fallbackConfig;
        
        // Handle default store configs
        const storeConfigs = {
          '1': { 
            name: 'Steam',
            affiliateUrlPattern: 'https://store.steampowered.com/app/{gameId}',
            requiresDealId: false,
            isDirectLink: true
          },
          // Add more common stores for direct access
          '12': {
            name: 'Epic Games Store',
            affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
            requiresDealId: true,
            isDirectLink: false
          }
        };
        
        return storeConfigs[storeId] || fallbackConfig;
      } catch (error) {
        console.warn('[BrowserFix] Error in detectStore:', error);
        return fallbackConfig;
      }
    };
    
    // Apply patches to handle window.a pattern that's causing issues
    if (typeof window !== 'undefined') {
      // Global detectStore
      window.detectStore = patchedDetectStore;
      
      // Create the a.default.detectStore structure if it doesn't exist
      if (typeof window.a === 'undefined') {
        console.log('[BrowserFix] Creating window.a structure');
        window.a = { default: { detectStore: patchedDetectStore } };
      } else if (!window.a.default) {
        console.log('[BrowserFix] Creating window.a.default structure');
        window.a.default = { detectStore: patchedDetectStore };
      } else {
        console.log('[BrowserFix] Patching window.a.default.detectStore');
        window.a.default.detectStore = patchedDetectStore;
      }
      
      console.log('[BrowserFix] Patches applied successfully');
    }
    
    // Add global error handler for detectStore related errors
    window.addEventListener('error', function(event) {
      const errorMsg = event.message || '';
      
      // Only intercept errors related to our detectStore functionality
      if (errorMsg.includes('detectStore') || 
          errorMsg.includes('a.default') || 
          errorMsg.includes('Cannot read properties of undefined')) {
        console.warn('[BrowserFix] Caught error:', errorMsg);
        
        // Re-apply patches
        window.detectStore = patchedDetectStore;
        if (typeof window.a === 'undefined') {
          window.a = { default: { detectStore: patchedDetectStore } };
        } else if (!window.a.default) {
          window.a.default = { detectStore: patchedDetectStore };
        } else {
          window.a.default.detectStore = patchedDetectStore;
        }
        
        console.log('[BrowserFix] Re-applied patches after error');
        event.preventDefault();
        return true;
      }
    }, true);
    
    console.log('[BrowserFix] Initialization complete');
  } catch (err) {
    console.error('[BrowserFix] Failed to initialize:', err);
  }
})(); 