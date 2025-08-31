/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages + Edge Functions를 위한 설정
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
