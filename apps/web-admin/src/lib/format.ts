// 포맷팅 유틸리티 함수들

// KRW 통화 포맷팅
export const fmtKRW = (v: number | null | undefined) => {
  if (typeof v !== 'number') return '-';
  return new Intl.NumberFormat('ko-KR', { 
    style: 'currency', 
    currency: 'KRW', 
    maximumFractionDigits: 0 
  }).format(v);
};

// 정수 포맷팅 (천 단위 구분자)
export const fmtInt = (v: number | null | undefined) => {
  if (typeof v !== 'number') return '-';
  return new Intl.NumberFormat('ko-KR').format(v);
};

// CSV 다운로드 헬퍼
export const toCSV = (rows: Record<string, any>[], filename: string) => {
  if (!rows?.length) return;
  
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(r => 
      headers.map(h => {
        const cell = r[h] ?? '';
        const s = String(cell).replace(/"/g, '""');
        return /[",\n]/.test(s) ? `"${s}"` : s;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};


