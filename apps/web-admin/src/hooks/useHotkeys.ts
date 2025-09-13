'use client';

import { useEffect, useCallback } from 'react';

export interface HotkeyConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description?: string;
}

export function useHotkeys(hotkeys: HotkeyConfig[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    for (const hotkey of hotkeys) {
      const { key, ctrl, shift, alt, meta, action } = hotkey;
      
      const keyMatch = event.key.toLowerCase() === key.toLowerCase();
      const ctrlMatch = !!ctrl === event.ctrlKey;
      const shiftMatch = !!shift === event.shiftKey;
      const altMatch = !!alt === event.altKey;
      const metaMatch = !!meta === event.metaKey;
      
      if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
        event.preventDefault();
        action();
        break;
      }
    }
  }, [hotkeys]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// 기본 핫키들
export const defaultHotkeys: HotkeyConfig[] = [
  {
    key: 'r',
    ctrl: true,
    action: () => window.location.reload(),
    description: '페이지 새로고침'
  },
  {
    key: 'e',
    ctrl: true,
    action: () => {
      // 데이터 내보내기 기능 (구현 필요)
      console.log('데이터 내보내기');
    },
    description: '데이터 내보내기'
  },
  {
    key: 'f',
    ctrl: true,
    action: () => {
      // 필터 패널 포커스 (구현 필요)
      const filterInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      filterInput?.focus();
    },
    description: '필터 포커스'
  },
  {
    key: 'h',
    ctrl: true,
    action: () => {
      // 도움말 토글 (구현 필요)
      console.log('도움말 토글');
    },
    description: '도움말 토글'
  }
];
