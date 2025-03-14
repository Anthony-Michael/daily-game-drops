"use client";

import React, { useState } from 'react';
import { FaShoppingCart, FaInfoCircle } from 'react-icons/fa';
import { getAffiliateLinkAttributes, addTrackingParameters, getAffiliateDisclosure } from '@/lib/affiliate';

interface AffiliateButtonProps {
  url: string;
  title: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
  text?: string;
  className?: string;
  storeName?: string;
  showDisclosure?: boolean;
  source?: string;
}

/**
 * AffiliateButton - A reusable component for affiliate links
 * 
 * This component creates a standardized button for affiliate links that:
 * 1. Clearly marks the link as an affiliate link
 * 2. Opens in a new tab (for better user experience)
 * 3. Includes proper tracking parameters
 * 4. Shows appropriate disclosures (optional tooltip)
 * 5. Includes proper accessibility attributes
 * 
 * @param url - The affiliate URL to navigate to
 * @param title - The title of the product (used for accessibility)
 * @param fullWidth - Whether the button should take full width
 * @param size - Size of the button (small, medium, large)
 * @param text - Custom button text (defaults to "Grab Deal")
 * @param className - Additional CSS classes for the button
 * @param storeName - Name of the store (for disclosure)
 * @param showDisclosure - Whether to show the disclosure tooltip
 * @param source - Source of the click for tracking (e.g., 'homepage', 'detail_page')
 */
export default function AffiliateButton({ 
  url, 
  title, 
  fullWidth = false,
  size = 'medium',
  text = 'Grab Deal',
  className = '',
  storeName = '',
  showDisclosure = false,
  source = 'homepage'
}: AffiliateButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Get standard affiliate link attributes
  const linkAttributes = getAffiliateLinkAttributes();
  
  // Add tracking parameters to URL
  const trackedUrl = addTrackingParameters(url, source);
  
  // Get the disclosure text
  const disclosure = getAffiliateDisclosure(storeName);
  
  // Determine styling based on size
  const sizeClasses = {
    small: 'py-1.5 px-3 text-sm',
    medium: 'py-2 px-4 text-base',
    large: 'py-3 px-8 text-lg font-medium'
  };
  
  const iconSize = {
    small: 14,
    medium: 16,
    large: 20
  };
  
  const widthClass = fullWidth ? 'w-full' : 'w-auto';
  
  return (
    <div className={`flex flex-col ${fullWidth ? 'w-full' : ''} relative`}>
      <a
        href={trackedUrl}
        className={`
          inline-flex items-center justify-center
          bg-purple-600 hover:bg-purple-700
          text-white font-medium
          py-2 px-4 rounded-lg
          transition-colors duration-200
          ${sizeClasses[size]}
          ${widthClass}
          ${className}
        `}
        {...linkAttributes}
        aria-label={`Get ${title} - Affiliate Link`}
        onClick={() => {
          // Optional: Add analytics event tracking here
          console.log(`Affiliate link clicked: ${title}`);
        }}
      >
        <FaShoppingCart className="mr-2" size={iconSize[size]} />
        {text}
        <span className="sr-only"> (affiliate link, opens in new tab)</span>
      </a>
      
      <div className="flex items-center justify-center mt-1">
        <span className={`text-${size === 'large' ? 'xs' : '[10px]'} text-gray-500 dark:text-gray-400 mr-1`}>
          affiliate link
        </span>
        
        {showDisclosure && (
          <div 
            className="relative inline-block"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <FaInfoCircle 
              size={size === 'small' ? 10 : 12} 
              className="text-gray-400 hover:text-gray-600 cursor-help transition-colors" 
            />
            
            {showTooltip && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 w-60 bg-white dark:bg-gray-800 p-2 rounded shadow-lg text-xs text-gray-700 dark:text-gray-300 z-10">
                {disclosure}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45 bg-white dark:bg-gray-800"></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 