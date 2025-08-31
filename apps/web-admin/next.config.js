/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages 배포를 위한 설정
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '.' : '',
  basePath: process.env.NODE_ENV === 'production' ? '' : '',
  
  // Cloudflare Pages 호환성
  experimental: {
    // Edge Runtime 지원
    runtime: 'edge',
  },
}

module.exports = nextConfig
