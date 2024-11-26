// This file sets up the configuration for Next.js
const createNextIntlPlugin = require('next-intl/plugin');

// First create the next-intl configuration
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Add trailing slash configuration directly in the config
  trailingSlash: true,
  // Configure image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Add static file serving configuration
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack']
    });
    return config;
  }
};

// Export the config wrapped with next-intl
module.exports = withNextIntl(nextConfig);
