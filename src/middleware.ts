import { NextRequest, NextResponse } from 'next/server';

// This middleware runs before any page is rendered
export function middleware(request: NextRequest) {
  // We're not modifying the response, just ensuring it passes through
  return NextResponse.next();
}

// Add a global patch for the 'detectStore' function that's causing SSR errors
// This gets executed at the module level before any components render
if (typeof global !== 'undefined') {
  // Create a simple fallback object for server context
  const fallbackStoreConfig = {
    name: 'Game Store',
    affiliateUrlPattern: 'https://www.cheapshark.com/redirect?dealID={dealID}',
    requiresDealId: true,
    isDirectLink: false
  };
  
  // Define our fallback function
  const fallbackDetectStore = function(storeId: string) {
    console.log('[Middleware] Using fallback detectStore for:', storeId);
    return fallbackStoreConfig;
  };
  
  // Add the function to the global object to ensure it's available in all contexts
  Object.defineProperty(global, 'detectStore', {
    value: fallbackDetectStore,
    writable: false
  });
  
  // Also patch the typical error pattern
  if (typeof (global as any).a === 'undefined') {
    (global as any).a = { default: { detectStore: fallbackDetectStore } };
  } else if (!(global as any).a.default) {
    (global as any).a.default = { detectStore: fallbackDetectStore };
  } else if (!(global as any).a.default.detectStore) {
    (global as any).a.default.detectStore = fallbackDetectStore;
  }
}

// Export the config to match all routes
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (static files)
     * 4. /_vercel (Vercel internals)
     * 5. Static files like favicon.ico, robots.txt, etc.
     */
    '/((?!api|_next|_static|_vercel|favicon.ico|robots.txt).*)',
  ],
}; 