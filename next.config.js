/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', '0.0.0.0'],
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
  // Configure i18n
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
  },
  // Configure headers for PWA
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/'
          }
        ]
      }
    ];
  },
  // Configure redirects
  async redirects() {
    return [
      {
        source: '/coverage',
        destination: '/coverage-finder',
        permanent: true,
      }
    ];
  },
  // Configure environment variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  // Optimize performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true
  }
};

module.exports = nextConfig;
