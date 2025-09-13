'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div style={{
      padding: '20px',
      margin: '20px',
      border: '1px solid #ef4444',
      borderRadius: '8px',
      backgroundColor: '#fef2f2',
      color: '#dc2626'
    }}>
      <h2 style={{ marginBottom: '12px', fontSize: '18px', fontWeight: '600' }}>
        ⚠️ 오류가 발생했습니다
      </h2>
      <p style={{ marginBottom: '16px', fontSize: '14px' }}>
        {error.message || '알 수 없는 오류가 발생했습니다.'}
      </p>
      <button
        onClick={resetError}
        style={{
          padding: '8px 16px',
          backgroundColor: '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        다시 시도
      </button>
    </div>
  );
}
