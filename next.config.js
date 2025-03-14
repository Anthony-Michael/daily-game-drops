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
    // Add a module alias for server components to use the server-safe version
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/lib/affiliate$': isServer 
        ? require.resolve('./src/app/api/detect-store-adapter.ts')
        : require.resolve('./src/lib/affiliate-client.ts')
    };
    
    return config;
  },
  // Ensure affiliates aren't causing SSR issues
  experimental: {
    serverComponentsExternalPackages: [],
    serverActions: {
      allowedOrigins: ['localhost:3000', 'dailygamedrops.com', '*.vercel.app']
    }
  }
};

module.exports = nextConfig; 