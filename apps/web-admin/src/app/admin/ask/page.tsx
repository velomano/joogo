'use client';

import { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import { fmtKRW, fmtInt } from '../../../lib/format';

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
  analysis?: {
    intent: string;
    reasoning: string;
    confidence: number;
  };
  insight?: string;
}

export default function AskPage() {
  // 개발용 고정 테넌트 ID
  const defaultTenant = useMemo(() => '84949b3c-2cb7-4c42-b9f9-d1f37d371e00', []);
  const [tenantId, setTenantId] = useState(defaultTenant);
  const [question, setQuestion] = useState('대시보드 요약');
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
        body: JSON.stringify({ question: question.trim(), tenantId: tenantId }),
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

  // 차트/대시보드 데이터 포맷팅
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
  const renderResponse = (resp: any) => {
    if (resp.error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 font-medium">오류</div>
          <div className="text-red-600">{resp.error}</div>
        </div>
      );
    }

    // SKU 분석 응답
    if (resp.type === 'sku') {
      const skuData = resp.data?.skuAnalysis || [];
      const chartData = skuData.map((item: any) => ({
        name: item.sku,
        매출: item.total_revenue,
        수량: item.total_qty,
        주문수: item.order_count
      }));

      return (
        <div className="space-y-6">
          {/* LLM 분석 결과 */}
          {resp.analysis && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-blue-800 font-medium">AI 분석 결과</div>
              <div className="text-blue-600 text-sm mt-1">
                <strong>의도:</strong> {resp.analysis.intent} 
                <span className="ml-2 text-blue-500">(신뢰도: {(resp.analysis.confidence * 100).toFixed(0)}%)</span>
              </div>
              <div className="text-blue-600 text-sm mt-1">
                <strong>분석:</strong> {resp.analysis.reasoning}
              </div>
            </div>
          )}

          {/* AI 인사이트 */}
          {resp.insight && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-green-800 font-medium">AI 인사이트</div>
              <div className="text-green-700 mt-1">{resp.insight}</div>
            </div>
          )}

          {/* 요약 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow">
              <div className="text-blue-100 text-sm">총 SKU 수</div>
              <div className="text-2xl font-bold">{resp.data?.totalSkus || 0}개</div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg shadow">
              <div className="text-green-100 text-sm">최고 매출 SKU</div>
              <div className="text-2xl font-bold">{resp.data?.topSku || 'N/A'}</div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg shadow">
              <div className="text-purple-100 text-sm">총 매출</div>
              <div className="text-2xl font-bold">₩{(resp.data?.totalRevenue || 0).toLocaleString()}</div>
            </div>
          </div>

          {/* SKU별 매출 차트 */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium mb-3">SKU별 매출 현황</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => fmtInt(typeof value === 'number' ? value : 0)} />
                  <Legend />
                  <Bar dataKey="매출" fill="#3b82f6" />
                  <Bar dataKey="수량" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SKU 상세 테이블 */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium mb-3">SKU별 상세 분석</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2">SKU</th>
                    <th className="text-left px-4 py-2">총 수량</th>
                    <th className="text-left px-4 py-2">총 매출</th>
                    <th className="text-left px-4 py-2">주문 건수</th>
                    <th className="text-left px-4 py-2">평균 단가</th>
                  </tr>
                </thead>
                <tbody>
                  {skuData.map((item: any) => (
                    <tr key={item.sku} className="border-b">
                      <td className="px-4 py-2 font-medium">{item.sku}</td>
                      <td className="px-4 py-2">{item.total_qty.toLocaleString()}</td>
                      <td className="px-4 py-2">₩{item.total_revenue.toFixed(2)}</td>
                      <td className="px-4 py-2">{item.order_count}건</td>
                      <td className="px-4 py-2">₩{item.avg_price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // 주문 통계 응답
    if (resp.type === 'orders') {
      const orderData = resp.data;
      const chartData = orderData?.orderTrend?.map((item: any) => ({
        name: item.month,
        주문수: item.orders,
        평균주문금액: item.avg_value
      })) || [];

      return (
        <div className="space-y-6">
          {/* LLM 분석 결과 */}
          {resp.analysis && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-blue-800 font-medium">AI 분석 결과</div>
              <div className="text-blue-600 text-sm mt-1">
                <strong>의도:</strong> {resp.analysis.intent} 
                <span className="ml-2 text-blue-500">(신뢰도: {(resp.analysis.confidence * 100).toFixed(0)}%)</span>
              </div>
              <div className="text-blue-600 text-sm mt-1">
                <strong>분석:</strong> {resp.analysis.reasoning}
              </div>
            </div>
          )}

          {/* AI 인사이트 */}
          {resp.insight && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-green-800 font-medium">AI 인사이트</div>
              <div className="text-green-700 mt-1">{resp.insight}</div>
            </div>
          )}

          {/* 요약 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow">
              <div className="text-blue-100 text-sm">총 주문 건수</div>
              <div className="text-2xl font-bold">{orderData?.totalOrders?.toLocaleString() || 0}건</div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg shadow">
              <div className="text-green-100 text-sm">평균 주문 금액</div>
              <div className="text-2xl font-bold">₩{(orderData?.avgOrderValue || 0).toFixed(2)}</div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg shadow">
              <div className="text-purple-100 text-sm">분석 기간</div>
              <div className="text-2xl font-bold">{orderData?.orderTrend?.length || 0}개월</div>
            </div>
          </div>

          {/* 주문 추이 차트 */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium mb-3">월별 주문 추이</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => fmtInt(typeof value === 'number' ? value : 0)} />
                  <Legend />
                  <Line type="monotone" dataKey="주문수" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="평균주문금액" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 최근 주문 테이블 */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium mb-3">최근 주문 현황</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2">주문일시</th>
                    <th className="text-left px-4 py-2">SKU</th>
                    <th className="text-left px-4 py-2">수량</th>
                    <th className="text-left px-4 py-2">주문 금액</th>
                  </tr>
                </thead>
                <tbody>
                  {(orderData?.recentOrders || []).map((item: any, idx: number) => (
                    <tr key={idx} className="border-b">
                      <td className="px-4 py-2">{new Date(item.date).toLocaleDateString('ko-KR')}</td>
                      <td className="px-4 py-2 font-medium">{item.sku}</td>
                      <td className="px-4 py-2">{item.qty}</td>
                      <td className="px-4 py-2">₩{item.value.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // 매출 분석 응답
    if (resp.type === 'sales') {
      const salesData = resp.data;
      const chartData = salesData?.salesTrend?.map((item: any) => ({
        name: item.month,
        매출: item.sales,
        주문수: item.orders,
        평균주문금액: item.avg_value
      })) || [];

      return (
        <div className="space-y-6">
          {/* LLM 분석 결과 */}
          {resp.analysis && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-blue-800 font-medium">AI 분석 결과</div>
              <div className="text-blue-600 text-sm mt-1">
                <strong>의도:</strong> {resp.analysis.intent} 
                <span className="ml-2 text-blue-500">(신뢰도: {(resp.analysis.confidence * 100).toFixed(0)}%)</span>
              </div>
              <div className="text-blue-600 text-sm mt-1">
                <strong>분석:</strong> {resp.analysis.reasoning}
              </div>
            </div>
          )}

          {/* AI 인사이트 */}
          {resp.insight && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-green-800 font-medium">AI 인사이트</div>
              <div className="text-green-700 mt-1">{resp.insight}</div>
            </div>
          )}

          {/* 요약 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow">
              <div className="text-blue-100 text-sm">총 매출</div>
              <div className="text-2xl font-bold">₩{(salesData?.totalSales || 0).toLocaleString()}</div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg shadow">
              <div className="text-green-100 text-sm">총 주문 건수</div>
              <div className="text-2xl font-bold">{(salesData?.totalOrders || 0).toLocaleString()}건</div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg shadow">
              <div className="text-purple-100 text-sm">평균 주문 금액</div>
              <div className="text-2xl font-bold">₩{(salesData?.avgOrderValue || 0).toFixed(2)}</div>
            </div>
          </div>

          {/* 매출 추이 차트 */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium mb-3">월별 매출 추이</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => fmtInt(typeof value === 'number' ? value : 0)} />
                  <Legend />
                  <Line type="monotone" dataKey="매출" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="주문수" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 최고 매출 월 정보 */}
          {salesData?.topMonth && (
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-medium mb-3">최고 매출 월</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-yellow-800">
                  <strong>{salesData.topMonth.month}</strong> - ₩{salesData.topMonth.sales.toLocaleString()}
                </div>
                <div className="text-yellow-600 text-sm">
                  주문 건수: {salesData.topMonth.orders}건
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (resp.type === 'dashboard') {
      const dash = resp.data || {} as any;
      return (
        <div className="space-y-6">
          {/* LLM 분석 결과 */}
          {resp.analysis && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-blue-800 font-medium">AI 분석 결과</div>
              <div className="text-blue-600 text-sm mt-1">
                <strong>의도:</strong> {resp.analysis.intent} 
                <span className="ml-2 text-blue-500">(신뢰도: {(resp.analysis.confidence * 100).toFixed(0)}%)</span>
              </div>
              <div className="text-blue-600 text-sm mt-1">
                <strong>분석:</strong> {resp.analysis.reasoning}
              </div>
            </div>
          )}

          {/* AI 인사이트 */}
          {resp.insight && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-green-800 font-medium">AI 인사이트</div>
              <div className="text-green-700 mt-1">{resp.insight}</div>
            </div>
          )}

          {/* 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow">
              <div className="text-blue-100 text-sm">총 매출</div>
              <div className="text-2xl font-bold">₩{(dash.totals?.totalSales || 0).toLocaleString()}</div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg shadow">
              <div className="text-green-100 text-sm">총 주문</div>
              <div className="text-2xl font-bold">{(dash.totals?.totalOrders || 0).toLocaleString()}건</div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg shadow">
              <div className="text-purple-100 text-sm">활성 SKU</div>
              <div className="text-2xl font-bold">{(dash.totals?.activeSkus || 0).toLocaleString()}개</div>
            </div>
          </div>

          {/* 월별 요약 */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium mb-3">월별 매출 요약</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2">월</th>
                    <th className="text-left px-4 py-2">총 매출</th>
                    <th className="text-left px-4 py-2">주문 건수</th>
                  </tr>
                </thead>
                <tbody>
                  {(dash.monthly || []).map((row: any, i: number) => (
                    <tr key={i} className="border-b">
                      <td className="px-4 py-2">{row.month}</td>
                      <td className="px-4 py-2">₩{Number(row.total_sales || 0).toLocaleString()}</td>
                      <td className="px-4 py-2">{Number(row.total_orders || 0).toLocaleString()}건</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SKU별 현황 */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium mb-3">SKU별 판매 현황</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2">SKU</th>
                    <th className="text-left px-4 py-2">총 판매량</th>
                    <th className="text-left px-4 py-2">총 매출</th>
                    <th className="text-left px-4 py-2">평균 단가</th>
                  </tr>
                </thead>
                <tbody>
                  {(dash.skuOverview || []).map((r: any) => (
                    <tr key={r.sku} className="border-b">
                      <td className="px-4 py-2">{r.sku}</td>
                      <td className="px-4 py-2">{r.qty.toLocaleString()}</td>
                      <td className="px-4 py-2">₩{r.revenue.toFixed(2)}</td>
                      <td className="px-4 py-2">₩{r.avg_price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 최근 판매 */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium mb-3">최근 판매</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2">판매일시</th>
                    <th className="text-left px-4 py-2">SKU</th>
                    <th className="text-left px-4 py-2">수량</th>
                    <th className="text-left px-4 py-2">단가</th>
                    <th className="text-left px-4 py-2">총액</th>
                  </tr>
                </thead>
                <tbody>
                  {(dash.recent || []).map((item: any, idx: number) => (
                    <tr key={idx} className="border-b">
                      <td className="px-4 py-2">{new Date(item.sold_at).toLocaleDateString('ko-KR')}</td>
                      <td className="px-4 py-2">{item.sku}</td>
                      <td className="px-4 py-2">{item.qty}</td>
                      <td className="px-4 py-2">₩{Number(item.price).toFixed(2)}</td>
                      <td className="px-4 py-2 font-medium">₩{(item.qty * item.price).toFixed(2)}</td>
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
                  {key.includes('total') || key.includes('price') ? fmtKRW(Number(value) || 0) : fmtInt(Number(value) || 0)}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 재고 분석 응답
    if (resp.type === 'inventory') {
      const inventoryData = resp.data;
      const chartData = (inventoryData?.items || []).slice(0, 10).map((item: any) => ({
        name: item.product_name?.substring(0, 10) || item.barcode,
        수량: item.qty,
        바코드: item.barcode
      }));

      return (
        <div className="space-y-6">
          {/* LLM 분석 결과 */}
          {resp.analysis && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-blue-800 font-medium">AI 분석 결과</div>
              <div className="text-blue-600 text-sm mt-1">
                <strong>의도:</strong> {resp.analysis.intent} 
                <span className="ml-2 text-blue-500">(신뢰도: {(resp.analysis.confidence * 100).toFixed(0)}%)</span>
              </div>
              <div className="text-blue-600 text-sm mt-1">
                <strong>분석:</strong> {resp.analysis.reasoning}
              </div>
            </div>
          )}

          {/* AI 인사이트 */}
          {resp.insight && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-green-800 font-medium">AI 인사이트</div>
              <div className="text-green-700 mt-1">{resp.insight}</div>
            </div>
          )}

          {/* 요약 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow">
              <div className="text-blue-100 text-sm">총 상품 수</div>
              <div className="text-2xl font-bold">{inventoryData?.inventoryStats?.totalItems || 0}개</div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg shadow">
              <div className="text-green-100 text-sm">총 재고 수량</div>
              <div className="text-2xl font-bold">{inventoryData?.inventoryStats?.totalQuantity?.toLocaleString() || 0}개</div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg shadow">
              <div className="text-purple-100 text-sm">부족 재고</div>
              <div className="text-2xl font-bold">{inventoryData?.inventoryStats?.lowStockCount || 0}개</div>
            </div>
          </div>

          {/* 재고 현황 차트 */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium mb-3">상품별 재고 현황 (상위 10개)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => fmtInt(typeof value === 'number' ? value : 0)} />
                  <Legend />
                  <Bar dataKey="수량" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 재고 상세 테이블 */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium mb-3">재고 상세 현황</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2">바코드</th>
                    <th className="text-left px-4 py-2">상품명</th>
                    <th className="text-left px-4 py-2">현재 수량</th>
                    <th className="text-left px-4 py-2">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {(inventoryData?.items || []).map((item: any) => (
                    <tr key={item.barcode} className="border-b">
                      <td className="px-4 py-2 font-medium">{item.barcode}</td>
                      <td className="px-4 py-2">{item.product_name}</td>
                      <td className="px-4 py-2">{item.qty.toLocaleString()}</td>
                      <td className="px-4 py-2">
                        {item.qty === 0 ? (
                          <span className="text-red-600 font-medium">품절</span>
                        ) : item.qty < 10 ? (
                          <span className="text-yellow-600 font-medium">부족</span>
                        ) : (
                          <span className="text-green-600 font-medium">충분</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 부족 재고 알림 */}
          {inventoryData?.lowStockItems && inventoryData.lowStockItems.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium mb-3 text-yellow-800">⚠️ 부족 재고 알림</h3>
              <div className="space-y-2">
                {inventoryData.lowStockItems.slice(0, 5).map((item: any) => (
                  <div key={item.barcode} className="text-yellow-700">
                    <strong>{item.product_name}</strong> - 현재 {item.qty}개 (바코드: {item.barcode})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // 상품 분석 응답
    if (resp.type === 'products') {
      const productData = resp.data;
      const chartData = (productData?.topProducts || []).map((item: any) => ({
        name: item.product_name?.substring(0, 10) || item.barcode,
        수량: item.qty,
        바코드: item.barcode
      }));

      return (
        <div className="space-y-6">
          {/* LLM 분석 결과 */}
          {resp.analysis && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-blue-800 font-medium">AI 분석 결과</div>
              <div className="text-blue-600 text-sm mt-1">
                <strong>의도:</strong> {resp.analysis.intent} 
                <span className="ml-2 text-blue-500">(신뢰도: {(resp.analysis.confidence * 100).toFixed(0)}%)</span>
              </div>
              <div className="text-blue-600 text-sm mt-1">
                <strong>분석:</strong> {resp.analysis.reasoning}
              </div>
            </div>
          )}

          {/* AI 인사이트 */}
          {resp.insight && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-green-800 font-medium">AI 인사이트</div>
              <div className="text-green-700 mt-1">{resp.insight}</div>
            </div>
          )}

          {/* 요약 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow">
              <div className="text-blue-100 text-sm">총 상품 수</div>
              <div className="text-2xl font-bold">{productData?.productStats?.totalProducts?.toLocaleString() || 0}개</div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg shadow">
              <div className="text-green-100 text-sm">총 재고 수량</div>
              <div className="text-2xl font-bold">{productData?.productStats?.totalQuantity?.toLocaleString() || 0}개</div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg shadow">
              <div className="text-purple-100 text-sm">평균 수량</div>
              <div className="text-2xl font-bold">{Math.round(productData?.productStats?.averageQuantity || 0)}개</div>
            </div>
          </div>

          {/* 상품별 수량 차트 */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium mb-3">상품별 수량 순위 (상위 10개)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => fmtInt(typeof value === 'number' ? value : 0)} />
                  <Legend />
                  <Bar dataKey="수량" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 상품 순위 테이블 */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium mb-3">상품별 수량 순위</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2">순위</th>
                    <th className="text-left px-4 py-2">바코드</th>
                    <th className="text-left px-4 py-2">상품명</th>
                    <th className="text-left px-4 py-2">현재 수량</th>
                    <th className="text-left px-4 py-2">업데이트</th>
                  </tr>
                </thead>
                <tbody>
                  {(productData?.productRanking || []).map((item: any, idx: number) => (
                    <tr key={item.barcode} className="border-b">
                      <td className="px-4 py-2 font-medium">{idx + 1}</td>
                      <td className="px-4 py-2 font-medium">{item.barcode}</td>
                      <td className="px-4 py-2">{item.product_name}</td>
                      <td className="px-4 py-2 font-bold">{item.qty.toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {item.updated_at ? new Date(item.updated_at).toLocaleDateString('ko-KR') : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // 90일간 상품판매 추이 응답
    if (resp.type === 'sales_trend_90') {
      const trendData = resp.data;
      const chartData = trendData?.dailySales?.map((item: any) => ({
        name: item.date,
        매출: item.total_revenue || 0,
        판매량: item.total_qty || 0,
        주문수: item.order_count || 0
      })) || [];

      return (
        <div className="space-y-6">
          {/* LLM 분석 결과 */}
          {resp.analysis && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-blue-800 font-medium">AI 분석 결과</div>
              <div className="text-blue-600 text-sm mt-1">
                <strong>의도:</strong> {resp.analysis.intent} 
                <span className="ml-2 text-blue-500">(신뢰도: {(resp.analysis.confidence * 100).toFixed(0)}%)</span>
              </div>
              <div className="text-blue-600 text-sm mt-1">
                <strong>분석:</strong> {resp.analysis.reasoning}
              </div>
            </div>
          )}

          {/* AI 인사이트 */}
          {resp.insight && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-green-800 font-medium">AI 인사이트</div>
              <div className="text-green-700 mt-1">{resp.insight}</div>
            </div>
          )}

          {/* 요약 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow">
              <div className="text-blue-100 text-sm">90일 총 매출</div>
              <div className="text-2xl font-bold">₩{(trendData?.totalRevenue || 0).toLocaleString()}</div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg shadow">
              <div className="text-green-100 text-sm">90일 총 판매량</div>
              <div className="text-2xl font-bold">{trendData?.totalQty || 0}개</div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg shadow">
              <div className="text-purple-100 text-sm">평균 일 매출</div>
              <div className="text-2xl font-bold">₩{Math.round((trendData?.avgDailyRevenue || 0)).toLocaleString()}</div>
            </div>
          </div>

          {/* 90일간 매출 추이 차트 */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium mb-3">90일간 매출 추이</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => fmtInt(typeof value === 'number' ? value : 0)} />
                  <Legend />
                  <Line type="monotone" dataKey="매출" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="판매량" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 일별 상세 데이터 */}
          {trendData?.dailySales && trendData.dailySales.length > 0 && (
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-medium mb-3">일별 판매 상세 (최근 30일)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2">날짜</th>
                      <th className="text-left px-4 py-2">총 매출</th>
                      <th className="text-left px-4 py-2">총 판매량</th>
                      <th className="text-left px-4 py-2">주문 건수</th>
                      <th className="text-left px-4 py-2">평균 단가</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trendData.dailySales.slice(-30).map((item: any) => (
                      <tr key={item.date} className="border-b">
                        <td className="px-4 py-2 font-medium">{item.date}</td>
                        <td className="px-4 py-2">₩{(item.total_revenue || 0).toLocaleString()}</td>
                        <td className="px-4 py-2">{(item.total_qty || 0).toLocaleString()}개</td>
                        <td className="px-4 py-2">{item.order_count || 0}건</td>
                        <td className="px-4 py-2">₩{Math.round((item.total_revenue || 0) / (item.total_qty || 1)).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );
    }

    // 상위 5개 상품 응답
    if (resp.type === 'top_5_products') {
      const topData = resp.data;
      const chartData = topData?.topProducts?.map((item: any) => ({
        name: item.product_name?.substring(0, 20) + '...' || item.barcode,
        매출: item.total_revenue || 0,
        판매량: item.total_qty || 0,
        평균단가: item.avg_price || 0
      })) || [];

      return (
        <div className="space-y-6">
          {/* LLM 분석 결과 */}
          {resp.analysis && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-blue-800 font-medium">AI 분석 결과</div>
              <div className="text-blue-600 text-sm mt-1">
                <strong>의도:</strong> {resp.analysis.intent} 
                <span className="ml-2 text-blue-500">(신뢰도: {(resp.analysis.confidence * 100).toFixed(0)}%)</span>
              </div>
              <div className="text-blue-600 text-sm mt-1">
                <strong>분석:</strong> {resp.analysis.reasoning}
              </div>
            </div>
          )}

          {/* AI 인사이트 */}
          {resp.insight && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-green-800 font-medium">AI 인사이트</div>
              <div className="text-green-700 mt-1">{resp.insight}</div>
            </div>
          )}

          {/* 요약 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow">
              <div className="text-blue-100 text-sm">TOP 5 총 매출</div>
              <div className="text-2xl font-bold">₩{(topData?.totalTopRevenue || 0).toLocaleString()}</div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg shadow">
              <div className="text-green-100 text-sm">TOP 5 총 판매량</div>
              <div className="text-2xl font-bold">{topData?.totalTopQty || 0}개</div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg shadow">
              <div className="text-purple-100 text-sm">1위 상품</div>
              <div className="text-2xl font-bold">{topData?.topProducts?.[0]?.product_name?.substring(0, 15) || 'N/A'}...</div>
            </div>
          </div>

          {/* TOP 5 상품 차트 */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium mb-3">TOP 5 상품 매출 현황</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => fmtInt(typeof value === 'number' ? value : 0)} />
                  <Legend />
                  <Bar dataKey="매출" fill="#3b82f6" />
                  <Bar dataKey="판매량" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TOP 5 상품 상세 테이블 */}
          {topData?.topProducts && topData.topProducts.length > 0 && (
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-medium mb-3">TOP 5 상품 상세</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2">순위</th>
                      <th className="text-left px-4 py-2">바코드</th>
                      <th className="text-left px-4 py-2">상품명</th>
                      <th className="text-left px-4 py-2">옵션</th>
                      <th className="text-left px-4 py-2">총 판매량</th>
                      <th className="text-left px-4 py-2">총 매출</th>
                      <th className="text-left px-4 py-2">평균 단가</th>
                      <th className="text-left px-4 py-2">현재 재고</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topData.topProducts.map((item: any, index: number) => (
                      <tr key={item.barcode} className="border-b">
                        <td className="px-4 py-2 font-bold text-lg">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}위`}
                        </td>
                        <td className="px-4 py-2 font-mono text-sm">{item.barcode}</td>
                        <td className="px-4 py-2 font-medium">{item.product_name}</td>
                        <td className="px-4 py-2">{item.option_name}</td>
                        <td className="px-4 py-2">{(item.total_qty || 0).toLocaleString()}개</td>
                        <td className="px-4 py-2">₩{(item.total_revenue || 0).toLocaleString()}</td>
                        <td className="px-4 py-2">₩{Math.round((item.total_revenue || 0) / (item.total_qty || 1)).toLocaleString()}</td>
                        <td className="px-4 py-2">{(item.current_stock || 0).toLocaleString()}개</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );
    }

    // 추세 분석 응답
    if (resp.type === 'trends') {
      const trendData = resp.data;
      const chartData = [
        { name: '높음 (50+)', 수량: trendData?.quantityDistribution?.high || 0, color: '#10b981' },
        { name: '보통 (10-49)', 수량: trendData?.quantityDistribution?.medium || 0, color: '#f59e0b' },
        { name: '낮음 (1-9)', 수량: trendData?.quantityDistribution?.low || 0, color: '#ef4444' },
        { name: '품절 (0)', 수량: trendData?.quantityDistribution?.zero || 0, color: '#6b7280' }
      ];

      return (
        <div className="space-y-6">
          {/* LLM 분석 결과 */}
          {resp.analysis && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-blue-800 font-medium">AI 분석 결과</div>
              <div className="text-blue-600 text-sm mt-1">
                <strong>의도:</strong> {resp.analysis.intent} 
                <span className="ml-2 text-blue-500">(신뢰도: {(resp.analysis.confidence * 100).toFixed(0)}%)</span>
              </div>
              <div className="text-blue-600 text-sm mt-1">
                <strong>분석:</strong> {resp.analysis.reasoning}
              </div>
            </div>
          )}

          {/* AI 인사이트 */}
          {resp.insight && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-green-800 font-medium">AI 인사이트</div>
              <div className="text-green-700 mt-1">{resp.insight}</div>
            </div>
          )}

          {/* 요약 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow">
              <div className="text-blue-100 text-sm">총 상품 수</div>
              <div className="text-2xl font-bold">{trendData?.totalItems?.toLocaleString() || 0}개</div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg shadow">
              <div className="text-green-100 text-sm">평균 수량</div>
              <div className="text-2xl font-bold">{Math.round(trendData?.averageQuantity || 0)}개</div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg shadow">
              <div className="text-purple-100 text-sm">높은 재고</div>
              <div className="text-2xl font-bold">{trendData?.quantityDistribution?.high || 0}개</div>
            </div>
          </div>

          {/* 수량 분포 차트 */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium mb-3">재고 수량별 분포</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => fmtInt(typeof value === 'number' ? value : 0)} />
                  <Legend />
                  <Bar dataKey="수량" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 최근 업데이트 */}
          {trendData?.recentUpdates && trendData.recentUpdates.length > 0 && (
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-medium mb-3">최근 업데이트된 상품</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2">바코드</th>
                      <th className="text-left px-4 py-2">상품명</th>
                      <th className="text-left px-4 py-2">현재 수량</th>
                      <th className="text-left px-4 py-2">업데이트</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trendData.recentUpdates.map((item: any) => (
                      <tr key={item.barcode} className="border-b">
                        <td className="px-4 py-2 font-medium">{item.barcode}</td>
                        <td className="px-4 py-2">{item.product_name}</td>
                        <td className="px-4 py-2">{item.qty.toLocaleString()}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {new Date(item.updated_at).toLocaleDateString('ko-KR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (resp.type === 'overview') {
      const overviewData = resp.data;
      const chartData = (overviewData?.topProducts || []).map((item: any) => ({
        name: item.product_name?.substring(0, 10) || item.barcode,
        수량: item.qty,
        바코드: item.barcode
      }));

      return (
        <div className="space-y-6">
          {/* LLM 분석 결과 */}
          {resp.analysis && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-blue-800 font-medium">AI 분석 결과</div>
              <div className="text-blue-600 text-sm mt-1">
                <strong>의도:</strong> {resp.analysis.intent} 
                <span className="ml-2 text-blue-500">(신뢰도: {(resp.analysis.confidence * 100).toFixed(0)}%)</span>
              </div>
              <div className="text-blue-600 text-sm mt-1">
                <strong>분석:</strong> {resp.analysis.reasoning}
              </div>
            </div>
          )}

          {/* AI 인사이트 */}
          {resp.insight && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-green-800 font-medium">AI 인사이트</div>
              <div className="text-green-700 mt-1">{resp.insight}</div>
            </div>
          )}

          {/* 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow">
              <div className="text-blue-100 text-sm">총 상품 수</div>
              <div className="text-2xl font-bold">{overviewData?.summaryStats?.totalProducts?.toLocaleString() || 0}개</div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg shadow">
              <div className="text-green-100 text-sm">총 재고 수량</div>
              <div className="text-2xl font-bold">{overviewData?.summaryStats?.totalQuantity?.toLocaleString() || 0}개</div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg shadow">
              <div className="text-purple-100 text-sm">평균 수량</div>
              <div className="text-2xl font-bold">{Math.round(overviewData?.summaryStats?.averageQuantity || 0)}개</div>
            </div>
          </div>

          {/* 추가 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-yellow-800 text-sm font-medium">부족 재고</div>
              <div className="text-yellow-900 text-2xl font-bold">{overviewData?.summaryStats?.lowStockItems || 0}개</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-800 text-sm font-medium">품절 상품</div>
              <div className="text-red-900 text-2xl font-bold">{overviewData?.summaryStats?.outOfStockItems || 0}개</div>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="text-indigo-800 text-sm font-medium">고유 바코드</div>
              <div className="text-indigo-900 text-2xl font-bold">{overviewData?.summaryStats?.uniqueBarcodes || 0}개</div>
            </div>
          </div>

          {/* 상위 상품 차트 */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium mb-3">상위 상품별 재고 현황</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => fmtInt(typeof value === 'number' ? value : 0)} />
                  <Legend />
                  <Bar dataKey="수량" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 전체 상품 목록 */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium mb-3">전체 상품 목록</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2">바코드</th>
                    <th className="text-left px-4 py-2">상품명</th>
                    <th className="text-left px-4 py-2">현재 수량</th>
                    <th className="text-left px-4 py-2">업데이트</th>
                  </tr>
                </thead>
                <tbody>
                  {(overviewData?.allItems || []).map((item: any) => (
                    <tr key={item.barcode} className="border-b">
                      <td className="px-4 py-2 font-medium">{item.barcode}</td>
                      <td className="px-4 py-2">{item.product_name}</td>
                      <td className="px-4 py-2">{item.qty.toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {item.updated_at ? new Date(item.updated_at).toLocaleDateString('ko-KR') : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
          <button 
            onClick={() => setQuestion('90일간 상품판매 추이')}
            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            📈 90일 판매추이
          </button>
          <button 
            onClick={() => setQuestion('상위 5개 많이 판매된 상품')}
            className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            🏆 TOP 5 상품
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

            {/* 예시 질문들 - 작동 안 하는 것들 제거하고 대시보드 관련으로 대폭 확장 */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-medium mb-3">예시 질문</h3>
              <div className="space-y-2 text-sm">
                {[
                  '대시보드 요약',
                  '전체 현황',
                  '매출 요약',
                  'SKU 현황',
                  '월별 요약',
                  '최근 판매',
                  '총 매출 확인',
                  '총 주문 건수',
                  '활성 SKU 수',
                  '월별 매출 현황',
                  '월별 주문 현황',
                  'SKU별 판매량',
                  'SKU별 매출',
                  'SKU별 평균 단가',
                  '최근 판매 상세',
                  '판매 추이',
                  '매출 통계',
                  '주문 통계',
                  '상품별 성과',
                  '월간 성과',
                  '전체 요약',
                  '현황 파악',
                  '데이터 요약',
                  '성과 분석',
                  '매출 분석',
                  '주문 분석',
                  'SKU 분석',
                  '월별 분석',
                  '전체 분석',
                  '현황 분석',
                  '90일간 상품판매 추이',
                  '상위 5개 많이 판매된 상품'
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


