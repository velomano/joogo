/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@joogo/shared'],
  experimental: {
    appDir: true,
  },
}

module.exports = nextConfig
