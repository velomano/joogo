import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || '2024-01-01';
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0];

    console.log('Inventory Value API called with params:', { from, to });

    // Mock 데이터 생성 (실제로는 Supabase에서 조회)
    const mockData = [
      {
        category: '의류',
        totalValue: 125000000,
        totalQuantity: 2500,
        avgUnitCost: 50000,
        turnoverRate: 3.2,
        valueShare: 45.2,
        growthRate: 12.5
      },
      {
        category: '신발',
        totalValue: 85000000,
        totalQuantity: 1200,
        avgUnitCost: 70833,
        turnoverRate: 2.8,
        valueShare: 30.7,
        growthRate: 8.3
      },
      {
        category: '액세서리',
        totalValue: 45000000,
        totalQuantity: 1800,
        avgUnitCost: 25000,
        turnoverRate: 4.1,
        valueShare: 16.2,
        growthRate: 15.7
      },
      {
        category: '가방',
        totalValue: 22000000,
        totalQuantity: 400,
        avgUnitCost: 55000,
        turnoverRate: 2.1,
        valueShare: 7.9,
        growthRate: 5.2
      },
      {
        category: '시계',
        totalValue: 18000000,
        totalQuantity: 200,
        avgUnitCost: 90000,
        turnoverRate: 1.8,
        valueShare: 6.5,
        growthRate: 3.1
      },
      {
        category: '모자',
        totalValue: 15000000,
        totalQuantity: 600,
        avgUnitCost: 25000,
        turnoverRate: 3.5,
        valueShare: 5.4,
        growthRate: 9.8
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockData,
      total: mockData.length
    });

  } catch (error) {
    console.error('Inventory Value API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch inventory value data',
        data: []
      },
      { status: 500 }
    );
  }
}
