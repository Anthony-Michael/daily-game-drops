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
import GameDealCard from "./GameDealCard";

// SafeGameDealCard wraps GameDealCard with error handling
function SafeGameDealCard({ deal }: { deal: GameDeal | GameDealFromAPI }) {
  try {
    return <GameDealCard deal={deal} />;
  } catch (error) {
    console.error(`Error rendering GameDealCard for deal: ${deal.title}`, error);
    
    // Get a safe store name
    const getStoreName = () => {
      try {
        if ('storeName' in deal && deal.storeName) {
          return deal.storeName;
        } else if ('storeID' in deal && deal.storeID) {
          return `Store ${deal.storeID}`;
        }
        return 'Unknown Store';
      } catch (e) {
        return 'Unknown Store';
      }
    };
    
    // Fallback UI when the card fails to render
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-red-300 dark:border-red-700">
        <div className="p-4">
          <div className="bg-red-50 dark:bg-red-900/30 rounded p-2 mb-3">
            <p className="text-red-600 dark:text-red-400 text-sm font-medium">
              Error rendering this deal
            </p>
          </div>
          
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
            {deal.title || 'Unknown Game'}
          </h3>
          
          <div className="flex justify-between items-center mt-3">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getStoreName()}
              </p>
              <div className="flex items-center mt-1">
                <span className="text-green-600 dark:text-green-400 font-bold">
                  {deal.dealPrice || 'Unknown Price'}
                </span>
                {deal.originalPrice && deal.originalPrice !== deal.dealPrice && (
                  <span className="ml-2 text-gray-500 dark:text-gray-400 line-through text-sm">
                    {deal.originalPrice}
                  </span>
                )}
              </div>
            </div>
            
            {'slug' in deal && deal.slug ? (
              <Link 
                href={`/deal/${deal.slug}`} 
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
              >
                View Deal
              </Link>
            ) : ('affiliateUrl' in deal && deal.affiliateUrl ? (
              <a 
                href={deal.affiliateUrl} 
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Deal
              </a>
            ) : (
              <span className="px-3 py-1 bg-gray-400 text-white text-sm rounded cursor-not-allowed">
                Unavailable
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }
}

export default function HomePage({ deals: initialDeals }: { deals: (GameDeal | GameDealFromAPI)[] }) {
  const [staticDeals] = useState<(GameDeal | GameDealFromAPI)[]>(initialDeals);
  const [loading, setLoading] = useState(false);
  const [apiDeals, setApiDeals] = useState<GameDealFromAPI[]>([]);
  const [filter, setFilter] = useState<'all' | 'free'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price'>('newest');

  // Fetch additional deals from the API
  useEffect(() => {
    const loadDeals = async () => {
      setLoading(true);
      try {
        const deals = await fetchDeals();
        setApiDeals(deals);
      } catch (error) {
        console.error("Error fetching API deals:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadDeals();
  }, []);

  // Combine static and API deals
  const allDeals = [...staticDeals, ...apiDeals];

  // Filter deals based on selected filter
  const filteredAndSortedDeals = () => {
    let filtered = allDeals;
    
    // Apply free filter if selected
    if (filter === 'free') {
      filtered = filtered.filter(deal => deal.dealPrice === 'Free');
    }
    
    // Apply sorting
    if (sortBy === 'newest') {
      filtered = [...filtered].sort((a, b) => 
        new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime()
      );
    } else if (sortBy === 'price') {
      filtered = [...filtered].sort((a, b) => {
        const priceA = a.dealPrice === 'Free' ? 0 : parseFloat(a.dealPrice.replace('$', ''));
        const priceB = b.dealPrice === 'Free' ? 0 : parseFloat(b.dealPrice.replace('$', ''));
        return priceA - priceB;
      });
    }
    
    return filtered;
  };

  const dealsList = filteredAndSortedDeals();
  
  // Use the SafeGameDealCard component when rendering deals
  const renderDeals = () => {
    if (dealsList.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-300 text-lg">No deals found matching your criteria.</p>
          <button 
            onClick={() => setFilter('all')}
            className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
          >
            Show All Deals
          </button>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dealsList.map(deal => (
          <SafeGameDealCard key={typeof deal.id === 'string' ? deal.id : deal.slug} deal={deal} />
        ))}
      </div>
    );
  };

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
              {apiDeals.length > 0 ? "Today's Fresh Deals" : "Today's Best Deals"}
            </h3>
            
            <div className="flex items-center mt-4 sm:mt-0">
              <div className="flex items-center mr-4">
                <FaFilter className="mr-2 text-gray-500 dark:text-gray-400" />
                <select 
                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 py-1 px-3"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as 'all' | 'free')}
                >
                  <option value="all">All Deals</option>
                  <option value="free">Free Only</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <FaSortAmountDown className="mr-2 text-gray-500 dark:text-gray-400" />
                <select 
                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 py-1 px-3"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'price')}
                >
                  <option value="newest">Newest First</option>
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
          ) : renderDeals()}
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