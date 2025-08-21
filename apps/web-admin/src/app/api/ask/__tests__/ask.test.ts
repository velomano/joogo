import { NextRequest } from 'next/server';
import { POST } from '../route';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    rpc: jest.fn()
  }))
}));

describe('Ask API', () => {
  const mockSupabase = {
    rpc: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (require('@supabase/supabase-js').createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/ask', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  };

  describe('Intent Classification', () => {
    test('top_sku_days - "최근 30일 top 5 sku"', async () => {
      const mockData = [
        { sku: 'SKU-1001', total_sales: 100000, order_count: 5 },
        { sku: 'SKU-1002', total_sales: 80000, order_count: 4 }
      ];
      
      mockSupabase.rpc.mockResolvedValue({ data: mockData, error: null });

      const req = createRequest({
        question: '최근 30일 top 5 sku',
        tenant_id: 'test-tenant'
      });

      const response = await POST(req);
      const result = await response.json();

      expect(result.intent).toBe('top_sku_days');
      expect(result.type).toBe('chart');
      expect(result.params.days).toBe(30);
      expect(result.params.limit).toBe(5);
      expect(result.data).toEqual(mockData);
    });

    test('monthly_summary - "월별 매출 추세"', async () => {
      const mockData = [
        { month: '2024-01', total_sales: 500000, order_count: 25 },
        { month: '2024-02', total_sales: 600000, order_count: 30 }
      ];
      
      mockSupabase.rpc.mockResolvedValue({ data: mockData, error: null });

      const req = createRequest({
        question: '월별 매출 추세',
        tenant_id: 'test-tenant'
      });

      const response = await POST(req);
      const result = await response.json();

      expect(result.intent).toBe('monthly_summary');
      expect(result.type).toBe('chart');
      expect(result.data).toEqual(mockData);
    });

    test('annual_total - "올해 총매출"', async () => {
      const mockData = [
        { month: '2024-01', total_sales: 500000 },
        { month: '2024-02', total_sales: 600000 }
      ];
      
      mockSupabase.rpc.mockResolvedValue({ data: mockData, error: null });

      const req = createRequest({
        question: '올해 총매출',
        tenant_id: 'test-tenant'
      });

      const response = await POST(req);
      const result = await response.json();

      expect(result.intent).toBe('annual_total');
      expect(result.type).toBe('summary');
      expect(result.data.total).toBe(1100000);
      expect(result.data.currency).toBe('KRW');
    });

    test('mom_change - "전월 대비 변화"', async () => {
      const mockData = [
        { month: '2024-01', total_sales: 500000 },
        { month: '2024-02', total_sales: 600000 }
      ];
      
      mockSupabase.rpc.mockResolvedValue({ data: mockData, error: null });

      const req = createRequest({
        question: '전월 대비 변화',
        tenant_id: 'test-tenant'
      });

      const response = await POST(req);
      const result = await response.json();

      expect(result.intent).toBe('mom_change');
      expect(result.type).toBe('summary');
      expect(result.data.change).toBe(100000);
      expect(result.data.changePercent).toBe(20);
    });

    test('sku_trend - "SKU-1001 추세"', async () => {
      const mockData = [
        { sku: 'SKU-1001', total_price: 20000, qty: 2, order_date: '2024-01-15T00:00:00Z' },
        { sku: 'SKU-1001', total_price: 25000, qty: 3, order_date: '2024-01-20T00:00:00Z' }
      ];
      
      mockSupabase.rpc.mockResolvedValue({ data: mockData, error: null });

      const req = createRequest({
        question: 'SKU-1001 추세',
        tenant_id: 'test-tenant'
      });

      const response = await POST(req);
      const result = await response.json();

      expect(result.intent).toBe('sku_trend');
      expect(result.type).toBe('chart');
      expect(result.params.sku).toBe('SKU-1001');
      expect(result.data).toEqual(mockData);
    });

    test('summary - "매출 요약"', async () => {
      const mockData = [
        { order_id: 'order1', total_price: 20000, qty: 2 },
        { order_id: 'order2', total_price: 30000, qty: 3 }
      ];
      
      mockSupabase.rpc.mockResolvedValue({ data: mockData, error: null });

      const req = createRequest({
        question: '매출 요약',
        tenant_id: 'test-tenant'
      });

      const response = await POST(req);
      const result = await response.json();

      expect(result.intent).toBe('summary');
      expect(result.type).toBe('summary');
      expect(result.data.totalSales).toBe(50000);
      expect(result.data.totalOrders).toBe(2);
      expect(result.data.avgPrice).toBe(25000);
    });
  });

  describe('Safe SQL Guard', () => {
    test('blocks SQL injection attempts', async () => {
      const maliciousQueries = [
        'SELECT * FROM users',
        'INSERT INTO products VALUES (1, "hack")',
        'UPDATE orders SET status = "cancelled"',
        'DROP TABLE customers',
        'CREATE TABLE hack (id int)',
        'ALTER TABLE users ADD COLUMN hack text'
      ];

      for (const query of maliciousQueries) {
        const req = createRequest({
          question: query,
          tenant_id: 'test-tenant'
        });

        const response = await POST(req);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toContain('SQL queries are not allowed');
        expect(result.hint).toBeDefined();
      }
    });
  });

  describe('Input Validation', () => {
    test('requires question parameter', async () => {
      const req = createRequest({
        tenant_id: 'test-tenant'
      });

      const response = await POST(req);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('question required');
    });

    test('requires tenant_id parameter', async () => {
      const req = createRequest({
        question: '월별 매출 추세'
      });

      const response = await POST(req);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('tenant_id required');
    });
  });

  describe('Error Handling', () => {
    test('handles Supabase errors gracefully', async () => {
      mockSupabase.rpc.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database connection failed' } 
      });

      const req = createRequest({
        question: '월별 매출 추세',
        tenant_id: 'test-tenant'
      });

      const response = await POST(req);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe('Database connection failed');
    });

    test('handles network errors gracefully', async () => {
      mockSupabase.rpc.mockRejectedValue(new Error('Network timeout'));

      const req = createRequest({
        question: '월별 매출 추세',
        tenant_id: 'test-tenant'
      });

      const response = await POST(req);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe('Network timeout');
    });
  });
});
