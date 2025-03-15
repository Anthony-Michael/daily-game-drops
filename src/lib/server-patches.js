/**
 * Server-side patches
 * This file applies immediate patches to the global object during server-side rendering
 * It should be imported at the very top of next.config.js to ensure it runs before any other code
 */

if (typeof window === 'undefined') {
  // Ensure we're running server-side
  try {
    console.log('[Server Patches] Applying server-side patches for detectStore');
    
    // Define fallback store config
    const fallbackConfig = {
      name: 'Unknown Store',
      affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
      requiresDealId: true,
      isDirectLink: false
    };

    // Define store configs map for direct access
    const storeConfigs = {
      '1': { 
        name: 'Steam',
        affiliateUrlPattern: 'https://store.steampowered.com/app/{gameId}',
        requiresDealId: false,
        isDirectLink: true
      },
      '12': {
        name: 'Epic Games Store',
        affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
        requiresDealId: true,
        isDirectLink: false
      }
    };
    
    // Define patched detectStore function with robust validation
    const patchedDetectStore = function(storeId) {
      try {
        // Log for debugging
        console.log('[Server Patches] detectStore called with storeId:', storeId);
        
        // Basic validation
        if (!storeId || typeof storeId !== 'string') {
          console.warn('[Server Patches] Invalid storeId:', storeId);
          return fallbackConfig;
        }
        
        // Return appropriate store config or fallback
        const result = storeConfigs[storeId] || fallbackConfig;
        
        // Ensure we always return an object
        return typeof result === 'object' && result !== null ? result : fallbackConfig;
      } catch (error) {
        console.error('[Server Patches] Error in patched detectStore:', error);
        return fallbackConfig;
      }
    };

    // Store original defineProperty
    const originalDefineProperty = Object.defineProperty;
    
    // Apply patches to global object with multiple approaches
    try {
      // Approach 1: Direct property assignment
      global.detectStore = patchedDetectStore;
      
      if (!global.a) global.a = {};
      if (!global.a.default) global.a.default = {};
      global.a.default.detectStore = patchedDetectStore;
      
      // Approach 2: Use defineProperty for more robust assignment
      originalDefineProperty(global, 'detectStore', {
        configurable: true,
        writable: true,
        value: patchedDetectStore
      });
      
      if (!global.a) {
        originalDefineProperty(global, 'a', {
          configurable: true,
          writable: true,
          value: {}
        });
      }
      
      if (!global.a.default) {
        originalDefineProperty(global.a, 'default', {
          configurable: true,
          writable: true,
          value: {}
        });
      }
      
      originalDefineProperty(global.a.default, 'detectStore', {
        configurable: true,
        writable: true,
        value: patchedDetectStore
      });
      
      // Approach 3: Define getters (most aggressive)
      try {
        // Create a special 'a' object with getters
        const aObject = {};
        Object.defineProperty(aObject, 'default', {
          configurable: true,
          get: function() {
            const defaultObj = {};
            Object.defineProperty(defaultObj, 'detectStore', {
              configurable: true,
              get: function() { return patchedDetectStore; }
            });
            return defaultObj;
          }
        });
        
        // Apply the special 'a' object
        Object.defineProperty(global, 'a', {
          configurable: true,
          get: function() { return aObject; }
        });
        
        // Also patch direct access to detectStore
        Object.defineProperty(global, 'detectStore', {
          configurable: true,
          get: function() { return patchedDetectStore; }
        });
      } catch (e) {
        console.error('[Server Patches] Failed to apply getter patches:', e);
      }
      
      // This should ensure detectStore is available for browser extensions during SSR
      console.log('[Server Patches] Successfully applied global patches');
      
      // Verify patches were applied successfully
      try {
        const test1 = global.detectStore('1');
        const test2 = global.a.default.detectStore('1');
        
        console.log('[Server Patches] Verification:', 
          test1 && typeof test1 === 'object' && 
          test2 && typeof test2 === 'object' ? 'SUCCESS ✅' : 'FAILED ❌'
        );
      } catch (e) {
        console.error('[Server Patches] Verification failed:', e);
      }
    } catch (error) {
      console.error('[Server Patches] Error applying patches:', error);
    }
  } catch (error) {
    console.error('[Server Patches] Critical error in server patches:', error);
  }
}

// Export the patched function so it can be imported elsewhere
module.exports = {
  patchGlobal: function() {
    // This function can be called to reapply patches if needed
    if (typeof window === 'undefined') {
      console.log('[Server Patches] Reapplying global patches');
      
      // Define robust fallback config
      const fallbackConfig = {
        name: 'Unknown Store',
        affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
        requiresDealId: true,
        isDirectLink: false
      };
      
      // Create a robust detectStore function
      const patchedDetectStore = function(storeId) {
        console.log('[Server Patches] Reapplied detectStore called with:', storeId);
        return fallbackConfig;
      };
      
      // Apply basic patches
      global.detectStore = patchedDetectStore;
      global.a = global.a || {};
      global.a.default = global.a.default || {};
      global.a.default.detectStore = patchedDetectStore;
      
      console.log('[Server Patches] Patches reapplied successfully');
      return true;
    }
    return false;
  }
}; 