import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FaTag, FaArrowLeft } from "react-icons/fa";
import { notFound } from "next/navigation";
import dailyDeals, { GameDeal } from "../../../../data/dailyDeals";
import AffiliateButton from "../../../components/AffiliateButton";

type Props = {
  params: { id: string };
};

// Dynamic metadata generation
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = parseInt(params.id);
  const deal = dailyDeals.find((deal) => deal.id === id);

  if (!deal) {
    return {
      title: "Deal Not Found",
      description: "The requested game deal could not be found",
    };
  }

  return {
    title: `${deal.title} - Daily Game Drops`,
    description: deal.description,
    openGraph: {
      title: `${deal.title} - Daily Game Drops`,
      description: deal.description,
      type: "website",
    },
  };
}

// Static params generation for better performance (optional)
export async function generateStaticParams() {
  return dailyDeals.map((deal) => ({
    id: deal.id.toString(),
  }));
}

export default function DealPage({ params }: Props) {
  const id = parseInt(params.id);
  const deal = dailyDeals.find((deal) => deal.id === id);

  // If deal not found, return 404
  if (!deal) {
    notFound();
  }

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