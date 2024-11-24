// This file sets up the configuration for Next.js
const { withSentryConfig } = require('@sentry/nextjs');
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin({
  locales: ['en', 'es'],
  defaultLocale: 'en',
  localePrefix: 'always'
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    _next_intl_trailing_slash: '1'
  }
};

// Combine next-intl with Sentry config
module.exports = withNextIntl(withSentryConfig(
  nextConfig,
  {
    org: "ownco-bp",
    project: "javascript-nextjs",
    silent: !process.env.CI,
    widenClientFileUpload: true,
    reactComponentAnnotation: {
      enabled: true,
    },
    tunnelRoute: "/monitoring",
    hideSourceMaps: true,
    disableLogger: true,
    automaticVercelMonitors: true,
  },
  {
    hideSourceMaps: true,
    disableServerWebpackPlugin: process.env.NODE_ENV === 'development',
    disableClientWebpackPlugin: process.env.NODE_ENV === 'development',
  }
));
