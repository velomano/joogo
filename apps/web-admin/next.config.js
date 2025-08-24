/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@joogo/shared'],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
}

module.exports = nextConfig
