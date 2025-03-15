'use client';

import { useEffect, useState } from 'react';
import { useDeals, fetchFreeDeals, formatTimestamp } from '@/lib/firebase-client';
import Link from 'next/link';

/**
 * GameList Component
 * 
 * Demonstrates how to use Firestore hooks to display game deals
 * with filtering, error handling, and loading states.
 */
export default function GameList() {
  // Use the custom hook to fetch game deals
  const { data: games, loading, error } = useDeals(12);
  
  // State for free games (fetched separately)
  const [freeGames, setFreeGames] = useState<any[]>([]);
  const [freeGamesLoading, setFreeGamesLoading] = useState(false);
  
  // Selected filter state
  const [filter, setFilter] = useState<'all' | 'free'>('all');
  
  // Fetch free games when filter changes to 'free'
  useEffect(() => {
    if (filter === 'free') {
      const loadFreeGames = async () => {
        setFreeGamesLoading(true);
        try {
          const deals = await fetchFreeDeals(12);
          setFreeGames(deals);
        } catch (err) {
          console.error('Error fetching free games:', err);
        } finally {
          setFreeGamesLoading(false);
        }
      };
      
      loadFreeGames();
    }
  }, [filter]);
  
  // Display games based on selected filter
  const displayedGames = filter === 'free' ? freeGames : games;
  const isLoading = loading || (filter === 'free' && freeGamesLoading);
  
  // Format the date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Unknown date';
    
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(date);
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Game Deals</h2>
        
        {/* Filter buttons */}
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            All Deals
          </button>
          <button
            onClick={() => setFilter('free')}
            className={`px-4 py-2 rounded-md ${
              filter === 'free'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Free Games
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>Error loading games: {error.message}</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
              <div className="h-48 bg-gray-300 rounded mb-4"></div>
              <div className="h-6 bg-gray-300 rounded mb-2 w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded mb-4 w-1/2"></div>
              <div className="flex justify-between items-center">
                <div className="h-8 bg-gray-300 rounded w-1/4"></div>
                <div className="h-10 bg-gray-300 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Empty state */}
          {displayedGames.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600">
                {filter === 'free'
                  ? 'No free games available right now'
                  : 'No game deals available'}
              </p>
              <p className="text-gray-500 mt-2">Check back later for new deals</p>
            </div>
          )}

          {/* Game deals grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedGames.map((game) => (
              <div key={game.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                {/* Game image */}
                <div className="h-48 bg-gray-200 dark:bg-gray-700 relative">
                  {game.imageUrl ? (
                    <div
                      className="w-full h-full bg-cover-crisp image-rendering-crisp"
                      style={{
                        backgroundImage: `url(${game.imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        imageRendering: 'crisp-edges'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                  
                  {/* Deal badge */}
                  {game.dealPrice === 'Free' && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-md">
                      FREE
                    </div>
                  )}
                </div>
                
                {/* Game details */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2 line-clamp-2">{game.title}</h3>
                  
                  <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300 mb-3">
                    <span>{game.storeName || 'Unknown Store'}</span>
                    <span>{formatDate(game.datePosted)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-baseline">
                      <span className="text-lg font-bold text-green-600">
                        {game.dealPrice}
                      </span>
                      {game.originalPrice && game.dealPrice !== 'Free' && (
                        <span className="ml-2 text-sm text-gray-500 line-through">
                          {game.originalPrice}
                        </span>
                      )}
                    </div>
                    
                    {/* View button */}
                    <Link 
                      href={`/games/${game.id}`}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
                    >
                      View Deal
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 