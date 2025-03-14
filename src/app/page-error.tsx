'use client';

import React, { useEffect } from 'react';

/**
 * Page-level Error Boundary
 * 
 * This component handles errors that occur within a specific page,
 * providing a more localized error experience that doesn't disrupt
 * the entire application.
 */
export default function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-lg mx-auto">
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            We're Having Trouble
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We can't load this content right now. We're working on fixing the issue.
          </p>
          
          <button
            onClick={reset}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
          
          {error.digest && (
            <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 