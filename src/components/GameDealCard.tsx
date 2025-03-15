"use client";

import React from "react";
import Link from "next/link";
import { CgGames } from "react-icons/cg";
import { GameDeal } from "../../data/dailyDeals";
import { GameDealFromAPI } from "@/lib/firebase";
import AffiliateButton from "./AffiliateButton";
import { detectStore } from '@/lib/affiliate-universal';

// Card component for displaying game deals
export default function GameDealCard({ deal }: { deal: GameDeal | GameDealFromAPI }) {
  // Use try-catch for all potentially risky operations
  try {
    // Determine if this is an RSS deal
    const isRSSDeal = 'source' in deal && deal.source === 'rss';
    const sourceType = isRSSDeal ? deal.sourceType : 'cheapshark';
    
    // Check if this is an upcoming Epic Games deal
    const isUpcomingEpicDeal = isRSSDeal && sourceType === 'epic' && 'isUpcoming' in deal && deal.isUpcoming;
    
    // Format categories for display
    const categories = 'categories' in deal && Array.isArray(deal.categories) 
      ? deal.categories
      : [];

    // Add fallback for missing storeName
    const storeName = deal.storeName || 'Game Store';
    
    // Safely access other attributes
    const dealPrice = deal.dealPrice || 'Deal';
    const originalPrice = deal.originalPrice || '';
    
    // Handle invalid savings values
    const savingsValue = 'savings' in deal && deal.savings && !isNaN(parseFloat(deal.savings)) 
      ? Math.round(parseFloat(deal.savings)) 
      : 0;

    // Safely handle dates
    const formatDate = (dateString: string | undefined) => {
      if (!dateString) return 'Unknown date';
      try {
        return new Date(dateString).toLocaleDateString();
      } catch (e) {
        return 'Invalid date';
      }
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md">
        {/* Deal badge */}
        <div className="relative">
          {/* Free badge */}
          {dealPrice === "Free" && (
            <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-md font-semibold text-sm z-10">
              FREE
            </div>
          )}
          
          {/* Deal badge for non-free items */}
          {dealPrice !== "Free" && originalPrice && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md font-semibold text-sm z-10">
              DEAL
            </div>
          )}
          
          {/* Source badge */}
          <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded-md text-xs z-10">
            {sourceType === 'humble' ? 'Humble' : 
             sourceType === 'epic' ? 'Epic' : 
             'Steam'}
          </div>
          
          {/* Upcoming badge */}
          {isUpcomingEpicDeal && (
            <div className="absolute bottom-2 left-2 bg-purple-600 text-white px-2 py-1 rounded-md text-xs z-10">
              Coming Soon
            </div>
          )}

          {/* Image with placeholder */}
          <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-700">
            {deal.imageUrl ? (
              <div
                className="w-full h-full bg-center bg-cover"
                style={{ backgroundImage: `url(${deal.imageUrl})` }}
              ></div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <CgGames className="text-gray-400 text-5xl" />
              </div>
            )}
          </div>
        </div>

        <div className="p-5">
          {/* Title */}
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1 line-clamp-2">
            {deal.title}
          </h3>
          
          {/* Store name and categories */}
          <div className="flex flex-wrap items-center gap-1 mb-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">{storeName}</span>
            
            {categories.length > 0 && (
              <>
                <span className="text-gray-400">•</span>
                <div className="flex flex-wrap gap-1">
                  {categories.slice(0, 2).map((category, index) => (
                    <span 
                      key={index} 
                      className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded"
                    >
                      {category}
                    </span>
                  ))}
                  {categories.length > 2 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">+{categories.length - 2}</span>
                  )}
                </div>
              </>
            )}
          </div>
          
          {/* Price */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
              {dealPrice}
            </span>
            
            {originalPrice && dealPrice !== "Free" && (
              <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                {originalPrice}
              </span>
            )}
            
            {/* Savings badge */}
            {savingsValue > 0 && (
              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-0.5 rounded ml-auto">
                {savingsValue}% OFF
              </span>
            )}
          </div>
          
          {/* Posted date and expiry */}
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Posted: {formatDate(deal.datePosted)}
            {'expiryDate' in deal && deal.expiryDate && (
              <span className="font-medium text-red-500 dark:text-red-400"> • Expires: {formatDate(deal.expiryDate)}</span>
            )}
          </div>
          
          {/* Buttons */}
          <div className="flex gap-2">
            {/* View Details Button - only shown if a slug exists */}
            {'slug' in deal && deal.slug && (
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
            )}
            
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
                // Use the safer AffiliateButton that imports from affiliate-client
                <AffiliateButton 
                  url={deal.affiliateUrl} 
                  title={deal.title}
                  fullWidth={true}
                  storeName={storeName}
                  showDisclosure={true}
                  source="homepage_card"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    // Fallback UI when the card completely fails to render
    console.error(`Error in GameDealCard: ${error}`);
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-red-300 dark:border-red-700">
        <div className="p-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
            {deal?.title || 'Game Deal'}
          </h3>
          <p className="text-red-500 dark:text-red-400">
            Unable to display this deal
          </p>
          {deal?.affiliateUrl && (
            <a 
              href={deal.affiliateUrl}
              className="mt-3 inline-block px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Deal
            </a>
          )}
        </div>
      </div>
    );
  }
} 