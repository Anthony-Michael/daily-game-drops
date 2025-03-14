"use client";

import React, { useEffect } from 'react';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error Boundary Component for Client-Side Error Handling
 * 
 * This component displays a user-friendly error message when a React component 
 * encounters an error during rendering, and provides a way to recover by 
 * resetting the error boundary.
 * 
 * @param error - The error that was caught
 * @param reset - Function to reset the error boundary and retry rendering
 */
export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log the error to the console for debugging
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="error-container p-6 max-w-md mx-auto my-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
        Something went wrong
      </h2>
      
      <p className="mb-4 text-gray-700 dark:text-gray-300">
        We're having trouble loading this page right now. This might be a temporary issue.
      </p>
      
      <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded mb-4 text-sm text-gray-600 dark:text-gray-400">
        <p>Error: {error.message || 'Unknown error'}</p>
        {error.digest && <p className="mt-1">Digest: {error.digest}</p>}
      </div>
      
      <button
        onClick={reset}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded transition-colors duration-200"
      >
        Try Again
      </button>
    </div>
  );
} 