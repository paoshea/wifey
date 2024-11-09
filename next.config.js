/** @type {import('next').NextConfig} */
const withNextIntl = require('next-intl/plugin')();

const nextConfig = {
  images: {
    unoptimized: true
  }
};

module.exports = withNextIntl(nextConfig);