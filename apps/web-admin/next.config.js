/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    bundlePagesExternals: true,
  },
  webpack: (config, { isServer }) => {
    // 경로 별칭
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, './'),
    };

    // 번들 크기 최적화
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
              maxSize: 20000000, // 20MB
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
              maxSize: 20000000, // 20MB
            },
            common: {
              name: 'common',
              minChunks: 2,
              priority: -5,
              chunks: 'all',
              reuseExistingChunk: true,
              maxSize: 20000000, // 20MB
            },
          },
        },
      };
    }

    // 압축 최적화
    config.optimization.minimize = true;
    config.optimization.minimizer = config.optimization.minimizer || [];
    
    return config;
  },
  // 정적 파일 최적화
  images: {
    unoptimized: true,
  },
  // 압축 비활성화 (Cloudflare에서 처리)
  compress: false,
  // 번들 분석기 비활성화
  webpack5: true,
};

module.exports = nextConfig;
