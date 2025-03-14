"use client";

import { useState, useEffect } from "react";
import { CgGames } from "react-icons/cg";
import { FaTag, FaFilter, FaSortAmountDown } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import { GameDeal } from "../../data/dailyDeals";
import { GameDealFromAPI } from "@/lib/firebase";
import { fetchDeals } from "@/lib/firebase-client";
import AffiliateButton from "./AffiliateButton";

// Card component for better code organization
const GameDealCard = ({ deal }: { deal: GameDeal | GameDealFromAPI }) => {
  // Determine if this is an RSS deal
  const isRSSDeal = 'source' in deal && deal.source === 'rss';
  const sourceType = isRSSDeal ? deal.sourceType : 'cheapshark';
  
  // Check if this is an upcoming Epic Games deal
  const isUpcomingEpicDeal = isRSSDeal && sourceType === 'epic' && 'isUpcoming' in deal && deal.isUpcoming;
  
  // Format categories for display
  const categories = 'categories' in deal && Array.isArray(deal.categories) 
    ? deal.categories
    : [];
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      {/* Image */}
      <div className="h-48 bg-gray-200 dark:bg-gray-700 relative">
        <Link href={`/deals/${deal.slug}`} className="block w-full h-full">
          <div 
            className="w-full h-full bg-cover bg-center" 
            style={{
              backgroundImage: `url(${deal.imageUrl})`,
              backgroundSize: 'cover'
            }}
          />
        </Link>
        
        {/* Deal type indicator */}
        {isUpcomingEpicDeal ? (
          <div className="absolute top-0 right-0 bg-amber-500 text-white px-3 py-1 rounded-bl-lg font-bold">
            UPCOMING
          </div>
        ) : deal.dealPrice === "Free" || deal.dealPrice === "Coming Soon" ? (
          <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 rounded-bl-lg font-bold">
            FREE
          </div>
        ) : (
          <div className="absolute top-0 right-0 bg-red-500 text-white px-3 py-1 rounded-bl-lg font-bold">
            DEAL
          </div>
        )}
        
        {/* Platform badge */}
        {deal.platform && (
          <div className="absolute bottom-0 left-0 bg-black bg-opacity-70 text-white text-xs px-2 py-1">
            {deal.platform}
          </div>
        )}
        
        {/* Source badge */}
        {isRSSDeal && (
          <div className={`
            absolute top-0 left-0 px-2 py-1 rounded-tr-lg text-xs text-white
            ${sourceType === 'epic' ? 'bg-blue-600' : 
              sourceType === 'humble' ? 'bg-purple-600' : 
              'bg-indigo-600'}
          `}>
            {sourceType === 'epic' ? 'Epic Games' : 
             sourceType === 'humble' ? 'Humble' : 
             'RSS Feed'}
          </div>
        )}
      </div>
      
      {/* Card Content */}
      <div className="p-5">
        <Link href={`/deals/${deal.slug}`} className="block">
          <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-2 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
            {deal.title}
          </h4>
        </Link>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm line-clamp-2">
          {deal.description || "Check out this awesome game deal!"}
        </p>
        
        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {categories.slice(0, 3).map(category => (
              <span key={category} className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300">
                {category}
              </span>
            ))}
            {categories.length > 3 && (
              <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300">
                +{categories.length - 3} more
              </span>
            )}
          </div>
        )}
        
        {/* Price */}
        <div className="flex items-center mb-4">
          <FaTag className="text-gray-500 dark:text-gray-400 mr-2" />
          <span className="text-gray-500 dark:text-gray-400 line-through mr-2">{deal.originalPrice}</span>
          <span className={`text-xl font-bold ${
            deal.dealPrice === 'Free' ? 'text-green-600 dark:text-green-500' :
            deal.dealPrice === 'Coming Soon' ? 'text-amber-600 dark:text-amber-500' :
            'text-blue-600 dark:text-blue-500'
          }`}>
            {deal.dealPrice}
          </span>
        </div>
        
        {/* Date info */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Posted: {new Date(deal.datePosted).toLocaleDateString()}
          {'expiryDate' in deal && deal.expiryDate && (
            <span className="font-medium text-red-500 dark:text-red-400"> • Expires: {new Date(deal.expiryDate).toLocaleDateString()}</span>
          )}
        </div>
        
        {/* Buttons */}
        <div className="flex gap-2">
          {/* View Details Button */}
          <Link
            href={`/deals/${deal.slug}`}
            className={`
              flex-1 flex items-center justify-center
              bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 
              text-gray-800 dark:text-white py-2 px-4 rounded-lg transition-colors
            `}
            aria-label={`View details for ${deal.title}`}
          >
            View Details
          </Link>
          
          {/* Affiliate Button - Don't show for upcoming games */}
          <div className="flex-1">
            {isUpcomingEpicDeal ? (
              <button 
                disabled
                className="w-full inline-flex items-center justify-center bg-gray-400 text-white font-medium py-2 px-4 rounded-lg opacity-70 cursor-not-allowed"
              >
                Coming Soon
              </button>
            ) : (
              <AffiliateButton 
                url={deal.affiliateUrl} 
                title={deal.title}
                fullWidth={true}
                storeName={deal.storeName}
                showDisclosure={true}
                source="homepage_card"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function HomePage({ deals: initialDeals }: { deals: GameDeal[] }) {
  const [staticDeals] = useState<GameDeal[]>(initialDeals);
  const [apiDeals, setApiDeals] = useState<GameDealFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'free', 'paid'
  const [sortBy, setSortBy] = useState('date'); // 'date', 'price'
  const [dataSource, setDataSource] = useState<'static' | 'api'>('static');

  // Fetch API deals on mount
  useEffect(() => {
    async function loadApiDeals() {
      try {
        setLoading(true);
        const deals = await fetchDeals(6);
        if (deals && deals.length > 0) {
          setApiDeals(deals);
          setDataSource('api'); // Use API deals if available
        }
      } catch (error) {
        console.error('Error loading API deals:', error);
      } finally {
        setLoading(false);
      }
    }

    loadApiDeals();
  }, []);

  // Choose which deals to display
  const allDeals = dataSource === 'api' ? apiDeals : staticDeals;

  // Filter and sort deals
  const filteredAndSortedDeals = () => {
    let filtered = [...allDeals];
    
    // Apply filter
    if (filter === 'free') {
      filtered = filtered.filter(deal => deal.dealPrice === 'Free');
    } else if (filter === 'paid') {
      filtered = filtered.filter(deal => deal.dealPrice !== 'Free');
    }
    
    // Apply sorting
    if (sortBy === 'price') {
      filtered.sort((a, b) => {
        const priceA = a.dealPrice === 'Free' ? 0 : parseFloat(a.dealPrice.replace('$', ''));
        const priceB = b.dealPrice === 'Free' ? 0 : parseFloat(b.dealPrice.replace('$', ''));
        return priceA - priceB;
      });
    } else {
      // Default: sort by date (newest first)
      filtered.sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime());
    }
    
    return filtered;
  };

  const dealsList = filteredAndSortedDeals();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white shadow-sm dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🎮</span>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
              Daily Game Drops
            </h1>
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="#" className="text-gray-600 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400 transition-colors">
              Home
            </a>
            <a href="#" className="text-gray-600 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400 transition-colors">
              Free Games
            </a>
            <a href="#" className="text-gray-600 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400 transition-colors">
              Best Deals
            </a>
            <a href="#" className="text-gray-600 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400 transition-colors">
              About
            </a>
          </nav>
          <button className="block md:hidden">
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-700 to-blue-600 text-white py-12 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
            The Best Daily Game Deals & Freebies!
          </h2>
          <p className="text-lg md:text-xl max-w-3xl mx-auto mb-8 text-purple-100">
            Your one-stop destination for finding the hottest discounts and free games across all platforms
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${filter === 'all' ? 'bg-white text-purple-700 hover:bg-gray-100' : 'bg-purple-900 bg-opacity-50 text-white hover:bg-opacity-70'}`}
              onClick={() => setFilter('all')}
            >
              All Deals
            </button>
            <button 
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${filter === 'free' ? 'bg-white text-purple-700 hover:bg-gray-100' : 'bg-purple-900 bg-opacity-50 text-white hover:bg-opacity-70'}`}
              onClick={() => setFilter('free')}
            >
              Free Games
            </button>
          </div>
        </div>
      </section>

      {/* Game Deals Grid */}
      <section className="py-12 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-between items-center mb-8">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
              {dataSource === 'api' ? "Today's Fresh Deals" : "Today's Best Deals"}
            </h3>
            
            <div className="flex items-center mt-4 sm:mt-0">
              <div className="flex items-center mr-4">
                <FaFilter className="mr-2 text-gray-500 dark:text-gray-400" />
                <select 
                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 py-1 px-3"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All Deals</option>
                  <option value="free">Free Only</option>
                  <option value="paid">Paid Only</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <FaSortAmountDown className="mr-2 text-gray-500 dark:text-gray-400" />
                <select 
                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 py-1 px-3"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="date">Newest First</option>
                  <option value="price">Price: Low to High</option>
                </select>
              </div>
            </div>
          </div>
          
          {loading ? (
            // Loading skeleton
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-md animate-pulse">
                  <div className="h-48 bg-gray-300 dark:bg-gray-700" />
                  <div className="p-5">
                    <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-3/4" />
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2 w-full" />
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-2/3" />
                    <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-1/2" />
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-full" />
                    <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : dealsList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dealsList.map(deal => (
                <GameDealCard key={'id' in deal ? deal.id : deal.slug} deal={deal} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-300 text-lg">No deals found matching your criteria.</p>
              <button 
                onClick={() => setFilter('all')}
                className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
              >
                Show All Deals
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-12 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Never Miss a Game Deal</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
            Subscribe to our newsletter and get the best game deals delivered straight to your inbox daily.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
            />
            <button className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>© {new Date().getFullYear()} DailyGameDrops.com. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
} 