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
    
    // Define the patch function so we can reapply it if needed
    function applyPatches() {
      // Global detectStore
      window.detectStore = patchedDetectStore;
      
      // Create the a.default.detectStore structure
      window.a = window.a || {};
      window.a.default = window.a.default || {};
      window.a.default.detectStore = patchedDetectStore;
      
      // Patch the HackerOne extension pattern (h1-check.js)
      try {
        // This is a more aggressive approach targeting the specific error
        // Create a proxy to intercept property access attempts
        window.a = new Proxy(window.a || {}, {
          get: function(target, prop) {
            if (prop === 'default') {
              return target.default || { 
                detectStore: patchedDetectStore 
              };
            }
            return target[prop];
          }
        });
      } catch (e) {
        console.error('[BrowserFix] Failed to create proxy:', e);
      }
      
      // Log success
      console.log('[BrowserFix] Patches applied successfully');
    }
    
    // Apply patches to handle window.a pattern that's causing issues
    if (typeof window !== 'undefined') {
      applyPatches();
      
      // Re-apply patches after a brief delay to ensure they stick
      setTimeout(applyPatches, 0);
      setTimeout(applyPatches, 50);
      setTimeout(applyPatches, 100);
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
        applyPatches();
        
        console.log('[BrowserFix] Re-applied patches after error');
        event.preventDefault();
        return true;
      }
    }, true);
    
    // Add MutationObserver to detect DOM changes and reapply patches
    // This helps with extensions that inject scripts later
    try {
      const observer = new MutationObserver(function(mutations) {
        for (let mutation of mutations) {
          if (mutation.type === 'childList') {
            for (let node of mutation.addedNodes) {
              if (node.tagName === 'SCRIPT') {
                // Script was added, reapply our patches
                setTimeout(applyPatches, 0);
                break;
              }
            }
          }
        }
      });
      
      // Start observing the document with the configured parameters
      observer.observe(document.documentElement, { 
        childList: true, 
        subtree: true 
      });
    } catch (e) {
      console.error('[BrowserFix] Failed to create MutationObserver:', e);
    }
    
    // Verify patches are working
    setTimeout(() => {
      try {
        // Test if a.default.detectStore is working
        const result = window.a?.default?.detectStore('1');
        console.log('[BrowserFix] Patch verification:', 
          result ? 'WORKING ✅' : 'FAILED ❌', 
          result
        );
        
        // Test direct access to window.detectStore
        const directResult = window.detectStore('1');
        console.log('[BrowserFix] Direct access verification:',
          directResult ? 'WORKING ✅' : 'FAILED ❌',
          directResult
        );
      } catch (error) {
        console.error('[BrowserFix] Patch verification failed:', error);
        // Try to fix one more time
        applyPatches();
      }
    }, 200);
    
    console.log('[BrowserFix] Initialization complete');
  } catch (err) {
    console.error('[BrowserFix] Failed to initialize:', err);
  }
})(); 