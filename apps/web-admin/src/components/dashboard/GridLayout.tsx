'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface GridLayoutProps {
  children: React.ReactNode;
  page: 'sales' | 'inventory' | 'ai' | 'help';
  onLayoutChange?: (layout: Layout[]) => void;
  className?: string;
}

export function GridLayout({ children, page, onLayoutChange, className }: GridLayoutProps) {
  const [layout, setLayout] = useState<Layout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 레이아웃 로드
  const loadLayout = useCallback(async () => {
    try {
      const response = await fetch(`/api/dashboard/layout?page=${page}`);
      const data = await response.json();
      
      if (data.success && data.layout) {
        setLayout(data.layout);
      }
    } catch (error) {
      console.error('레이아웃 로드 오류:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  // 레이아웃 저장
  const saveLayout = useCallback(async (newLayout: Layout[]) => {
    try {
      await fetch('/api/dashboard/layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page,
          layout: newLayout,
        }),
      });
    } catch (error) {
      console.error('레이아웃 저장 오류:', error);
    }
  }, [page]);

  // 레이아웃 변경 핸들러
  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    setLayout(newLayout);
    onLayoutChange?.(newLayout);
    
    // 디바운스된 저장 (1초 후)
    const timeoutId = setTimeout(() => {
      saveLayout(newLayout);
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [onLayoutChange, saveLayout]);

  useEffect(() => {
    loadLayout();
  }, [loadLayout]);

  if (isLoading) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        color: '#6b7280' 
      }}>
        레이아웃 로딩 중...
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
        isDraggable={true}
        isResizable={true}
        onLayoutChange={handleLayoutChange}
        margin={[16, 16]}
        containerPadding={[16, 16]}
        useCSSTransforms={true}
        preventCollision={false}
        compactType="vertical"
      >
        {children}
      </ResponsiveGridLayout>
    </div>
  );
}

// 그리드 아이템 래퍼 컴포넌트
interface GridItemProps {
  children: React.ReactNode;
  id: string;
  className?: string;
  style?: React.CSSProperties;
}

export function GridItem({ children, id, className, style }: GridItemProps) {
  return (
    <div 
      key={id} 
      className={className}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        padding: '16px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        ...style
      }}
    >
      {children}
    </div>
  );
}
