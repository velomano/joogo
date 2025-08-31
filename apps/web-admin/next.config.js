/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Workers 배포를 위한 설정
  experimental: {
    serverComponentsExternalPackages: ['@joogo/shared']
  }
}

module.exports = nextConfig
