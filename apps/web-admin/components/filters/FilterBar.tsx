"use client";

import { useFilters } from "@/hooks/useFilters";

export default function FilterBar() {
  const { from, to, granularity, setRange, setGranularity, preset } = useFilters();

  return (
    <div>
      {/* 수동 날짜 설정 */}
      <div style={{ marginBottom: '12px' }}>
        <div className="muted" style={{ marginBottom: '6px' }}>수동 설정</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="date"
            value={from}
            onChange={(e) => setRange({ from: e.target.value })}
            style={{ 
              padding: '4px 8px', 
              border: '1px solid #d1d5db', 
              borderRadius: '4px',
              fontSize: '12px'
            }}
          />
          <span className="muted">~</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setRange({ to: e.target.value })}
            style={{ 
              padding: '4px 8px', 
              border: '1px solid #d1d5db', 
              borderRadius: '4px',
              fontSize: '12px'
            }}
          />
        </div>
      </div>

      {/* 빠른 선택 버튼 */}
      <div style={{ marginBottom: '12px' }}>
        <div className="muted" style={{ marginBottom: '6px' }}>빠른 선택</div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => preset.lastNDays(7)}  
            className="btn"
            style={{ 
              fontSize: '11px', 
              padding: '4px 8px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              color: '#374151',
              borderRadius: '4px',
              cursor: 'pointer',
              margin: '2px'
            }}
          >
            1주일
          </button>
          <button 
            onClick={() => preset.lastNDays(30)} 
            className="btn"
            style={{ 
              fontSize: '11px', 
              padding: '4px 8px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              color: '#374151',
              borderRadius: '4px',
              cursor: 'pointer',
              margin: '2px'
            }}
          >
            1개월
          </button>
          <button 
            onClick={() => preset.thisMonth()}   
            className="btn"
            style={{ 
              fontSize: '11px', 
              padding: '4px 8px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              color: '#374151',
              borderRadius: '4px',
              cursor: 'pointer',
              margin: '2px'
            }}
          >
            이번달
          </button>
          <button 
            onClick={() => preset.ytd()}         
            className="btn"
            style={{ 
              fontSize: '11px', 
              padding: '4px 8px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              color: '#374151',
              borderRadius: '4px',
              cursor: 'pointer',
              margin: '2px'
            }}
          >
            YTD
          </button>
        </div>
      </div>

      {/* 세분화 옵션 */}
      <div>
        <div className="muted" style={{ marginBottom: '6px' }}>세분화</div>
        <select
          value={granularity}
          onChange={(e) => setGranularity(e.target.value as any)}
          style={{ 
            padding: '4px 8px', 
            border: '1px solid #d1d5db', 
            borderRadius: '4px',
            fontSize: '12px',
            width: '100%'
          }}
        >
          <option value="day">일별</option>
          <option value="week">주별</option>
          <option value="month">월별</option>
        </select>
      </div>
    </div>
  );
}
