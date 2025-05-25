/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: true,
  },
  images: { unoptimized: true },
  webpack: (config, { dev, isServer }) => {
    if (dev && isServer) {
      config.cache = {
        type: 'memory'
      };
    }
    return config;
  }
};

module.exports = nextConfig;