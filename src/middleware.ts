import { NextRequest, NextResponse } from 'next/server';

// This middleware runs before any page is rendered
export function middleware(request: NextRequest) {
  // We're not modifying the response, just ensuring it passes through
  return NextResponse.next();
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