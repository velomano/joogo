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
    // 번들 크기 제한 강제 적용
    forceSwcTransforms: true,
  },
  
  // 웹팩 최적화
  webpack: (config, { isServer, dev }) => {
    if (!isServer && !dev) {
      // 클라이언트 번들 최적화
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxSize: 20000000, // 20MB로 더 엄격하게 제한
          minSize: 1000000,  // 1MB 최소 크기
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
              enforce: true,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
            },
            // 큰 패키지들을 별도 청크로 분리
            largeVendors: {
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              name: 'large-vendors',
              chunks: 'all',
              priority: 20,
              enforce: true,
            },
          },
        },
        // 코드 압축 최적화
        minimize: true,
        minimizer: [
          '...',
          new (require('terser-webpack-plugin'))({
            terserOptions: {
              compress: {
                drop_console: true,
                drop_debugger: true,
              },
            },
          }),
        ],
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
        querystring: false,
        punycode: false,
        domain: false,
        dns: false,
        dgram: false,
        child_process: false,
        cluster: false,
        module: false,
        vm: false,
        inspector: false,
      };
      
      // 번들 크기 경고 설정
      config.performance = {
        hints: 'error', // 경고를 에러로 변경하여 빌드 실패
        maxEntrypointSize: 20000000, // 20MB
        maxAssetSize: 20000000, // 20MB
      };
      
      // 외부 모듈 설정으로 번들 크기 줄이기
      config.externals = {
        ...config.externals,
        'react': 'React',
        'react-dom': 'ReactDOM',
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
