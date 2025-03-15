import { Metadata } from 'next';
import { getDocById, COLLECTIONS } from '@/lib/firebase-admin';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// Define the props type for this page
type Props = {
  params: { id: string };
};

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = params.id;
  
  // Fetch the game data
  const game = await getDocById(COLLECTIONS.GAME_DEALS, id);
  
  if (!game) {
    return {
      title: 'Game Not Found',
      description: 'The requested game deal could not be found.',
    };
  }
  
  return {
    title: `${game.title} | Daily Game Drops`,
    description: game.description || `Check out this great deal for ${game.title}!`,
    openGraph: {
      title: `${game.title} - Deal`,
      description: game.description || `Great deal for ${game.title}!`,
      images: game.imageUrl ? [{ url: game.imageUrl }] : undefined,
    },
  };
}

/**
 * Game Details Page
 * 
 * Demonstrates fetching data from Firestore on the server-side
 * and rendering it in a Next.js page.
 */
export default async function GameDetailsPage({ params }: Props) {
  const id = params.id;
  
  // Fetch the game data from Firestore
  const game = await getDocById(COLLECTIONS.GAME_DEALS, id);
  
  // If game not found, show 404
  if (!game) {
    notFound();
  }
  
  // Format date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Unknown date';
    
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  // Calculate savings percentage if available
  const savingsPercent = game.savings ? 
    Math.round(parseFloat(game.savings)) : null;
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back navigation */}
      <Link
        href="/games"
        className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-6"
      >
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Back to Games
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Game header */}
        <div className="relative">
          {/* Game image */}
          {game.imageUrl ? (
            <div
              className="w-full h-64 md:h-96 bg-cover-crisp image-rendering-crisp"
              style={{
                backgroundImage: `url(${game.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                imageRendering: 'crisp-edges'
              }}
            />
          ) : (
            <div className="w-full h-64 md:h-96 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-gray-500 dark:text-gray-400 text-lg">No image available</span>
            </div>
          )}
          
          {/* Price badge */}
          <div className="absolute top-4 right-4">
            {game.dealPrice === 'Free' ? (
              <div className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-lg">
                FREE
              </div>
            ) : (
              <div className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-lg">
                {game.dealPrice}
              </div>
            )}
          </div>
          
          {/* Store badge */}
          {game.storeName && (
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded">
              {game.storeName}
            </div>
          )}
        </div>

        {/* Game details */}
        <div className="p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-4">
            {game.title}
          </h1>
          
          {/* Price and savings */}
          <div className="flex items-baseline mb-6">
            {game.originalPrice && game.dealPrice !== 'Free' && (
              <span className="text-gray-500 line-through mr-3 text-lg">
                {game.originalPrice}
              </span>
            )}
            <span className="text-2xl font-bold text-green-600 dark:text-green-500">
              {game.dealPrice}
            </span>
            {savingsPercent && (
              <span className="ml-3 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-1 rounded text-sm">
                {savingsPercent}% OFF
              </span>
            )}
          </div>
          
          {/* Description */}
          {game.description && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                Description
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {game.description}
              </p>
            </div>
          )}
          
          {/* Deal information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Deal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {game.datePosted && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Posted Date:</span>
                  <span className="ml-2 text-gray-800 dark:text-gray-200">
                    {formatDate(game.datePosted)}
                  </span>
                </div>
              )}
              {game.expiryDate && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Expiry Date:</span>
                  <span className="ml-2 text-gray-800 dark:text-gray-200">
                    {formatDate(game.expiryDate)}
                  </span>
                </div>
              )}
              {game.platform && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Platform:</span>
                  <span className="ml-2 text-gray-800 dark:text-gray-200">{game.platform}</span>
                </div>
              )}
              {game.metacriticScore && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Metacritic Score:</span>
                  <span className="ml-2 text-gray-800 dark:text-gray-200">{game.metacriticScore}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Deal button */}
          {game.affiliateUrl && (
            <a
              href={game.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Get This Deal
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// Make this page dynamic
export const dynamic = 'force-dynamic'; 