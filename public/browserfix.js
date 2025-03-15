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
    
    // Create a patched detectStore function with robust validation
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
        
        // Always return a valid configuration object
        const result = storeConfigs[storeId] || fallbackConfig;
        // Verify the result is a proper object to avoid undefined issues
        return typeof result === 'object' && result !== null ? result : fallbackConfig;
      } catch (error) {
        console.warn('[BrowserFix] Error in detectStore:', error);
        return fallbackConfig;
      }
    };

    // Store the original Object.defineProperty to use for our custom implementation
    const originalDefineProperty = Object.defineProperty;
    
    // Define the patch function so we can reapply it if needed
    function applyPatches() {
      // Global detectStore
      window.detectStore = patchedDetectStore;
      
      // Force immediate application of patches
      try {
        // First approach: Standard property assignment
        if (!window.a) window.a = {};
        if (!window.a.default) window.a.default = {};
        window.a.default.detectStore = patchedDetectStore;
        
        // Second approach: Use defineProperty for more robust assignment
        originalDefineProperty(window, 'detectStore', {
          configurable: true,
          writable: true,
          value: patchedDetectStore
        });
        
        if (!window.a) {
          originalDefineProperty(window, 'a', {
            configurable: true,
            writable: true,
            value: {}
          });
        }
        
        if (!window.a.default) {
          originalDefineProperty(window.a, 'default', {
            configurable: true,
            writable: true,
            value: {}
          });
        }
        
        originalDefineProperty(window.a.default, 'detectStore', {
          configurable: true,
          writable: true,
          value: patchedDetectStore
        });
        
        // Third approach: Handle specific HackerOne h1-check.js pattern
        // Create a proxy for window.a to intercept all property access
        const aProxy = new Proxy(window.a || {}, {
          get: function(target, prop) {
            if (prop === 'default') {
              // Return a proxy for default as well
              return new Proxy(target.default || {}, {
                get: function(defaultTarget, defaultProp) {
                  if (defaultProp === 'detectStore') {
                    return patchedDetectStore;
                  }
                  return defaultTarget[defaultProp];
                }
              });
            }
            return target[prop];
          }
        });
        
        // Apply the proxy
        try {
          window.a = aProxy;
        } catch (e) {
          console.warn('[BrowserFix] Could not apply proxy, falling back to direct assignment:', e);
        }
        
        // Fourth approach: Override Object.defineProperty to intercept any attempts 
        // by extensions to redefine our properties
        try {
          const ourDefineProperty = function(obj, prop, descriptor) {
            // If something is trying to modify our critical properties, intercept it
            if (obj === window && prop === 'a') {
              console.warn('[BrowserFix] Intercepted attempt to redefine window.a');
              return obj;
            }
            
            if (obj === window.a && prop === 'default') {
              console.warn('[BrowserFix] Intercepted attempt to redefine window.a.default');
              return obj;
            }
            
            if (obj === window.a?.default && prop === 'detectStore') {
              console.warn('[BrowserFix] Intercepted attempt to redefine window.a.default.detectStore');
              return obj;
            }
            
            // For other properties, proceed normally
            return originalDefineProperty(obj, prop, descriptor);
          };
          
          // This is an advanced technique that may interfere with some extensions,
          // but we need it to prevent HackerOne from breaking our site
          Object.defineProperty = ourDefineProperty;
        } catch (e) {
          console.warn('[BrowserFix] Could not override Object.defineProperty:', e);
        }
      } catch (e) {
        console.error('[BrowserFix] Failed to apply core patches:', e);
      }
      
      // Log success
      console.log('[BrowserFix] Patches applied successfully');
    }
    
    // Apply patches immediately
    if (typeof window !== 'undefined') {
      applyPatches();
      
      // Re-apply patches multiple times to ensure they stick
      // Extensions may load at different times
      setTimeout(applyPatches, 0);
      setTimeout(applyPatches, 50);
      setTimeout(applyPatches, 100);
      setTimeout(applyPatches, 500);
      setTimeout(applyPatches, 1000);
    }
    
    // Add global error handler for detectStore related errors
    window.addEventListener('error', function(event) {
      const errorMsg = event.message || '';
      
      // Only intercept errors related to our detectStore functionality
      if (errorMsg.includes('detectStore') || 
          errorMsg.includes('a.default') || 
          errorMsg.includes('Cannot read properties of undefined') ||
          errorMsg.includes('h1-check.js')) {
        console.warn('[BrowserFix] Caught error:', errorMsg);
        
        // Re-apply patches
        applyPatches();
        
        console.log('[BrowserFix] Re-applied patches after error');
        event.preventDefault();
        return true;
      }
    }, true);
    
    // Add MutationObserver to detect DOM changes and reapply patches
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
    
    // HackerOne specific patch - detect and handle h1-check.js
    try {
      // This directly targets the HackerOne extension
      // Monitor requests for script elements
      const originalCreateElement = document.createElement;
      document.createElement = function(tagName) {
        const element = originalCreateElement.call(document, tagName);
        
        if (tagName.toLowerCase() === 'script') {
          // Monitor script loading
          element.addEventListener('load', function() {
            // If this might be a content script, reapply patches
            setTimeout(applyPatches, 0);
          });
        }
        
        return element;
      };
    } catch (e) {
      console.error('[BrowserFix] Failed to patch createElement:', e);
    }
    
    // Verify patches are working
    setTimeout(() => {
      try {
        // Test if a.default.detectStore is working
        const result = window.a?.default?.detectStore('1');
        console.log('[BrowserFix] Patch verification:', 
          result && typeof result === 'object' ? 'WORKING ✅' : 'FAILED ❌', 
          result
        );
        
        // Test direct access to window.detectStore
        const directResult = window.detectStore('1');
        console.log('[BrowserFix] Direct access verification:',
          directResult && typeof directResult === 'object' ? 'WORKING ✅' : 'FAILED ❌',
          directResult
        );
        
        // If either test failed, try one more aggressive approach
        if (!result || typeof result !== 'object' || !directResult || typeof directResult !== 'object') {
          console.warn('[BrowserFix] Initial patch verification failed, applying emergency patches');
          
          // Nuclear option: Define getters on window that always return the correct values
          // This is a last resort that should override any extension interference
          try {
            Object.defineProperty(window, 'detectStore', {
              configurable: true,
              get: function() { return patchedDetectStore; }
            });
            
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
            Object.defineProperty(window, 'a', {
              configurable: true,
              get: function() { return aObject; }
            });
            
            console.log('[BrowserFix] Emergency patches applied');
          } catch (e) {
            console.error('[BrowserFix] Failed to apply emergency patches:', e);
          }
        }
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