import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || '2024-01-01';
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0];
    const granularity = searchParams.get('granularity') || 'hour'; // hour, day, week, month
    
    console.log('Timeline Analytics API called with params:', { from, to, granularity });
    
    // 기간 계산
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Joogo 시스템 아키텍처 기반 시간대별 데이터
    // Salesreport 섹션의 Reports hourlysales, Financials dailysales 기반
    let timelineData = [];
    
    if (granularity === 'hour') {
      // 시간별 데이터 (최근 24시간)
      for (let i = 0; i < 24; i++) {
        const hour = i;
        const baseMultiplier = 0.3 + Math.sin((hour - 6) * Math.PI / 12) * 0.4; // 6시-18시 피크
        const isPeakHour = hour >= 10 && hour <= 14 || hour >= 19 && hour <= 21;
        
        timelineData.push({
          timestamp: `${hour.toString().padStart(2, '0')}:00`,
          hour: hour,
          revenue: Math.round(65000000 * daysDiff * baseMultiplier / 24),
          orders: Math.round(280 * daysDiff * baseMultiplier / 24),
          visitors: Math.round(1250 * daysDiff * baseMultiplier / 24),
          conversionRate: isPeakHour ? 4.2 + Math.random() * 0.8 : 2.1 + Math.random() * 0.6,
          avgOrderValue: 232142 + (isPeakHour ? 15000 : -5000),
          isPeakHour
        });
      }
    } else if (granularity === 'day') {
      // 일별 데이터
      for (let i = 0; i < daysDiff; i++) {
        const currentDate = new Date(fromDate);
        currentDate.setDate(fromDate.getDate() + i);
        const dayOfWeek = currentDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
        
        const baseMultiplier = isWeekend ? 0.8 : 1.2; // 평일이 더 높은 매출
        
        timelineData.push({
          timestamp: currentDate.toISOString().split('T')[0],
          date: currentDate.toISOString().split('T')[0],
          dayOfWeek: ['일', '월', '화', '수', '목', '금', '토'][dayOfWeek],
          revenue: Math.round(65000000 * baseMultiplier),
          orders: Math.round(280 * baseMultiplier),
          visitors: Math.round(1250 * baseMultiplier),
          conversionRate: isWeekend ? 3.1 : 3.8,
          avgOrderValue: 232142 + (isWeekend ? -10000 : 5000),
          isWeekend,
          isWeekday
        });
      }
    } else if (granularity === 'week') {
      // 주별 데이터 (최근 12주)
      for (let i = 0; i < 12; i++) {
        const weekStart = new Date(toDate);
        weekStart.setDate(toDate.getDate() - (11 - i) * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const weekMultiplier = 0.8 + Math.random() * 0.4; // 주간 변동
        
        timelineData.push({
          timestamp: `Week ${i + 1}`,
          weekStart: weekStart.toISOString().split('T')[0],
          weekEnd: weekEnd.toISOString().split('T')[0],
          revenue: Math.round(65000000 * 7 * weekMultiplier),
          orders: Math.round(280 * 7 * weekMultiplier),
          visitors: Math.round(1250 * 7 * weekMultiplier),
          conversionRate: 3.2 + Math.random() * 0.6,
          avgOrderValue: 232142 + Math.random() * 20000 - 10000
        });
      }
    } else if (granularity === 'month') {
      // 월별 데이터 (최근 12개월)
      for (let i = 0; i < 12; i++) {
        const monthDate = new Date(toDate);
        monthDate.setMonth(toDate.getMonth() - (11 - i));
        const monthName = monthDate.toLocaleString('ko-KR', { month: 'long' });
        const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
        
        const monthMultiplier = 0.7 + Math.random() * 0.6; // 월간 변동
        const isHolidayMonth = monthDate.getMonth() === 11 || monthDate.getMonth() === 0; // 12월, 1월
        
        timelineData.push({
          timestamp: monthName,
          month: monthDate.getMonth() + 1,
          year: monthDate.getFullYear(),
          revenue: Math.round(65000000 * daysInMonth * monthMultiplier),
          orders: Math.round(280 * daysInMonth * monthMultiplier),
          visitors: Math.round(1250 * daysInMonth * monthMultiplier),
          conversionRate: isHolidayMonth ? 4.1 : 3.3,
          avgOrderValue: 232142 + (isHolidayMonth ? 15000 : 0),
          isHolidayMonth
        });
      }
    }
    
    // 시간대별 성과 지표 계산
    const totalRevenue = timelineData.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = timelineData.reduce((sum, item) => sum + item.orders, 0);
    const totalVisitors = timelineData.reduce((sum, item) => sum + item.visitors, 0);
    
    const timelineAnalytics = {
      data: timelineData,
      summary: {
        totalRevenue,
        totalOrders,
        totalVisitors,
        avgRevenue: Math.round(totalRevenue / timelineData.length),
        avgOrders: Math.round(totalOrders / timelineData.length),
        avgVisitors: Math.round(totalVisitors / timelineData.length),
        avgConversionRate: (timelineData.reduce((sum, item) => sum + item.conversionRate, 0) / timelineData.length).toFixed(1),
        peakRevenue: Math.max(...timelineData.map(item => item.revenue)),
        peakOrders: Math.max(...timelineData.map(item => item.orders)),
        peakVisitors: Math.max(...timelineData.map(item => item.visitors))
      },
      insights: {
        bestPerformingTime: timelineData.reduce((max, item) => 
          item.revenue > max.revenue ? item : max
        ),
        worstPerformingTime: timelineData.reduce((min, item) => 
          item.revenue < min.revenue ? item : min
        ),
        trend: timelineData.length > 1 ? 
          (timelineData[timelineData.length - 1].revenue > timelineData[0].revenue ? 'up' : 'down') : 'stable'
      },
      period: {
        from,
        to,
        days: daysDiff,
        granularity
      }
    };
    
    console.log('Returning timeline analytics:', timelineAnalytics);
    return NextResponse.json(timelineAnalytics);
    
  } catch (error) {
    console.error('Timeline Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline analytics data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
