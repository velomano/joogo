import type { Metadata } from 'next';
import './globals.css';
import IngestBridge from './ingest-bridge';

export const metadata: Metadata = {
  title: 'Joogo WMS/OMS',
  description: 'Warehouse Management System and Order Management System',
};

async function getTenantIdFromServer(): Promise<string> {
  // 개발용 고정 테넌트 ID 사용
  return '00000000-0000-0000-0000-000000000001';
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenantId = await getTenantIdFromServer();
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50">
        <IngestBridge tenantId={tenantId} />
        {/* Modern Navigation Bar */}
        <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              {/* Logo and Brand */}
              <div className="flex items-center space-x-8">
                <a href="/" className="flex items-center space-x-3 group">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <span className="text-white text-sm font-bold">J</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">Joogo</span>
                </a>
                
                {/* Navigation Links */}
                <div className="hidden md:flex items-center space-x-1">
                  <a href="/" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                    대시보드
                  </a>
                  <a href="/board/sales" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                    판매 분석
                  </a>
                  <a href="/board/abc" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200">
                    ABC 분석
                  </a>
                  <a href="/board/inventory" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors duration-200">
                    재고 분석
                  </a>
                </div>
              </div>
              
              {/* Right Side */}
              <div className="flex items-center space-x-4">
                {/* Status Indicator */}
                <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">시스템 정상</span>
                </div>
                
                {/* Tenant Info */}
                <div className="hidden lg:flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-sm text-gray-600">Joogo Test Company</span>
                </div>
              </div>
            </div>
          </div>
        </nav>
        
        {/* Main Content */}
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}

