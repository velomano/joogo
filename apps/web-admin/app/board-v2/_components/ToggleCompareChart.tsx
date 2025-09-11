'use client';

import { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Adapters } from '../_data/adapters';
// import { useFilters } from '@/lib/state/filters'; // 제거

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function ToggleCompareChart({ 
  refreshTrigger, 
  from, 
  to 
}: { 
  refreshTrigger: number;
  from: string;
  to: string;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toggleMode, setToggleMode] = useState<'channel' | 'region' | 'campaign'>('channel');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const calendarData = await Adapters.calendarHeatmap({ from, to }, {});
        const channelRegionData = await Adapters.channelRegion({ from, to }, {});
        
        // 토글 모드에 따른 데이터 필터링
        let categories: string[] = [];
        let datasets: any[] = [];
        
        if (toggleMode === 'channel') {
          categories = ['web', 'app', 'mobile'];
        } else if (toggleMode === 'region') {
          categories = ['SEOUL', 'BUSAN', 'INCHEON'];
        } else {
          categories = ['AlwaysOn', 'PromoPush', 'Seasonal'];
        }
        
        const labels = calendarData.map(d => d.date);
        
        // 각 카테고리별 데이터 생성
        categories.forEach((category, index) => {
          const categoryData = labels.map(date => {
            // Mock 데이터: 각 카테고리별로 다른 패턴
            const baseValue = 20 + index * 5;
            const variation = Math.sin(new Date(date).getTime() / (1000 * 60 * 60 * 24)) * 5;
            return Math.max(0, baseValue + variation + Math.random() * 10 - 5);
          });
          
          const colors = ['#5aa2ff', '#2aa775', '#e0a400', '#e25b5b', '#9aa0a6'];
          datasets.push({
            label: category,
            data: categoryData,
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length] + '20',
            tension: 0.4,
            fill: false
          });
        });
        
        setData({
          labels,
          datasets
        });
      } catch (error) {
        console.error('Failed to fetch toggle compare data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [from, to, toggleMode, refreshTrigger]);

  // 토글 버튼 이벤트 핸들러
  useEffect(() => {
    const handleToggle = (mode: 'channel' | 'region' | 'campaign') => {
      setToggleMode(mode);
      
      // 버튼 활성화 상태 업데이트
      document.querySelectorAll('.toggle-group button').forEach(btn => {
        btn.classList.remove('active');
      });
      document.getElementById(`tg${mode.charAt(0).toUpperCase() + mode.slice(1)}`)?.classList.add('active');
    };

    const tgChannel = document.getElementById('tgChannel');
    const tgRegion = document.getElementById('tgRegion');
    const tgCampaign = document.getElementById('tgCampaign');

    if (tgChannel) tgChannel.onclick = () => handleToggle('channel');
    if (tgRegion) tgRegion.onclick = () => handleToggle('region');
    if (tgCampaign) tgCampaign.onclick = () => handleToggle('campaign');

    return () => {
      if (tgChannel) tgChannel.onclick = null;
      if (tgRegion) tgRegion.onclick = null;
      if (tgCampaign) tgCampaign.onclick = null;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c1117', borderRadius: '8px', border: '1px solid #1d2835' }}>
        <div style={{ textAlign: 'center', color: '#9aa0a6' }}>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>토글 비교 차트 로딩 중...</div>
          <div style={{ fontSize: '12px' }}>{toggleMode}별 데이터 분석 중</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c1117', borderRadius: '8px', border: '1px solid #1d2835' }}>
        <div style={{ textAlign: 'center', color: '#e25b5b' }}>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>데이터 로드 실패</div>
          <div style={{ fontSize: '12px' }}>차트를 표시할 수 없습니다</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '130px' }}>
      <Line
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top' as const,
              labels: {
                color: '#e7edf5',
                font: { size: 11 }
              }
            },
            tooltip: {
              backgroundColor: '#101725',
              titleColor: '#e7edf5',
              bodyColor: '#e7edf5',
              borderColor: '#1b2533',
              borderWidth: 1
            }
          },
          scales: {
            x: {
              ticks: { color: '#9aa0a6', font: { size: 10 } },
              grid: { color: '#1b2533' }
            },
            y: {
              beginAtZero: true,
              ticks: { 
                color: '#9aa0a6', 
                font: { size: 10 },
                callback: function(value) {
                  return `${value}개`;
                }
              },
              grid: { color: '#1b2533' }
            }
          }
        }}
      />
    </div>
  );
}
