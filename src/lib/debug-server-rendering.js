/**
 * Server-side rendering debug script
 * This script provides debugging information for server-side rendering issues
 * related to the detectStore function and other critical dependencies
 */

if (typeof window === 'undefined') {
  try {
    console.log('=== SERVER RENDERING DEBUG INFORMATION ===');
    
    // Check if we have basic global objects defined
    console.log('global.a exists:', typeof global.a !== 'undefined');
    console.log('global.a.default exists:', typeof global.a?.default !== 'undefined');
    console.log('global.a.default.detectStore exists:', typeof global.a?.default?.detectStore === 'function');
    console.log('global.detectStore exists:', typeof global.detectStore === 'function');
    
    // Check for specific HackerOne extension pattern
    const hasHackerOnePatterns = () => {
      try {
        // Look for any moz-extension, chrome-extension, or other extension patterns
        const keys = Object.keys(global);
        const extensionKeys = keys.filter(key => 
          key.includes('extension') || 
          key.includes('h1-check') || 
          key.includes('moz'));
        
        if (extensionKeys.length > 0) {
          console.log('Found potential extension objects:', extensionKeys);
          return true;
        }
        
        return false;
      } catch (e) {
        console.error('Error checking for extension patterns:', e);
        return false;
      }
    };
    
    console.log('HackerOne patterns detected:', hasHackerOnePatterns());
    
    // Test detectStore functionality
    const testDetectStore = (storeId = '1') => {
      try {
        console.log(`Testing global.detectStore('${storeId}')...`);
        const result = global.detectStore ? global.detectStore(storeId) : null;
        console.log('Result:', result);
        return result;
      } catch (e) {
        console.error(`Error calling global.detectStore('${storeId}'):`, e);
        return null;
      }
    };
    
    const testADefaultDetectStore = (storeId = '1') => {
      try {
        console.log(`Testing global.a.default.detectStore('${storeId}')...`);
        const result = global.a?.default?.detectStore ? global.a.default.detectStore(storeId) : null;
        console.log('Result:', result);
        return result;
      } catch (e) {
        console.error(`Error calling global.a.default.detectStore('${storeId}'):`, e);
        return null;
      }
    };
    
    // Run tests
    testDetectStore();
    testADefaultDetectStore();
    
    // Apply emergency patches if needed
    if (!global.a?.default?.detectStore || !global.detectStore) {
      console.log('Applying emergency debug patches...');
      
      // Define fallback config
      const fallbackConfig = {
        name: 'Unknown Store',
        affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
        requiresDealId: true,
        isDirectLink: false
      };
      
      // Create emergency detectStore function
      const emergencyDetectStore = function(storeId) {
        console.log('[Emergency] Using emergency detectStore for:', storeId);
        return fallbackConfig;
      };
      
      // Apply emergency patches
      if (!global.detectStore) {
        global.detectStore = emergencyDetectStore;
        console.log('Applied emergency global.detectStore patch');
      }
      
      if (!global.a) {
        global.a = {};
        console.log('Created emergency global.a object');
      }
      
      if (!global.a.default) {
        global.a.default = {};
        console.log('Created emergency global.a.default object');
      }
      
      if (!global.a.default.detectStore) {
        global.a.default.detectStore = emergencyDetectStore;
        console.log('Applied emergency global.a.default.detectStore patch');
      }
      
      // Test again after emergency patches
      console.log('Testing after emergency patches:');
      testDetectStore();
      testADefaultDetectStore();
    }
    
    console.log('=== END SERVER RENDERING DEBUG INFORMATION ===');
  } catch (error) {
    console.error('Critical error in debug-server-rendering.js:', error);
  }
}

// Export a function that can be called to run diagnostics
module.exports = {
  runDiagnostics: function() {
    if (typeof window === 'undefined') {
      console.log('Running server-side rendering diagnostics...');
      
      try {
        // Check for detectStore function
        const hasDetectStore = typeof global.detectStore === 'function';
        const hasADefaultDetectStore = typeof global.a?.default?.detectStore === 'function';
        
        console.log('detectStore available:', hasDetectStore);
        console.log('a.default.detectStore available:', hasADefaultDetectStore);
        
        // Apply patches if needed
        if (!hasDetectStore || !hasADefaultDetectStore) {
          console.log('Applying diagnostic patches...');
          
          const fallbackConfig = {
            name: 'Unknown Store',
            affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
            requiresDealId: true,
            isDirectLink: false
          };
          
          const diagnosticDetectStore = function(storeId) {
            console.log('[Diagnostic] Using diagnostic detectStore for:', storeId);
            return fallbackConfig;
          };
          
          // Apply patches
          global.detectStore = diagnosticDetectStore;
          
          if (!global.a) global.a = {};
          if (!global.a.default) global.a.default = {};
          global.a.default.detectStore = diagnosticDetectStore;
          
          console.log('Diagnostic patches applied');
          
          return {
            patchesApplied: true,
            detectStoreAvailable: true,
            aDefaultDetectStoreAvailable: true
          };
        }
        
        return {
          patchesApplied: false,
          detectStoreAvailable: hasDetectStore,
          aDefaultDetectStoreAvailable: hasADefaultDetectStore
        };
      } catch (e) {
        console.error('Error in diagnostics:', e);
        return {
          error: e.message,
          patchesApplied: false,
          detectStoreAvailable: false,
          aDefaultDetectStoreAvailable: false
        };
      }
    }
    
    return {
      error: 'Not server environment',
      patchesApplied: false,
      detectStoreAvailable: false,
      aDefaultDetectStoreAvailable: false
    };
  }
}; 