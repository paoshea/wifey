const createNextIntlPlugin = require('next-intl/plugin');
const webpack = require('webpack');

// Create next-intl configuration
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  trailingSlash: true,

  output: 'standalone',

  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: true,
  },

  webpack: (config, { isServer }) => {
    // Add SVG handling
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    // Add fallbacks for OpenTelemetry
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        perf_hooks: false,
        'utf-8-validate': false,
        bufferutil: false,
      };
    }

    // Ignore OpenTelemetry warnings in development
    if (process.env.NODE_ENV === 'development') {
      config.ignoreWarnings = [
        { module: /@opentelemetry/ },
        { module: /node_modules/ },
      ];
    }

    return config;
  },
};

module.exports = withNextIntl(nextConfig);
