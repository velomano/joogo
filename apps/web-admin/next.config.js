/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages 배포를 위한 설정
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '.' : '',
  basePath: process.env.NODE_ENV === 'production' ? '' : '',
}

module.exports = nextConfig
