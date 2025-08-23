'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../../components/ui/table';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { fmtKRW, fmtInt } from '../../../lib/format';

// 95개 컬럼의 새로운 데이터 구조에 맞는 인터페이스
interface Product {
  id: number;
  tenant_id: string;
  상품코드: string;
  상품명: string;
  상품분류: string;
  브랜드: string;
  공급업체: string;
  현재고: number;
  주문수: number;
  발송수: number;
  판매가: number;
  원가: number;
  품절여부: string;
  옵션내용: string;
  // 일별 데이터 컬럼들 (63개)
  [key: string]: any; // 동적 컬럼 지원
}

interface DailySales {
  id: number;
  tenant_id: string;
  product_id: number;
  date: string;
  daily_qty: number;
  daily_revenue: number;
}

interface SalesAnalytics {
  totalProducts: number;
  totalDailyRecords: number;
  latestUpdate: string;
  sampleProducts: Product[];
  categoryStats: { [key: string]: number };
  supplierStats: { [key: string]: number };
}

export default function SalesAnalysisPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductDetail, setShowProductDetail] = useState(false);

  // 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 판매 분석 데이터 로드
      const response = await fetch('/api/sales-analysis?tenant_id=default');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
        setProducts(data.sampleProducts || []);
      }
      
      // 일별 판매 데이터 로드 (최근 30일)
      const dailyResponse = await fetch('/api/sales-analysis/daily?tenant_id=default&days=30');
      if (dailyResponse.ok) {
        const dailyData = await dailyResponse.json();
        setDailySales(dailyData);
      }
      
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 상품 목록
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.상품명.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.상품코드.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.상품분류 === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 상품 상세보기
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setShowProductDetail(true);
  };

  // 상세보기 닫기
  const closeProductDetail = () => {
    setShowProductDetail(false);
    setSelectedProduct(null);
  };

  // 일별 데이터 추출 (동적 컬럼에서)
  const getDailyData = (product: Product) => {
    const dailyData = [];
    for (let i = 1; i <= 63; i++) {
      const dateKey = `2024-01-${String(i).padStart(2, '0')}`;
      const qtyKey = `일${i}`;
      if (product[qtyKey] !== undefined && product[qtyKey] > 0) {
        dailyData.push({
          date: dateKey,
          qty: product[qtyKey],
          revenue: product[qtyKey] * (product.판매가 || 0)
        });
      }
    }
    return dailyData;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">판매 분석 대시보드</h1>
        <Button onClick={loadData} variant="outline">
          새로고침
        </Button>
      </div>

      {/* 요약 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 상품 수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalProducts || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 일별 기록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalDailyRecords || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최근 업데이트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {analytics?.latestUpdate ? new Date(analytics.latestUpdate).toLocaleDateString() : 'N/A'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">필터된 상품</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredProducts.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardHeader>
          <CardTitle>필터 및 검색</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">상품명/코드 검색</Label>
              <Input
                id="search"
                placeholder="상품명 또는 상품코드로 검색..."
                value={searchTerm}
                                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="category">상품 분류</Label>
              <select
                id="category"
                className="w-full p-2 border rounded-md"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">전체 분류</option>
                {analytics?.categoryStats && Object.keys(analytics.categoryStats).map(category => (
                  <option key={category} value={category}>
                    {category} ({analytics.categoryStats[category]})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 상품 목록 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>상품 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>상품코드</TableHead>
                  <TableHead>상품명</TableHead>
                  <TableHead>상품분류</TableHead>
                  <TableHead>현재고</TableHead>
                  <TableHead>판매가</TableHead>
                  <TableHead>원가</TableHead>
                  <TableHead>품절여부</TableHead>
                  <TableHead>액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.slice(0, 20).map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.상품코드}</TableCell>
                    <TableCell>{product.상품명}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product.상품분류}</Badge>
                    </TableCell>
                    <TableCell>{fmtInt(product.현재고)}</TableCell>
                    <TableCell>{fmtKRW(product.판매가)}</TableCell>
                    <TableCell>{fmtKRW(product.원가)}</TableCell>
                    <TableCell>
                      <Badge variant={product.품절여부 === 'Y' ? 'destructive' : 'default'}>
                        {product.품절여부 === 'Y' ? '품절' : '재고있음'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleProductClick(product)}
                      >
                        상세보기
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 상품 상세보기 모달 */}
      {showProductDetail && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">상품 상세정보</h2>
              <Button onClick={closeProductDetail} variant="outline">닫기</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 기본 정보 */}
              <div>
                <h3 className="text-lg font-semibold mb-3">기본 정보</h3>
                <div className="space-y-2">
                  <div><strong>상품코드:</strong> {selectedProduct.상품코드}</div>
                  <div><strong>상품명:</strong> {selectedProduct.상품명}</div>
                  <div><strong>상품분류:</strong> {selectedProduct.상품분류}</div>
                  <div><strong>브랜드:</strong> {selectedProduct.브랜드}</div>
                  <div><strong>공급업체:</strong> {selectedProduct.공급업체}</div>
                  <div><strong>현재고:</strong> {fmtInt(selectedProduct.현재고)}</div>
                  <div><strong>판매가:</strong> {fmtKRW(selectedProduct.판매가)}</div>
                  <div><strong>원가:</strong> {fmtKRW(selectedProduct.원가)}</div>
                </div>
              </div>
              
              {/* 일별 판매 데이터 차트 */}
              <div>
                <h3 className="text-lg font-semibold mb-3">일별 판매 추이</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={getDailyData(selectedProduct)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="qty" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* 모든 컬럼 데이터 표시 */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">전체 데이터</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>컬럼명</TableHead>
                      <TableHead>값</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(selectedProduct).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell className="font-medium">{key}</TableCell>
                        <TableCell>{String(value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
