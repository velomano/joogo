'use client';

import React from 'react';
import { ErrorBoundary } from '../ErrorBoundary';
import { TopNavigation } from '../layout/TopNavigation';
import { useHotkeys, defaultHotkeys } from '../../hooks/useHotkeys';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
}

export function DashboardLayout({ 
  children, 
  title, 
  subtitle, 
  filters, 
  actions 
}: DashboardLayoutProps) {
  useHotkeys(defaultHotkeys);

  return (
    <ErrorBoundary>
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <TopNavigation />
        
        <div className="wrap" style={{ paddingTop: '0' }}>
          <aside className="sidebar panel" style={{ backgroundColor: '#1f2937', border: 'none' }}>
            <h1 style={{ color: '#f9fafb', marginBottom: '16px' }}>
              {title} 
              {subtitle && <span className="muted" style={{ color: '#9ca3af' }}> {subtitle}</span>}
            </h1>
            
            {filters && (
              <>
                <hr className="line" style={{ borderColor: '#374151' }} />
                {filters}
              </>
            )}
            
            {actions && (
              <>
                <hr className="line" style={{ borderColor: '#374151' }} />
                {actions}
              </>
            )}
            
            <hr className="line" style={{ borderColor: '#374151' }} />
            <div className="muted info" style={{ fontSize: '11px', color: '#9ca3af' }}>
              💡 단축키: Ctrl+R (새로고침), Ctrl+E (내보내기), Ctrl+F (필터), Ctrl+H (도움말)
            </div>
          </aside>

          <main className="main" style={{ backgroundColor: '#f9fafb' }}>
            <section className="panel" style={{ backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}>
              {children}
            </section>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
