/**
 * Affiliate patcher module
 * This centralizes the patching logic for the detectStore function
 */

import detectStore, { StoreConfig } from './affiliate-universal';

const patchedDetectStore = (storeId: string): StoreConfig => {
  try {
    return detectStore(storeId);
  } catch (error: unknown) {
    console.warn(`[Affiliate Patcher] Error in detectStore: ${(error as Error).message}`);
    return {
      name: 'Unknown Store',
      affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
      requiresDealId: true,
      isDirectLink: false
    };
  }
};

const applyPatches = () => {
  if (typeof window === 'undefined') {
    // Server-side patching
    (global as any).detectStore = patchedDetectStore;
    
    if (typeof (global as any).a === 'undefined') {
      (global as any).a = { default: { detectStore: patchedDetectStore } };
    } else if (!(global as any).a.default) {
      (global as any).a.default = { detectStore: patchedDetectStore };
    } else if (!(global as any).a.default.detectStore) {
      (global as any).a.default.detectStore = patchedDetectStore;
    }
  } else {
    // Client-side patching
    (window as any).detectStore = patchedDetectStore;
    
    if (typeof (window as any).a === 'undefined') {
      (window as any).a = { default: { detectStore: patchedDetectStore } };
    } else if (!(window as any).a.default) {
      (window as any).a.default = { detectStore: patchedDetectStore };
    } else if (!(window as any).a.default.detectStore) {
      (window as any).a.default.detectStore = patchedDetectStore;
    }
  }
};

export default applyPatches; 