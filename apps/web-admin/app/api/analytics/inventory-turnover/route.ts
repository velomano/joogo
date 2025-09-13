import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    console.log('Inventory Turnover API called with search:', search);

    // Mock 데이터 생성 - 대규모 재고 데이터
    const generateMockData = () => {
      const categories = ['TOPS', 'BOTTOMS', 'SHOES', 'ACCESSORIES', 'OUTERWEAR'];
      const products = [];
      
      for (let i = 1; i <= 100; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const currentStock = Math.floor(Math.random() * 500) + 10;
        const avgDailySales = Math.random() * 20 + 1;
        const turnoverRate = avgDailySales * 30 / currentStock;
        const daysOfSupply = Math.floor(currentStock / avgDailySales);
        const reorderPoint = Math.floor(currentStock * 0.3);
        
        let status = 'healthy';
        if (daysOfSupply < 3) status = 'critical';
        else if (daysOfSupply < 7) status = 'low';
        else if (daysOfSupply > 30) status = 'overstock';
        
        products.push({
          sku: `SKU${String(i).padStart(3, '0')}`,
          productName: `${category} 상품 ${i}번`,
          category: category,
          currentStock: currentStock,
          avgDailySales: Number(avgDailySales.toFixed(1)),
          turnoverRate: Number(turnoverRate.toFixed(1)),
          daysOfSupply: daysOfSupply,
          reorderPoint: reorderPoint,
          status: status
        });
      }
      
      return products.sort((a, b) => b.turnoverRate - a.turnoverRate);
    };
    
    const mockData = generateMockData();

    // 검색 로직
    let filteredData = mockData;
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredData = mockData.filter(item => 
        item.sku.toLowerCase().includes(searchTerm) ||
        item.productName.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm) ||
        // 빠른 필터 검색
        (searchTerm === 'low-stock' && item.status === 'low') ||
        (searchTerm === 'out-of-stock' && item.status === 'critical') ||
        (searchTerm === 'high-turnover' && item.turnoverRate > 4) ||
        (searchTerm === 'dead-stock' && item.turnoverRate < 2)
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredData,
      total: filteredData.length
    });

  } catch (error) {
    console.error('Inventory Turnover API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch inventory turnover data',
        data: []
      },
      { status: 500 }
    );
  }
}
