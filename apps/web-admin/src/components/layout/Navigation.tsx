'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/board-v2', label: '통합 대시보드' },
    { href: '/board-v2/sales', label: '판매 분석' },
    { href: '/board-v2/inventory', label: '재고 분석' },
    { href: '/board-v2/orders-shipping', label: '주문/배송 분석' },
    { href: '/board-v2/ai', label: 'AI 분석' },
    { href: '/board-v2/help', label: '도움말' },
  ];

  return (
    <nav className="nav-menu">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`nav-item ${pathname === item.href ? 'active' : ''}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
