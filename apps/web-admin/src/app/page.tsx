export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">판매 실적 BOARD</h1>
        <p className="text-gray-600 mb-4">Joogo WMS/OMS 시스템</p>
        <div className="space-y-2">
          <a 
            href="/board" 
            className="block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            대시보드로 이동
          </a>
          <a 
            href="/ask" 
            className="block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            AI 분석으로 이동
          </a>
        </div>
      </div>
    </div>
  );
}