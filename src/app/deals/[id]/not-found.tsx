import Link from "next/link";
import { FaExclamationTriangle, FaArrowLeft } from "react-icons/fa";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-800 px-4">
      <div className="text-center max-w-md">
        <FaExclamationTriangle className="text-yellow-500 text-6xl mx-auto mb-6" />
        
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
          Deal Not Found
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          The game deal you're looking for doesn't exist or may have expired.
        </p>
        
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-lg font-medium"
        >
          <FaArrowLeft className="mr-2" />
          Back to Home
        </Link>
      </div>
    </div>
  )
} 