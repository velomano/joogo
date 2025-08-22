'use client';
import { useState } from 'react';

type UploadResult = {
  ok: boolean;
  total: number;
  inserted: { sales: number; items: number };
  skipped: number;
  errors: Array<{ row: number; message: string }>;
  preview: any[];
};

export default function DataManagementPage() {
  // 개발용 고정 테넌트 ID 자동 설정
  const defaultTenant = '84949b3c-2cb7-4c42-b9f9-d1f37d371e00';
  const [tenantId, setTenantId] = useState(defaultTenant);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) {
      setError('CSV 파일을 선택해주세요');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('tenantId', tenantId.trim());
      formData.append('file', file);

      const response = await fetch('/api/upload/unified', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '업로드 실패');
      }

      setResult(data);
      setToast('통합 데이터 업로드 성공!');
    } catch (err: any) {
      setError(err.message || '업로드 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('정말로 모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    setLoading(true);
    try {
      // items 테이블 초기화
      const itemsResponse = await fetch('/api/items/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId }),
      });

      // sales 테이블 초기화
      const salesResponse = await fetch('/api/sales/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId }),
      });

      if (itemsResponse.ok && salesResponse.ok) {
        setToast('데이터 초기화 완료!');
        setResult(null);
      } else {
        throw new Error('데이터 초기화 실패');
      }
    } catch (err: any) {
      setError(err.message || '데이터 초기화 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded shadow">
          {toast}
        </div>
      )}
      
      <h1 className="text-2xl font-semibold">🚀 통합 데이터 관리</h1>
      
      {/* CSV 형식 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">📋 CSV 형식 안내</h3>
                    <div className="text-sm text-blue-700 space-y-1">
              <div><strong>필수 헤더:</strong> tenant_id, sale_date, barcode, 상품명, 옵션명, sale_qty, unit_price_krw, revenue_krw, channel, stock_qty</div>
              <div><strong>판매행:</strong> sale_qty &gt; 0 (sales 테이블에 저장)</div>
              <div><strong>스냅샷행:</strong> sale_qty = 0 AND channel = snapshot (items 테이블에 저장)</div>
              <div><strong>인코딩:</strong> UTF-8 또는 UTF-8 with BOM 권장</div>
            </div>
      </div>

      {/* 업로드 폼 */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">📤 데이터 업로드</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tenant ID:</label>
            <input
              type="text"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="UUID 입력"
              className="w-full px-3 py-2 border rounded-md"
            />
            <small className="text-green-600 text-sm">💡 기본값이 자동 설정되었습니다. 필요시 수정하세요.</small>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">CSV 파일:</label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={loading || !file}
              className="px-6 py-2 bg-green-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '업로드 중...' : '🚀 업로드 시작'}
            </button>
            
            <button
              onClick={handleReset}
              disabled={loading}
              className="px-6 py-2 bg-red-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '처리 중...' : '🗑️ 데이터 초기화'}
            </button>
            
            <a 
              href="/admin/items" 
              className="px-6 py-2 bg-blue-600 text-white rounded-md text-center"
            >
              📋 목록 보기
            </a>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 mb-2">❌ 오류</h3>
          <div className="text-red-700">{error}</div>
        </div>
      )}

      {/* 결과 표시 */}
      {result && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">📊 업로드 결과</h3>
          <div className="space-y-4">
            {/* 요약 통계 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{result.total}</div>
                <div className="text-sm text-blue-600">총 행 수</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{result.inserted.sales}</div>
                <div className="text-sm text-green-600">판매 데이터</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">{result.inserted.items}</div>
                <div className="text-sm text-orange-600">재고 데이터</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-600">{result.skipped}</div>
                <div className="text-sm text-gray-600">건너뛴 행</div>
              </div>
            </div>

            {/* 에러 목록 */}
            {result.errors.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-600 mb-2">⚠️ 에러 목록 (최대 50개)</h4>
                <div className="max-h-60 overflow-auto bg-red-50 rounded-lg p-3">
                  {result.errors.slice(0, 50).map((err, idx) => (
                    <div key={idx} className="text-sm text-red-700 py-1 border-b border-red-100 last:border-b-0">
                      <strong>행 {err.row}:</strong> {err.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 미리보기 */}
            {result.preview.length > 0 && (
              <div>
                <h4 className="font-semibold text-green-600 mb-2">👀 데이터 미리보기 (상위 5행)</h4>
                <div className="overflow-auto max-h-80">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        {Object.keys(result.preview[0]).map((key) => (
                          <th key={key} className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.preview.map((row, idx) => (
                        <tr key={idx}>
                          {Object.values(row).map((value, valIdx) => (
                            <td key={valIdx} className="border border-gray-300 px-3 py-2 text-sm">
                              {String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


