'use client';

import { BarChart3, Calendar, Filter } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ 
  title = '데이터가 없습니다',
  message = '선택한 기간에 표시할 데이터가 없습니다. 다른 기간을 선택해보세요.',
  actionLabel = '필터 초기화',
  onAction
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <BarChart3 className="w-10 h-10 text-gray-400" />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-3">
        {title}
      </h3>
      
      <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
        {message}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Filter className="w-4 h-4" />
            {actionLabel}
          </button>
        )}
        
        <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
          <Calendar className="w-4 h-4" />
          기간 변경
        </button>
      </div>
    </div>
  );
}
