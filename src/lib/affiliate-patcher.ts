/**
 * Affiliate patcher module
 * This centralizes the patching logic for the detectStore function
 */

import detectStore, { StoreConfig } from './affiliate-universal';

// Immediately invoke function to patch global objects as soon as this module is imported
(() => {
  try {
    if (typeof window === 'undefined') {
      // Only run server-side code
      console.log('[Server Patcher] Applying immediate server-side patches');
      
      // Define a properly typed global object with any to avoid TypeScript errors
      const globalObj = global as any;
      
      // Ensure global.a exists and has detectStore
      globalObj.a = globalObj.a || {};
      globalObj.a.default = globalObj.a.default || {};
      globalObj.a.default.detectStore = globalObj.a.default.detectStore || function(storeId: string) {
        console.log('[Server Patcher] Using immediate fallback for:', storeId);
        return {
          name: 'Unknown Store',
          affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
          requiresDealId: true,
          isDirectLink: false
        };
      };
      
      // Also patch global.detectStore directly
      globalObj.detectStore = globalObj.detectStore || globalObj.a.default.detectStore;
    }
  } catch (error) {
    console.error('[Server Patcher] Failed to apply immediate patch:', error);
  }
})();

// Default fallback configuration if detectStore fails
const fallbackStoreConfig: StoreConfig = {
  name: 'Unknown Store',
  affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
  requiresDealId: true,
  isDirectLink: false
};

/**
 * Enhanced version of detectStore with error handling
 * This ensures we always return a valid StoreConfig even if the original function fails
 */
const patchedDetectStore = (storeId: string): StoreConfig => {
  try {
    // If storeId is not provided or invalid, use fallback
    if (!storeId || typeof storeId !== 'string') {
      console.warn(`[Affiliate Patcher] Invalid storeId: ${storeId}, using fallback`);
      return fallbackStoreConfig;
    }
    
    // Call the original function
    const config = detectStore(storeId);
    
    // Verify the result is a valid StoreConfig
    if (!config || typeof config !== 'object') {
      console.warn(`[Affiliate Patcher] detectStore returned invalid config for storeId: ${storeId}, using fallback`);
      return fallbackStoreConfig;
    }
    
    return config;
  } catch (error: unknown) {
    // Log the error but return fallback to prevent breaking the UI
    console.error(`[Affiliate Patcher] Error in detectStore:`, error);
    return fallbackStoreConfig;
  }
};

/**
 * Apply the patched detectStore function globally
 * This ensures that any code referencing detectStore gets our enhanced version
 */
const applyPatches = () => {
  try {
    if (typeof window === 'undefined') {
      // Server-side patching
      console.log('[Affiliate Patcher] Applying patches in server environment');
      
      // Use any typing for global to avoid TypeScript errors
      const globalObj = global as any;
      
      // Patch global detectStore
      globalObj.detectStore = patchedDetectStore;
      
      // Patch a.default.detectStore pattern that's causing errors
      if (typeof globalObj.a === 'undefined') {
        globalObj.a = { default: { detectStore: patchedDetectStore } };
      } else {
        if (!globalObj.a.default) {
          globalObj.a.default = { detectStore: patchedDetectStore };
        } else {
          globalObj.a.default.detectStore = patchedDetectStore;
        }
      }
      
      console.log('[Affiliate Patcher] Server-side patches applied successfully');
    } else {
      // Client-side patching
      console.log('[Affiliate Patcher] Applying patches in browser environment');
      
      // Use any typing for window to avoid TypeScript errors
      const windowObj = window as any;
      
      // Patch window detectStore
      windowObj.detectStore = patchedDetectStore;
      
      // Patch a.default.detectStore pattern that's causing errors
      if (typeof windowObj.a === 'undefined') {
        windowObj.a = { default: { detectStore: patchedDetectStore } };
      } else {
        if (!windowObj.a.default) {
          windowObj.a.default = { detectStore: patchedDetectStore };
        } else {
          windowObj.a.default.detectStore = patchedDetectStore;
        }
      }
      
      console.log('[Affiliate Patcher] Client-side patches applied successfully');
    }
  } catch (error) {
    console.error('[Affiliate Patcher] Failed to apply patches:', error);
  }
};

// Export both the function and a direct call to ensure patches are applied
export default applyPatches;

// Auto-apply patches when this module is imported
applyPatches(); 