'use client';

import { useState } from 'react';

interface AskResponse {
  success: boolean;
  data?: any[];
  error?: string;
  sql?: string;
  intent?: string;
}

export default function AskPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [history, setHistory] = useState<Array<{ query: string; response: AskResponse; timestamp: Date }>>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          tenant_id: '84949b3c-2cb7-4c42-b9f9-d1f37d371e00' // 기본 테넌트
        }),
      });

      const data = await res.json();
      const newResponse = {
        query,
        response: data,
        timestamp: new Date()
      };

      setResponse(data);
      setHistory(prev => [newResponse, ...prev.slice(0, 9)]); // 최근 10개만 유지
      setQuery('');
    } catch (error) {
      setResponse({
        success: false,
        error: `요청 실패: ${error}`
      });
    } finally {
      setLoading(false);
    }
  };

  const renderData = (data: any[]) => {
    if (!data || data.length === 0) {
      return <div className="text-gray-400">데이터가 없습니다.</div>;
    }

    const headers = Object.keys(data[0]);
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-700">
              {headers.map(header => (
                <th key={header} className="border border-gray-600 px-3 py-2 text-left">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 100).map((row, index) => (
              <tr key={index} className="hover:bg-gray-800">
                {headers.map(header => (
                  <td key={header} className="border border-gray-600 px-3 py-2">
                    {String(row[header] || '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 100 && (
          <div className="text-gray-400 text-sm mt-2">
            상위 100행만 표시됩니다. (총 {data.length}행)
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">자연어 질의</h1>
        
        {/* 질의 입력 */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="query" className="block text-sm font-medium mb-2">
                질문을 입력하세요
              </label>
              <textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="예: 이번 달 매출이 가장 높은 상위 5개 상품을 보여줘"
                className="w-full h-24 p-3 bg-gray-700 border border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium"
            >
              {loading ? '처리 중...' : '질의 실행'}
            </button>
          </form>
        </div>

        {/* 응답 결과 */}
        {response && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">응답 결과</h2>
            
            {response.success ? (
              <div className="space-y-4">
                {response.intent && (
                  <div className="text-sm text-gray-400">
                    <strong>인텐트:</strong> {response.intent}
                  </div>
                )}
                {response.sql && (
                  <div className="bg-gray-900 p-3 rounded border">
                    <div className="text-sm text-gray-400 mb-2">실행된 SQL:</div>
                    <pre className="text-sm text-green-400 overflow-x-auto">
                      {response.sql}
                    </pre>
                  </div>
                )}
                {response.data && (
                  <div>
                    <div className="text-sm text-gray-400 mb-2">결과 데이터:</div>
                    {renderData(response.data)}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-400">
                <strong>오류:</strong> {response.error}
              </div>
            )}
          </div>
        )}

        {/* 질의 히스토리 */}
        {history.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">최근 질의</h2>
            <div className="space-y-4">
              {history.map((item, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <div className="text-sm text-gray-400 mb-1">
                    {item.timestamp.toLocaleString()}
                  </div>
                  <div className="font-medium mb-2">{item.query}</div>
                  <div className="text-sm">
                    {item.response.success ? (
                      <span className="text-green-400">
                        ✓ 성공 ({item.response.data?.length || 0}행)
                      </span>
                    ) : (
                      <span className="text-red-400">
                        ✗ 실패: {item.response.error}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 사용 예시 */}
        <div className="bg-gray-800 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">사용 예시</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">매출 관련</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• "이번 달 총 매출은 얼마야?"</li>
                <li>• "지역별 매출 순위를 보여줘"</li>
                <li>• "카테고리별 매출 비중을 알려줘"</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">상품 관련</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• "가장 많이 팔린 상위 10개 상품"</li>
                <li>• "SKU-001의 판매 현황을 보여줘"</li>
                <li>• "재고가 부족한 상품들을 찾아줘"</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">기간별 분석</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• "최근 7일간의 일별 매출"</li>
                <li>• "이번 주 vs 지난 주 매출 비교"</li>
                <li>• "월별 매출 트렌드를 보여줘"</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">채널/지역 분석</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• "웹 vs 앱 채널별 매출 비교"</li>
                <li>• "서울 지역의 판매 현황"</li>
                <li>• "지역별 인기 상품을 알려줘"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
