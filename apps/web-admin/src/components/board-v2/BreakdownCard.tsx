'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { BreakdownRow } from '@/lib/BoardTypes';

interface BreakdownCardProps {
  title: string;
  rows: BreakdownRow[];
  format?: 'money' | 'count' | 'percent';
  maxVisible?: number;
}

export function BreakdownCard({ 
  title, 
  rows, 
  format = 'money', 
  maxVisible = 5 
}: BreakdownCardProps) {
  const [showAll, setShowAll] = useState(false);
  
  const visibleRows = showAll ? rows : rows.slice(0, maxVisible);
  const hasMore = rows.length > maxVisible;

  const formatValue = (value: number): string => {
    switch (format) {
      case 'money':
        return new Intl.NumberFormat('ko-KR', {
          style: 'currency',
          currency: 'KRW',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      case 'percent':
        return new Intl.NumberFormat('ko-KR', {
          style: 'percent',
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(value / 100);
      case 'count':
      default:
        return value.toLocaleString();
    }
  };

  const getDeltaColor = (deltaPct?: number): string => {
    if (!deltaPct) return 'text-muted-foreground';
    return deltaPct >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getDeltaIcon = (deltaPct?: number) => {
    if (!deltaPct) return null;
    return deltaPct >= 0 ? (
      <TrendingUp className="w-3 h-3" />
    ) : (
      <TrendingDown className="w-3 h-3" />
    );
  };

  const getMaxValue = (): number => {
    return Math.max(...rows.map(row => row.value));
  };

  const maxValue = getMaxValue();

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <div className="space-y-3">
        {visibleRows.map((row, index) => (
          <div key={`${row.label}-${index}`} className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {row.label}
                </span>
                {row.deltaPct && (
                  <div className={`flex items-center gap-1 text-xs font-medium ${getDeltaColor(row.deltaPct)}`}>
                    {getDeltaIcon(row.deltaPct)}
                    <span>
                      {row.deltaPct >= 0 ? '+' : ''}{row.deltaPct.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-1">
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(row.value / maxValue) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="ml-4 text-right">
              <div className="text-sm font-semibold text-gray-900">
                {formatValue(row.value)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-1 mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          {showAll ? '접기' : `더 보기 (${rows.length - maxVisible}개)`}
          <ChevronRight 
            className={`w-4 h-4 transition-transform ${showAll ? 'rotate-90' : ''}`} 
          />
        </button>
      )}
    </div>
  );
}
