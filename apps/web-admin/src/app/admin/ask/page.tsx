'use client';

import { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import { fmtKRW, fmtInt } from '@/lib/format';

interface QueryHistory {
  id: string;
  question: string;
  timestamp: string;
  response: any;
  bookmarked: boolean;
}

interface AskResponse {
  intent: string;
  type: 'chart' | 'summary';
  data: any[];
  params?: any;
  summary: string;
  error?: string;
}

export default function AskPage() {
  const defaultTenant = useMemo(() => process.env.NEXT_PUBLIC_TENANT_ID || '', []);
  const [tenantId, setTenantId] = useState(defaultTenant);
  const [question, setQuestion] = useState('최근 30일 top 5 sku');
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<QueryHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // 히스토리 로드 (localStorage)
  useEffect(() => {
    const saved = localStorage.getItem('ask-history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history:', e);
      }
    }
  }, []);

  // 히스토리 저장
  const saveHistory = (newHistory: QueryHistory[]) => {
    setHistory(newHistory);
    localStorage.setItem('ask-history', JSON.stringify(newHistory));
  };

  const onAsk = async () => {
    if (!question.trim()) return;
    
    setLoading(true);
    setResponse(null);
    
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), tenant_id: tenantId }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setResponse(data);
        
        // 히스토리에 추가
        const newQuery: QueryHistory = {
          id: Date.now().toString(),
          question: question.trim(),
          timestamp: new Date().toLocaleString(),
          response: data,
          bookmarked: false
        };
        
        const updatedHistory = [newQuery, ...history.slice(0, 9)]; // 최근 10개만 유지
        saveHistory(updatedHistory);
      } else {
        setResponse({ intent: 'error', type: 'summary', data: [], summary: data.error || 'Error' });
      }
    } catch (e: any) {
      setResponse({ intent: 'error', type: 'summary', data: [], summary: e?.message || 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = (id: string) => {
    const updatedHistory = history.map(h => 
      h.id === id ? { ...h, bookmarked: !h.bookmarked } : h
    );
    saveHistory(updatedHistory);
  };

  const loadFromHistory = (query: QueryHistory) => {
    setQuestion(query.question);
    setResponse(query.response);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('ask-history');
  };

  // 차트 데이터 포맷팅
  const formatChartData = (data: any[], intent: string) => {
    if (intent === 'top_sku_days') {
      return data.map(row => ({
        name: row.sku,
        매출: row.total_sales || 0,
        주문수: row.order_count || 0
      }));
    }
    
    if (intent === 'monthly_summary') {
      return data.map(row => ({
        name: `${row.month}`,
        매출: row.total_sales || 0,
        주문수: row.order_count || 0
      }));
    }
    
    if (intent === 'sku_trend') {
      return data.map(row => ({
        name: row.order_date?.split('T')[0] || row.created_at?.split('T')[0] || 'Unknown',
        매출: row.total_price || 0,
        수량: row.qty || 0
      }));
    }
    
    return data;
  };

  // 응답 렌더링
  const renderResponse = (resp: AskResponse) => {
    if (resp.error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 font-medium">오류</div>
          <div className="text-red-600">{resp.error}</div>
        </div>
      );
    }

    const chartData = formatChartData(resp.data, resp.intent);

    if (resp.type === 'chart' && chartData.length > 0) {
      return (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-blue-800 font-medium">{resp.summary}</div>
            <div className="text-blue-600 text-sm">{resp.intent}</div>
          </div>
          
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium mb-3">차트</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                {resp.intent === 'top_sku_days' ? (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => fmtInt(value)} />
                    <Legend />
                    <Bar dataKey="매출" fill="#3b82f6" />
                    <Bar dataKey="주문수" fill="#10b981" />
                  </BarChart>
                ) : (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => fmtInt(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="매출" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="주문수" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium mb-3">데이터 테이블</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(chartData[0] || {}).map(key => (
                      <th key={key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {chartData.map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).map((value, vIdx) => (
                        <td key={vIdx} className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {typeof value === 'number' ? fmtInt(value) : value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (resp.type === 'summary') {
      return (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-800 font-medium">{resp.summary}</div>
            <div className="text-green-600 text-sm">{resp.intent}</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(resp.data).map(([key, value]) => (
              <div key={key} className="bg-white border rounded-lg p-4">
                <div className="text-sm text-gray-500 uppercase tracking-wider">{key}</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">
                  {key.includes('total') || key.includes('price') ? fmtKRW(value) : fmtInt(value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gray-50 border rounded-lg p-4">
        <pre className="text-sm overflow-auto">{JSON.stringify(resp, null, 2)}</pre>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">자연어 질의 (AI)</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="px-3 py-2 border rounded hover:bg-gray-50"
          >
            {showHistory ? '히스토리 숨기기' : '히스토리 보기'}
          </button>
          <a href="/admin/analytics/sales" className="px-3 py-2 border rounded hover:bg-gray-50">
            Analytics로
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 메인 질의 영역 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border rounded-lg p-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">tenant_id</label>
                <input 
                  className="border rounded px-3 py-2 w-full" 
                  value={tenantId} 
                  onChange={e => setTenantId(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-sm mb-1">질문</label>
                <input 
                  className="border rounded px-3 py-2 w-full" 
                  value={question} 
                  onChange={e => setQuestion(e.target.value)} 
                  placeholder="예: 최근 30일 top 5 sku, 월별 매출 추세, 올해 총매출, 전월 대비 변화, SKU-1001 추세, 매출 요약" 
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={onAsk} 
                  disabled={loading} 
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? '질의 중...' : '질의하기'}
                </button>
                <button 
                  onClick={() => setQuestion('')} 
                  className="px-3 py-2 border rounded hover:bg-gray-50"
                >
                  초기화
                </button>
              </div>
            </div>
          </div>

          {/* 응답 표시 */}
          {response && (
            <div className="bg-white border rounded-lg p-4">
              {renderResponse(response)}
            </div>
          )}
        </div>

        {/* 히스토리 사이드바 */}
        {showHistory && (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">질의 히스토리</h3>
                <button 
                  onClick={clearHistory}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  전체 삭제
                </button>
              </div>
              
              {history.length === 0 ? (
                <div className="text-gray-500 text-sm">질의 기록이 없습니다.</div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {history.map(query => (
                    <div key={query.id} className="border rounded p-2 hover:bg-gray-50">
                      <div className="flex items-start justify-between gap-2">
                        <button
                          onClick={() => loadFromHistory(query)}
                          className="text-left text-sm hover:text-blue-600 flex-1"
                          title="클릭하여 다시 질의"
                        >
                          <div className="font-medium truncate">{query.question}</div>
                          <div className="text-xs text-gray-500">{query.timestamp}</div>
                        </button>
                        <button
                          onClick={() => toggleBookmark(query.id)}
                          className={`text-lg ${query.bookmarked ? 'text-yellow-500' : 'text-gray-400'} hover:text-yellow-600`}
                          title={query.bookmarked ? '북마크 해제' : '북마크 추가'}
                        >
                          {query.bookmarked ? '⭐' : '☆'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 예시 질문들 */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-medium mb-3">예시 질문</h3>
              <div className="space-y-2 text-sm">
                {[
                  '최근 30일 top 5 sku',
                  '월별 매출 추세',
                  '올해 총매출',
                  '전월 대비 변화',
                  'SKU-1001 추세',
                  '매출 요약'
                ].map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuestion(example)}
                    className="block w-full text-left text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


