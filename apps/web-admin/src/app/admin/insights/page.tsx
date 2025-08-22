'use client';
import { useState } from 'react';

type ActionId =
  | 'sales_overview' | 'spike_days' | 'trend_risers' | 'trend_decliners'
  | 'seasonality_weekday' | 'seasonality_month'
  | 'stockout_risk' | 'slow_movers' | 'abc_class' | 'price_outliers' | 'channel_mix';

type ApiRes = { action?: ActionId; answer_ko?: string; rows?: any[]; stats?: any; meta?: any; error?: string; };

export default function InsightsPage() {
  // 개발용 고정 테넌트 ID 자동 설정
  const defaultTenant = '84949b3c-2cb7-4c42-b9f9-d1f37d371e00';
  const [tenantId, setTenantId] = useState(defaultTenant);
  const [from, setFrom] = useState(() => new Date(Date.now()-29*86400000).toISOString().slice(0,10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0,10));
  const [out, setOut] = useState<ApiRes|null>(null);
  const [loading, setLoading] = useState(false);
  const [allResults, setAllResults] = useState<Record<string, ApiRes>>({});

  async function call(action: ActionId, params: Record<string, any> = {}) {
    if (!tenantId) return alert('tenant_id 입력');
    setLoading(true); setOut(null);
    const res = await fetch('/api/insights', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action, tenantId, params: { ...params, from, to } }),
    });
    const json: ApiRes = await res.json();
    setOut(json); 
    setAllResults(prev => ({ ...prev, [action]: json }));
    setLoading(false);
  }

  // 모든 인사이트 분석을 한 번에 실행
  async function runAllInsights() {
    if (!tenantId) return alert('tenant_id 입력');
    setLoading(true);
    setAllResults({});
    
    const actions: ActionId[] = [
      'sales_overview',
      'spike_days',
      'trend_risers',
      'trend_decliners',
      'seasonality_weekday',
      'seasonality_month',
      'stockout_risk',
      'slow_movers',
      'abc_class',
      'price_outliers',
      'channel_mix'
    ];

    const results: Record<string, ApiRes> = {};
    
    for (const action of actions) {
      try {
        const res = await fetch('/api/insights', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ 
            action, 
            tenantId, 
            params: { 
              from, 
              to,
              // 각 액션별 기본 파라미터
              ...(action === 'spike_days' && { minQty: 5, ratio: 2.5 }),
              ...(action === 'trend_risers' && { topN: 20 }),
              ...(action === 'trend_decliners' && { topN: 20 }),
              ...(action === 'stockout_risk' && { adsDays: 28, coverDays: 7 }),
              ...(action === 'slow_movers' && { minStock: 1, staleDays: 30 })
            } 
          }),
        });
        const json: ApiRes = await res.json();
        results[action] = json;
      } catch (error) {
        console.error(`Error in ${action}:`, error);
        results[action] = { error: 'Failed to execute' };
      }
    }
    
    setAllResults(results);
    setLoading(false);
  }

  return (
    <main style={{ padding: 24, display: 'grid', gap: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>판매 인사이트</h1>

      <section style={{ display: 'grid', gap: 8, maxWidth: 860 }}>
        <Row>
          <label style={{ minWidth: 84 }}>tenant_id</label>
          <input value={tenantId} onChange={e=>setTenantId(e.target.value)} placeholder="UUID"
            style={ipt}/>
        </Row>
        <Row>
          <label style={{ minWidth: 84 }}>기간</label>
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={ipt}/>
          <span>~</span>
          <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={ipt}/>
          <button onClick={() => call('sales_overview')}>요약</button>
        </Row>
        <Row>
          <button 
            onClick={runAllInsights}
            disabled={loading}
            style={{
              padding: '12px 24px',
              backgroundColor: loading ? '#ccc' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '전체 분석 중...' : '🚀 전체 인사이트 분석 실행'}
          </button>
          
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🔄 새로고침
          </button>
        </Row>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 12 }}>
        <Card title="판매 급증(스파이크)">
          <Row><label>최소수량</label><input id="minQty" type="number" defaultValue={5} style={ipt}/></Row>
          <Row><label>배율기준</label><input id="ratio" type="number" step="0.1" defaultValue={2.5} style={ipt}/></Row>
          <button onClick={() => call('spike_days', {
            minQty: Number((document.getElementById('minQty') as HTMLInputElement)?.value ?? 5),
            ratio: Number((document.getElementById('ratio') as HTMLInputElement)?.value ?? 2.5),
          })}>실행</button>
        </Card>

        <Card title="상승 추세 SKU">
          <Row><label>Top N</label><input id="riseN" type="number" defaultValue={20} style={ipt}/></Row>
          <button onClick={() => call('trend_risers', {
            topN: Number((document.getElementById('riseN') as HTMLInputElement)?.value ?? 20),
          })}>실행</button>
        </Card>

        <Card title="하락 추세 SKU">
          <Row><label>Top N</label><input id="declN" type="number" defaultValue={20} style={ipt}/></Row>
          <button onClick={() => call('trend_decliners', {
            topN: Number((document.getElementById('declN') as HTMLInputElement)?.value ?? 20),
          })}>실행</button>
        </Card>

        <Card title="요일별 패턴">
          <button onClick={() => call('seasonality_weekday')}>실행</button>
        </Card>

        <Card title="월별 패턴">
          <button onClick={() => call('seasonality_month')}>실행</button>
        </Card>

        <Card title="재고 소진 위험">
          <Row><label>ADS 일수</label><input id="adsDays" type="number" defaultValue={28} style={ipt}/></Row>
          <Row><label>커버 임계</label><input id="coverDays" type="number" defaultValue={7} style={ipt}/></Row>
          <button onClick={() => call('stockout_risk', {
            adsDays: Number((document.getElementById('adsDays') as HTMLInputElement)?.value ?? 28),
            coverDays: Number((document.getElementById('coverDays') as HTMLInputElement)?.value ?? 7),
          })}>실행</button>
        </Card>

        <Card title="슬로우 무버">
          <Row><label>최소재고</label><input id="minStock" type="number" defaultValue={1} style={ipt}/></Row>
          <Row><label>무판매 일수</label><input id="staleDays" type="number" defaultValue={30} style={ipt}/></Row>
          <button onClick={() => call('slow_movers', {
            minStock: Number((document.getElementById('minStock') as HTMLInputElement)?.value ?? 1),
            staleDays: Number((document.getElementById('staleDays') as HTMLInputElement)?.value ?? 30),
          })}>실행</button>
        </Card>

        <Card title="ABC 분류">
          <button onClick={() => call('abc_class')}>실행</button>
        </Card>

        <Card title="단가 이상치">
          <button onClick={() => call('price_outliers')}>실행</button>
        </Card>

        <Card title="채널 구성">
          <button onClick={() => call('channel_mix')}>실행</button>
        </Card>
      </section>

      <section style={{ minHeight: 140, padding: 12, borderRadius: 12, background: '#121212', color: '#eaeaea' }}>
        {loading ? <div>전체 분석 중…</div>
          : Object.keys(allResults).length > 0 ? (
            <div style={{ display: 'grid', gap: 16 }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                📊 전체 인사이트 분석 결과
              </h3>
              {Object.entries(allResults).map(([action, result]) => (
                <div key={action} style={{ border: '1px solid #333', borderRadius: '8px', padding: '16px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#10b981' }}>
                    {getActionTitle(action as ActionId)}
                  </h4>
                  {result?.error ? (
                    <pre style={{ color: '#ff6b6b' }}>{result.error}</pre>
                  ) : (
                    <ResultView res={result} />
                  )}
                </div>
              ))}
            </div>
          ) : out?.error ? (
            <pre style={{ color: '#ff6b6b' }}>{out.error}</pre>
          ) : out ? (
            <ResultView res={out} />
          ) : (
            <div>🚀 "전체 인사이트 분석 실행" 버튼을 눌러 모든 분석을 한 번에 실행하세요!</div>
          )}
      </section>
    </main>
  );
}

function ResultView({ res }: { res: ApiRes }) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {res.answer_ko ? <div style={{ padding: 8, borderRadius: 8, background: '#0f1a0f' }}>{res.answer_ko}</div> : null}
      {res.stats ? <KV obj={res.stats}/> : null}
      {Array.isArray(res.rows) ? <Table rows={res.rows}/> : null}
      {res.meta ? <small style={{ opacity: 0.7 }}>meta: {JSON.stringify(res.meta)}</small> : null}
    </div>
  );
}

function Table({ rows }: { rows: any[] }) {
  if (!rows?.length) return <div>행이 없습니다</div>;
  const cols = Object.keys(rows[0]);
  
  // 요일별 패턴 특별 처리
  const isWeekdayPattern = cols.includes('weekday') && cols.includes('units') && cols.includes('revenue');
  
  return (
    <div style={{ overflow: 'auto', maxHeight: 520 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {cols.map(c => {
              let displayName = c;
              if (c === 'weekday') displayName = '요일';
              else if (c === 'units') displayName = '판매수량';
              else if (c === 'revenue') displayName = '매출액';
              return <th key={c} style={thtd}>{displayName}</th>;
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {cols.map(c => {
                let displayValue = r[c] ?? '';
                
                // 요일별 패턴 특별 처리
                if (c === 'weekday' && isWeekdayPattern) {
                  const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
                  displayValue = weekdays[Number(displayValue)] || displayValue;
                }
                // 매출액 KRW 포맷팅
                else if (c === 'revenue' && typeof displayValue === 'number') {
                  displayValue = `${Math.round(displayValue).toLocaleString()}원`;
                }
                // 수량 천 단위 구분자
                else if (c === 'units' && typeof displayValue === 'number') {
                  displayValue = displayValue.toLocaleString();
                }
                
                return <td key={c} style={thtd}>{String(displayValue)}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KV({ obj }: { obj: any }) {
  const rows = Object.entries(obj);
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
      {rows.map(([k,v]) => (
        <div key={k} style={{ padding:10, borderRadius:10, background:'#202020', minWidth:160 }}>
          <div style={{ opacity:0.7, fontSize:12 }}>{k}</div>
          <div style={{ fontWeight:700 }}>{String(v)}</div>
        </div>
      ))}
    </div>
  );
}

function Card({ title, children }: any) {
  return <div style={{ padding: 12, borderRadius: 12, background: '#1b1b1b', color: '#eaeaea', display: 'grid', gap: 8 }}>
    <strong>{title}</strong><div style={{ display:'grid', gap:8 }}>{children}</div></div>;
}

function Row({ children }: any) { return <div style={{ display:'flex', gap:8, alignItems:'center' }}>{children}</div>; }

// 액션별 한국어 제목
function getActionTitle(action: ActionId): string {
  const titles: Record<ActionId, string> = {
    'sales_overview': '📈 판매 개요',
    'spike_days': '🚀 판매 급증 (스파이크)',
    'trend_risers': '📈 상승 추세 SKU',
    'trend_decliners': '📉 하락 추세 SKU',
    'seasonality_weekday': '📅 요일별 패턴',
    'seasonality_month': '📅 월별 패턴',
    'stockout_risk': '⚠️ 재고 소진 위험',
    'slow_movers': '🐌 슬로우 무버',
    'abc_class': '🏆 ABC 분류',
    'price_outliers': '🔍 단가 이상치',
    'channel_mix': '🛍️ 채널 구성'
  };
  return titles[action] || action;
}

const ipt: React.CSSProperties = { padding:8, borderRadius:8, border:'1px solid #444', background:'#111', color:'#eee' };
const thtd: React.CSSProperties = { textAlign:'left', borderBottom:'1px solid #222', padding:'6px 8px' };
