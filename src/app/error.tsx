'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Global Error Handler for Next.js App
 * 
 * This component acts as a global error boundary that catches any errors
 * in the application and displays a user-friendly error page.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-4">
              Something went wrong!
            </h2>
            
            <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
              We're sorry, but we encountered an unexpected error.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={reset}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded transition-colors duration-200 flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
              
              <Link
                href="/"
                className="block w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded text-center transition-colors duration-200"
              >
                Go Back Home
              </Link>
            </div>
            
            {error.digest && (
              <p className="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
} 