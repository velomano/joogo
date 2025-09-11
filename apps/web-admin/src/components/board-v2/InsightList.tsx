'use client';

interface InsightListProps {
  insights: string[];
}

export function InsightList({ insights }: InsightListProps) {
  if (insights.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">인사이트</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 text-sm">분석할 데이터가 부족합니다</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">인사이트</h3>
      
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-blue-600">
                {index + 1}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 leading-relaxed">
                {insight}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
