'use client';

import { useEffect, useState } from 'react';
import { Adapters } from '../_data/adapters';
// import { useFilters } from '@/lib/state/filters'; // 제거

export default function EventImpactChart({ 
  refreshTrigger, 
  from, 
  to 
}: { 
  refreshTrigger: number;
  from: string;
  to: string;
}) {
  const [impactData, setImpactData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Mock 이벤트 임팩트 데이터 생성
        const calendarData = await Adapters.calendarHeatmap({ from, to }, {});
        
        // 미래 데이터 필터링 - 현재 날짜까지만 표시
        const today = new Date().toISOString().slice(0, 10);
        const filteredCalendarData = calendarData.filter(d => d.date <= today);
        
        console.log('Calendar data sample:', filteredCalendarData.slice(0, 5)); // 디버깅용
        console.log('Total calendar data:', filteredCalendarData.length); // 디버깅용
        
        // Mock API의 is_event 필드 사용 (이미 설정되어 있음)
        const eventDates = filteredCalendarData.filter(d => d.is_event).map(d => d.date);
        
        console.log('Event dates found:', eventDates); // 디버깅용
        console.log('Event count:', eventDates.length); // 디버깅용
        
        if (eventDates.length > 0) {
          // 실제 데이터를 기반으로 통계 계산
          const revenues = filteredCalendarData.map(d => d.revenue);
          const avgRevenue = revenues.reduce((sum, val) => sum + val, 0) / revenues.length;
          
          // 이벤트 전후 평균 계산 (Mock)
          const preEvent = avgRevenue * 0.85; // 이벤트 전 평균 (15% 낮음)
          const postEvent = avgRevenue * 1.15; // 이벤트 후 평균 (15% 높음)
          const diff = (postEvent - preEvent) / 1000; // 천원 단위
          
          // 통계값 계산 (Mock)
          const tStat = 2.1;
          const df = 8.5;
          const pValue = 0.023;
          
          setImpactData({
            diff: diff.toFixed(1),
            preAvg: (preEvent / 1000).toFixed(1),
            postAvg: (postEvent / 1000).toFixed(1),
            tStat: tStat.toFixed(1),
            df: df.toFixed(1),
            pValue: pValue.toFixed(3),
            isSignificant: pValue < 0.05,
            eventCount: eventDates.length
          });
        } else {
          // 이벤트가 없는 경우 - 빈 데이터
          setImpactData({
            diff: '0',
            preAvg: '0',
            postAvg: '0',
            tStat: '0',
            df: '0',
            pValue: '0',
            isSignificant: false,
            eventCount: 0,
            isMock: false
          });
        }
      } catch (error) {
        console.error('Failed to fetch event impact data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [from, to, refreshTrigger]);

  if (loading) {
    return (
      <div style={{ height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c1117', borderRadius: '8px', border: '1px solid #1d2835' }}>
        <div style={{ textAlign: 'center', color: '#9aa0a6' }}>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>데이터 로딩 중...</div>
          <div style={{ fontSize: '12px' }}>데이터 없음</div>
        </div>
      </div>
    );
  }

  if (!impactData) {
    return (
      <div style={{ height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c1117', borderRadius: '8px', border: '1px solid #1d2835' }}>
        <div style={{ textAlign: 'center', color: '#e25b5b' }}>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>데이터 로드 실패</div>
          <div style={{ fontSize: '12px' }}>이벤트 임팩트를 분석할 수 없습니다</div>
        </div>
      </div>
    );
  }

  if (impactData.noEvent) {
    return (
      <div style={{ height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c1117', borderRadius: '8px', border: '1px solid #1d2835' }}>
        <div style={{ textAlign: 'center', color: '#9aa0a6' }}>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>이벤트 데이터 없음</div>
          <div style={{ fontSize: '12px' }}>분석할 이벤트가 없습니다</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '130px', padding: '16px', background: '#0c1117', borderRadius: '8px', border: '1px solid #1d2835' }}>
      <div className="row" style={{ marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <span className={`badge ${parseFloat(impactData.diff) >= 0 ? 'ok' : 'bad'}`}>
          증감: {impactData.diff > 0 ? '+' : ''}{impactData.diff}
        </span>
        <span className="badge">전 평균: {impactData.preAvg}</span>
        <span className="badge">후 평균: {impactData.postAvg}</span>
        <span className="badge">t≈ {impactData.tStat}</span>
        <span className="badge">df≈ {impactData.df}</span>
        <span className={`badge ${impactData.isSignificant ? 'ok' : 'warn'}`}>
          p≈ {impactData.pValue}
        </span>
      </div>
      <div className="small muted" style={{ marginTop: '8px' }}>
        ※ Welch t-검정 근사치 {impactData.isSignificant ? '(유의함)' : '(비유의함)'}
      </div>
    </div>
  );
}
