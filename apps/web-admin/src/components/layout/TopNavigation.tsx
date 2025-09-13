'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function TopNavigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/board-v2', label: '🏠 통합 대시보드', key: 'dashboard' },
    { href: '/board-v2/sales', label: '📈 판매 분석', key: 'sales' },
    { href: '/board-v2/inventory', label: '📦 재고 분석', key: 'inventory' },
    { href: '/board-v2/orders-shipping', label: '🚚 주문/배송 분석', key: 'orders-shipping' },
    { href: '/board-v2/ai', label: '🤖 AI 분석', key: 'ai' },
    { href: '/board-v2/help', label: '❓ 도움말', key: 'help' },
  ];

  const isActive = (href: string) => {
    if (href === '/board-v2') {
      return pathname === '/board-v2';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav style={{
      backgroundColor: '#1f2937',
      borderBottom: '1px solid #374151',
      padding: '0 20px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      {/* 로고/제목 */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '20px', 
          fontWeight: '600', 
          color: '#f9fafb' 
        }}>
          Joogo Analytics
        </h1>
        <span style={{ 
          marginLeft: '8px', 
          fontSize: '12px', 
          color: '#9ca3af' 
        }}>
          v2
        </span>
      </div>

      {/* 네비게이션 메뉴 */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {navItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
              backgroundColor: isActive(item.href) ? '#3b82f6' : 'transparent',
              color: isActive(item.href) ? '#ffffff' : '#d1d5db',
              border: isActive(item.href) ? '1px solid #3b82f6' : '1px solid transparent',
            }}
            onMouseEnter={(e) => {
              if (!isActive(item.href)) {
                e.currentTarget.style.backgroundColor = '#374151';
                e.currentTarget.style.color = '#f9fafb';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive(item.href)) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#d1d5db';
              }
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* 우측 액션 버튼들 */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          style={{
            padding: '6px 12px',
            backgroundColor: '#374151',
            color: '#d1d5db',
            border: '1px solid #4b5563',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#4b5563';
            e.currentTarget.style.color = '#f9fafb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#374151';
            e.currentTarget.style.color = '#d1d5db';
          }}
        >
          🔄 새로고침
        </button>
        
        <button
          style={{
            padding: '6px 12px',
            backgroundColor: '#374151',
            color: '#d1d5db',
            border: '1px solid #4b5563',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#4b5563';
            e.currentTarget.style.color = '#f9fafb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#374151';
            e.currentTarget.style.color = '#d1d5db';
          }}
        >
          ⚙️ 설정
        </button>
      </div>
    </nav>
  );
}
