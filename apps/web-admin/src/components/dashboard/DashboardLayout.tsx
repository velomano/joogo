'use client';

import React from 'react';
import { ErrorBoundary } from '../ErrorBoundary';
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
      <div className="wrap">
        <aside className="sidebar panel">
          <h1>
            {title} 
            {subtitle && <span className="muted"> {subtitle}</span>}
          </h1>
          
          {filters && (
            <>
              <hr className="line" />
              {filters}
            </>
          )}
          
          {actions && (
            <>
              <hr className="line" />
              {actions}
            </>
          )}
          
          <hr className="line" />
          <div className="muted info" style={{ fontSize: '11px', color: '#6b7280' }}>
            💡 단축키: Ctrl+R (새로고침), Ctrl+E (내보내기), Ctrl+F (필터), Ctrl+H (도움말)
          </div>
        </aside>

        <main className="main">
          <section className="panel">
            {children}
          </section>
        </main>
      </div>
    </ErrorBoundary>
  );
}
