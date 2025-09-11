'use client';

import { useState } from 'react';
import { Calendar, Search, X, Filter } from 'lucide-react';
import { BoardFilters } from '@/lib/BoardTypes';

interface FiltersPanelProps {
  filters: BoardFilters;
  onFiltersChange: (filters: Partial<BoardFilters>) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function FiltersPanel({ 
  filters, 
  onFiltersChange, 
  isCollapsed = false, 
  onToggleCollapse 
}: FiltersPanelProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const handleDateChange = (field: 'from' | 'to', value: string) => {
    onFiltersChange({ [field]: value });
  };

  const handleArrayFilterChange = (field: 'channels' | 'regions' | 'skus', value: string) => {
    const currentValues = filters[field];
    const newValues = value.trim() 
      ? value.split(',').map(v => v.trim()).filter(Boolean)
      : [];
    onFiltersChange({ [field]: newValues });
  };

  const handleBooleanFilterChange = (field: 'cuped' | 'pinCompare', value: boolean) => {
    onFiltersChange({ [field]: value });
  };

  const resetFilters = () => {
    onFiltersChange({
      from: '2025-01-01',
      to: '2025-12-31',
      channels: [],
      regions: [],
      skus: [],
      cuped: false,
      pinCompare: false,
    });
  };

  if (isCollapsed) {
    return (
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={onToggleCollapse}
          className="bg-white rounded-lg p-3 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
        >
          <Filter className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-fit">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">필터</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={resetFilters}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            초기화
          </button>
          <button
            onClick={onToggleCollapse}
            className="md:hidden p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            기간
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <input
                type="date"
                value={filters.from}
                onChange={(e) => handleDateChange('from', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <input
                type="date"
                value={filters.to}
                onChange={(e) => handleDateChange('to', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Channels */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            채널
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="web, app, mobile (쉼표로 구분)"
              value={filters.channels.join(', ')}
              onChange={(e) => handleArrayFilterChange('channels', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Regions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            지역
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="SEOUL, BUSAN, DAEGU (쉼표로 구분)"
              value={filters.regions.join(', ')}
              onChange={(e) => handleArrayFilterChange('regions', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* SKUs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SKU
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="TOPS-001, BOTTOMS-002 (쉼표로 구분)"
              value={filters.skus.join(', ')}
              onChange={(e) => handleArrayFilterChange('skus', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Feature Flags */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">기능 플래그</h4>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">CUPED</span>
            <button
              onClick={() => handleBooleanFilterChange('cuped', !filters.cuped)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                filters.cuped ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  filters.cuped ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">비교 모드</span>
            <button
              onClick={() => handleBooleanFilterChange('pinCompare', !filters.pinCompare)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                filters.pinCompare ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  filters.pinCompare ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
