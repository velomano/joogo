"use client";

import { useSales } from "@/hooks/useSales";

export default function SalesChart() {
  const { data, isLoading, error } = useSales();

  if (isLoading) return (
    <div className="panel" style={{ padding: '20px', textAlign: 'center' }}>
      <div className="muted">데이터를 불러오는 중...</div>
    </div>
  );
  
  if (error) return (
    <div className="panel" style={{ padding: '20px', textAlign: 'center' }}>
      <div style={{ color: '#dc2626' }}>에러: {String(error)}</div>
    </div>
  );

  // data = [{ ts: "2025-09-10", value: 123 }, ...]
  return (
    <div className="panel">
      <div className="panel-header">
        <h3>매출 데이터</h3>
        <div className="muted">총 {data?.length || 0}개 데이터</div>
      </div>
      <div className="panel-content">
        <div style={{ 
          backgroundColor: '#f9fafb', 
          border: '1px solid #e5e7eb', 
          borderRadius: '4px', 
          padding: '12px',
          fontSize: '12px',
          fontFamily: 'monospace',
          maxHeight: '400px',
          overflow: 'auto'
        }}>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
        {/* 실제 차트 라이브러리로 대체 */}
      </div>
    </div>
  );
}
