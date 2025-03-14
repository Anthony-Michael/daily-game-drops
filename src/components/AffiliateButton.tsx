import React from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import { getAffiliateLinkAttributes } from '@/lib/affiliate';

interface AffiliateButtonProps {
  url: string;
  title: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
  text?: string;
  className?: string;
}

/**
 * AffiliateButton - A reusable component for affiliate links
 * 
 * @param url - The affiliate URL to navigate to
 * @param title - The title of the product (used for accessibility)
 * @param fullWidth - Whether the button should take full width
 * @param size - Size of the button (small, medium, large)
 * @param text - Custom button text (defaults to "Grab Deal")
 * @param className - Additional CSS classes for the button
 */
export default function AffiliateButton({ 
  url, 
  title, 
  fullWidth = false,
  size = 'medium',
  text = 'Grab Deal',
  className = ''
}: AffiliateButtonProps) {
  // Get standard affiliate link attributes
  const linkAttributes = getAffiliateLinkAttributes();
  
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
    <div className={`flex flex-col ${fullWidth ? 'w-full' : ''}`}>
      <a
        href={url}
        className={`
          inline-flex items-center justify-center
          bg-purple-600 hover:bg-purple-700
          text-white font-medium
          py-2 px-4 rounded-lg
          transition-colors duration-200
          ${widthClass}
          ${className}
        `}
        {...linkAttributes}
        aria-label={`Get ${title} - Affiliate Link`}
      >
        <FaShoppingCart className="mr-2" size={iconSize[size]} />
        {text}
        <span className="sr-only"> (opens in new tab)</span>
      </a>
      <span className={`text-${size === 'large' ? 'xs' : '[10px]'} text-gray-500 dark:text-gray-400 mt-1 text-center`}>
        affiliate link
      </span>
    </div>
  );
} 