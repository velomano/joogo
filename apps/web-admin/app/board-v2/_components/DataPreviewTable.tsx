'use client';

import { useEffect, useState } from 'react';

interface DataPreviewTableProps {
  title: string;
  from: string;
  to: string;
  refreshTrigger: number;
}

export default function DataPreviewTable({ title, from, to, refreshTrigger }: DataPreviewTableProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          tenant_id: '84949b3c-2cb7-4c42-b9f9-d1f37d371e00',
          from,
          to,
          limit: '10'
        });

        const response = await fetch(`/api/board/data-preview?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch data preview');
        }

        const result = await response.json();
        if (result.ok) {
          setData(result.sales.data || []);
        } else {
          throw new Error(result.error || 'Failed to fetch data');
        }
      } catch (err) {
        console.error('Error fetching data preview:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
        // Fallback mock data
        setData([
          ['2025-01-01', 'SEOUL', 'web', 'TOPS-001', '프리미엄 후드티', '블랙/L', '5', '142500'],
          ['2025-01-02', 'SEOUL', 'web', 'TOPS-001', '프리미엄 후드티', '화이트/M', '7', '203700'],
          ['2025-01-03', 'SEOUL', 'web', 'TOPS-001', '프리미엄 후드티', '그레이/XL', '9', '261900'],
          ['2025-01-01', 'BUSAN', 'app', 'BOTTOMS-002', '데님 스커트', '블루/28', '3', '89000'],
          ['2025-01-02', 'BUSAN', 'app', 'BOTTOMS-002', '데님 스커트', '블루/30', '4', '118600'],
          ['2025-01-03', 'INCHEON', 'mobile', 'SHOES-001', '스니커즈', '화이트/270', '2', '156000']
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [from, to, refreshTrigger]);

  const columns = ['date', 'region', 'channel', 'sku', 'product_name', 'options', 'qty', 'revenue'];

  if (loading) {
    return (
      <div className="panel">
        <div className="row">
          <b>{title}</b>
        </div>
        <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
          데이터를 불러오는 중...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel">
        <div className="row">
          <b>{title}</b>
        </div>
        <div style={{ textAlign: 'center', padding: '20px', color: '#ef4444' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="row">
        <b>{title}</b>
      </div>
      <div style={{ overflow: 'auto', maxHeight: '200px', borderRadius: '10px', border: '1px solid #1b2533' }}>
        <table>
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {row.map((cell: any, j: number) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
