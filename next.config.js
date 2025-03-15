// Import server patches first to ensure availability of detectStore
require('./src/lib/server-patches.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during production builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript errors during builds
  typescript: {
    ignoreBuildErrors: true,
  },
  // Handle module resolution issues for affiliate functions
  webpack: (config, { isServer }) => {
    // Apply additional server-side patches if server build
    if (isServer) {
      console.log('Applying server-side patches during webpack build');
      try {
        // This is redundant but ensures the patches are applied during webpack build
        require('./src/lib/server-patches.js').patchGlobal();
      } catch (err) {
        console.error('Failed to apply server patches in webpack config:', err);
      }
    }
    return config;
  },
  // Ensure affiliates aren't causing SSR issues
  serverExternalPackages: [],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.cloudflare.steamstatic.com',
        port: '',
        pathname: '/steam/**',
      },
    ],
  },
};

module.exports = nextConfig; 