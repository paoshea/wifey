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

  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    // Add OpenTelemetry warnings suppression
    config.plugins.push(
      new webpack.ContextReplacementPlugin(
        /@opentelemetry[\/\\]instrumentation/,
        (data) => {
          delete data.dependencies;
          return data;
        }
      )
    );

    return config;
  },
};

module.exports = withNextIntl(nextConfig);
