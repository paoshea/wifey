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
  server: {
    host: '0.0.0.0',  // Allow external access
    port: 3000
  },
  // Enable PWA features
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
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
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://0.0.0.0:3000',
  },
  // Optimize performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    legacyBrowsers: false,
  }
};

module.exports = nextConfig;
