'use client';

import { useState } from 'react';
import Papa from 'papaparse';

type Props = { tenantId: string };

function normalizeHeader(h: string) {
  return h
    ?.replace(/\ufeff/g, '')          // BOM 제거
    ?.trim()
    ?.toLowerCase()
    ?.replace(/\s+/g, '_')            // 공백 → _
    ?? ''
}

function toNumber(v: any) {
  if (v === null || v === undefined || v === '') return null
  return Number(String(v).replace(/,/g, ''))
}

function normalizeDate(dateStr: string) {
  if (!dateStr) return '';
  
  // 2025.1.1 -> 2025-01-01 변환
  const normalized = dateStr
    .replace(/\./g, '-')  // 점을 대시로 변경
    .split('-')
    .map(part => part.padStart(2, '0'))  // 월, 일을 2자리로 패딩
    .join('-');
  
  return normalized;
}

function normalizeRow(r: any) {
  const pick = (k: string) => r[k] ?? r[k.toLowerCase()] ?? r[k.toUpperCase()]
  const rawDate = pick('sale_date') || pick('date') || pick('sales_date');
  
  return {
    sale_date: normalizeDate(rawDate),
    sku:       pick('sku') || pick('item') || pick('product_code'),
    category:  pick('category') || pick('cat'),
    region:    pick('region') || pick('country') || pick('market'),
    channel:   pick('channel') || pick('source'),
    revenue:   toNumber(pick('revenue') ?? pick('amount') ?? pick('sales')),
    qty:       toNumber(pick('qty') ?? pick('quantity') ?? pick('units')),
    on_hand:   toNumber(pick('on_hand') ?? pick('stock_on_hand') ?? pick('inventory') ?? pick('stock')),
  }
}

export function FileUpload({ tenantId }: Props) {
  console.log('[FileUpload] Rendering with tenantId:', tenantId);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file || null);
  };
  
  const handleUpload = async () => {
    if (!selectedFile) return;
    
    // xlsx 업로드 방지
    if (!/\.csv$/i.test(selectedFile.name)) {
      console.error('[upload] Not a CSV, got:', selectedFile.name)
      alert('CSV 파일만 업로드해주세요 (.csv). 엑셀(xlsx)은 먼저 CSV로 저장 후 업로드하세요.')
      return
    }
    
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      Papa.parse(csv as any, {
        header: true,
        skipEmptyLines: 'greedy',
        encoding: 'utf-8',
        delimiter: undefined,    // autodetect
        newline: undefined,      // autodetect
        transformHeader: normalizeHeader,
        complete: async (res) => {
        try {
          // 유의미한 행만 필터
          const raw = (res.data as any[]).filter(r =>
            r && Object.values(r).some(v => v !== '' && v !== null && v !== undefined)
          )

          // 1차 정규화
          const rows = raw.map(normalizeRow).filter(r => r.sku && r.sale_date)
          console.log('[upload] parse meta:', res.meta)
          console.log('[upload] 파싱된 행수(원본/정규화):', raw.length, '/', rows.length)
          console.log('[upload] 샘플행:', rows[0])

          if (rows.length === 0) {
            alert('유효한 행을 찾지 못했습니다. 첫 행이 헤더인지, 날짜/sku 컬럼이 있는지 확인하세요.')
            setIsUploading(false)
            return
          }

          // 서버로 전송
          const resp = await fetch('/api/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tenantId, rows, fileName: selectedFile.name }),
          })
          const json = await resp.json()
          if (!resp.ok) {
            console.error('[ingest] failed', json)
            alert(`업로드 실패: ${json?.error ?? resp.status}`)
            return
          }
          console.log('[ingest] ok', json)
          alert(`업로드 완료! ${json?.inserted ?? rows.length}건 처리`)
          
          // 페이지 새로고침으로 데이터 반영
          window.location.reload()
        } catch (error) {
          console.error('[upload] error:', error)
          alert(`업로드 오류: ${error}`)
        } finally {
          setIsUploading(false)
        }
      },
      error: (err) => {
        console.error('[upload] Papa error', err)
        alert(`CSV 파싱 실패: ${err?.message ?? String(err)}`)
        setIsUploading(false)
      }
    })
    };
    reader.readAsText(selectedFile);
  };

  return (
    <div className="space-y-3">
      <input 
        type="file" 
        accept=".csv" 
        onChange={handleFileSelect}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      
      {selectedFile && (
        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
          선택된 파일: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)}KB)
        </div>
      )}
      
      <button
        onClick={handleUpload}
        disabled={!selectedFile || isUploading}
        className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          !selectedFile || isUploading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        {isUploading ? '⏳ 업로드 중...' : '📤 업로드'}
      </button>
      
      <p className="text-xs text-gray-600">
        CSV 파일을 선택하고 업로드 버튼을 클릭하세요
      </p>
    </div>
  );
}
