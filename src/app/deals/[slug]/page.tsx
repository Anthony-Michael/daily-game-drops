import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FaTag, FaArrowLeft } from "react-icons/fa";
import { notFound } from "next/navigation";
import dailyDeals, { GameDeal } from "../../../../data/dailyDeals";
import AffiliateButton from "../../../components/AffiliateButton";

type Props = {
  params: { slug: string };
};

// Dynamic metadata generation
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params;
  const deal = dailyDeals.find((deal) => deal.slug === slug);

  if (!deal) {
    return {
      title: "Deal Not Found",
      description: "The requested game deal could not be found",
    };
  }

  return {
    title: deal.metaTitle || `${deal.title} - Daily Game Drops`,
    description: deal.metaDescription || deal.description,
    keywords: deal.keywords,
    openGraph: {
      title: deal.metaTitle || `${deal.title} - Daily Game Drops`,
      description: deal.metaDescription || deal.description,
      type: "website",
      url: `https://dailygamedrops.com/deals/${deal.slug}`,
      images: [
        {
          url: deal.imageUrl,
          width: 1200,
          height: 630,
          alt: deal.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: deal.metaTitle || `${deal.title} - Daily Game Drops`,
      description: deal.metaDescription || deal.description,
      images: [deal.imageUrl],
    },
  };
}

// Static params generation for better performance
export async function generateStaticParams() {
  return dailyDeals.map((deal) => ({
    slug: deal.slug,
  }));
}

export default function DealPage({ params }: Props) {
  const { slug } = params;
  const deal = dailyDeals.find((deal) => deal.slug === slug);

  // If deal not found, return 404
  if (!deal) {
    notFound();
  }

  // Create JSON-LD structured data for the deal
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": deal.title,
    "description": deal.description,
    "image": deal.imageUrl,
    "url": `https://dailygamedrops.com/deals/${deal.slug}`,
    "brand": {
      "@type": "Brand",
      "name": deal.platform || "Gaming Platform"
    },
    "offers": {
      "@type": "Offer",
      "price": deal.dealPrice === "Free" ? "0" : deal.dealPrice.replace("$", ""),
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": deal.affiliateUrl,
      "seller": {
        "@type": "Organization",
        "name": "Game Store"
      },
      "validFrom": new Date(deal.datePosted).toISOString(),
      ...(deal.expiryDate && { 
        "priceValidUntil": new Date(deal.expiryDate).toISOString() 
      })
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      {/* Add JSON-LD script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Structured Data for rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: deal.title,
            description: deal.description,
            image: deal.imageUrl,
            offers: {
              "@type": "Offer",
              price: deal.dealPrice === "Free" ? "0" : deal.dealPrice.replace("$", ""),
              priceCurrency: "USD",
              availability: "https://schema.org/InStock",
              url: `https://dailygamedrops.com/deals/${deal.slug}`,
              seller: {
                "@type": "Organization",
                name: "Daily Game Drops",
              },
            },
          }),
        }}
      />

      {/* Back navigation */}
      <div className="container mx-auto px-4 py-8">
        <Link 
          href="/" 
          className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
        >
          <FaArrowLeft className="mr-2" />
          <span>Back to Home</span>
        </Link>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden max-w-4xl mx-auto">
          {/* Game Image */}
          <div className="relative h-64 sm:h-80 md:h-96 bg-gray-200 dark:bg-gray-700">
            <div
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage: `url(${deal.imageUrl})`,
                backgroundSize: "cover",
              }}
            />
            
            {/* Deal badge */}
            {deal.dealPrice === "Free" ? (
              <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md font-bold text-lg">
                FREE
              </div>
            ) : (
              <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md font-bold text-lg">
                DEAL
              </div>
            )}
            
            {/* Platform badge */}
            {deal.platform && (
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-md">
                {deal.platform}
              </div>
            )}
          </div>

          {/* Game Details */}
          <div className="p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-4">
              {deal.title}
            </h1>
            
            {/* Price */}
            <div className="flex items-center mb-6">
              <FaTag className="text-gray-500 dark:text-gray-400 mr-3" size={20} />
              <span className="text-gray-500 dark:text-gray-400 line-through mr-3 text-lg">
                {deal.originalPrice}
              </span>
              <span className="text-2xl font-bold text-green-600 dark:text-green-500">
                {deal.dealPrice}
              </span>
            </div>
            
            {/* Dates */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4 mb-6 text-sm">
              <div className="flex flex-wrap gap-x-8 gap-y-2">
                <div className="flex items-center">
                  <span className="font-semibold mr-2">Posted:</span>
                  <span>{formatDate(deal.datePosted)}</span>
                </div>
                
                {deal.expiryDate && (
                  <div className="flex items-center">
                    <span className="font-semibold mr-2">Expires:</span>
                    <span>{formatDate(deal.expiryDate)}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Description */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                Description
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {deal.description}
              </p>
            </div>
            
            {/* Keywords display (hidden on mobile) */}
            {deal.keywords && deal.keywords.length > 0 && (
              <div className="hidden md:flex flex-wrap gap-2 mb-8">
                {deal.keywords.map((keyword, index) => (
                  <span key={index} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs">
                    {keyword}
                  </span>
                ))}
              </div>
            )}
            
            {/* Affiliate Button */}
            <AffiliateButton 
              url={deal.affiliateUrl} 
              title={deal.title} 
              size="large"
              text="Grab This Deal"
            />
          </div>
        </div>
      </main>
    </div>
  );
} 