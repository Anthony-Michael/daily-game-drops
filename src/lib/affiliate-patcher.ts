/**
 * Affiliate patcher module
 * This centralizes the patching logic for the detectStore function
 */

import detectStore, { StoreConfig } from './affiliate-universal';

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
      
      // Patch global detectStore
      (global as any).detectStore = patchedDetectStore;
      
      // Patch a.default.detectStore pattern that's causing errors
      if (typeof (global as any).a === 'undefined') {
        (global as any).a = { default: { detectStore: patchedDetectStore } };
      } else {
        if (!(global as any).a.default) {
          (global as any).a.default = { detectStore: patchedDetectStore };
        } else {
          (global as any).a.default.detectStore = patchedDetectStore;
        }
      }
      
      console.log('[Affiliate Patcher] Server-side patches applied successfully');
    } else {
      // Client-side patching
      console.log('[Affiliate Patcher] Applying patches in browser environment');
      
      // Patch window detectStore
      (window as any).detectStore = patchedDetectStore;
      
      // Patch a.default.detectStore pattern that's causing errors
      if (typeof (window as any).a === 'undefined') {
        (window as any).a = { default: { detectStore: patchedDetectStore } };
      } else {
        if (!(window as any).a.default) {
          (window as any).a.default = { detectStore: patchedDetectStore };
        } else {
          (window as any).a.default.detectStore = patchedDetectStore;
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