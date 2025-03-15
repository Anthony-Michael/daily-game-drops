import { Metadata } from 'next';
import GameList from '@/components/GameList';

// Define metadata for the games listing page
export const metadata: Metadata = {
  title: 'Game Deals | Daily Game Drops',
  description: 'Browse the latest game deals and discounts across all platforms.',
  openGraph: {
    title: 'Game Deals | Daily Game Drops',
    description: 'Browse the latest video game deals, discounts, and free games.',
    url: '/games',
    type: 'website',
  },
};

/**
 * Games Listing Page
 * 
 * This page displays the GameList component which handles fetching and
 * displaying game deals from Firestore.
 */
export default function GamesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main>
        <div className="py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Game Deals
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Browse the latest deals and discounts for top games
            </p>
            
            {/* Render the GameList component */}
            <GameList />
          </div>
        </div>
      </main>
    </div>
  );
} 