/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages + Edge Functions를 위한 설정
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  
  // 번들 크기 최적화
  experimental: {
    // 번들 분석 활성화
    bundlePagesExternals: true,
    // 트리 쉐이킹 최적화
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
    // 번들 크기 제한
    maxConcurrency: 1,
  },
  
  // 웹팩 최적화
  webpack: (config, { isServer, dev }) => {
    if (!isServer && !dev) {
      // 클라이언트 번들 최적화
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxSize: 25000000, // 25MB 제한
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
            },
          },
        },
        // 번들 크기 제한
        maxEntrypointSize: 25000000,
        maxAssetSize: 25000000,
      };
      
      // 불필요한 폴리필 제거
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        buffer: false,
        process: false,
        util: false,
      };
      
      // 번들 크기 경고 설정
      config.performance = {
        hints: 'warning',
        maxEntrypointSize: 25000000,
        maxAssetSize: 25000000,
      };
    }
    
    return config;
  },
  
  // 번들 분석기 활성화 (개발 시에만)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      config.plugins.push(
        new (require('webpack-bundle-analyzer').BundleAnalyzerPlugin)()
      );
      return config;
    },
  }),
}

module.exports = nextConfig
