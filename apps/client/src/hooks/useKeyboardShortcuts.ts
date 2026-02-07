import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Allow Escape to work in inputs
      if (event.key !== 'Escape') return;
    }

    for (const shortcut of shortcuts) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase() ||
                       event.code.toLowerCase() === `key${shortcut.key.toLowerCase()}`;
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault();
        event.stopPropagation();
        shortcut.handler();
        return;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Pre-defined shortcut combinations
export const SHORTCUTS = {
  SAVE: { key: 's', ctrl: true, description: 'Save current project' },
  NEW: { key: 'n', ctrl: true, description: 'Create new project' },
  SEARCH: { key: 'k', ctrl: true, description: 'Open command palette' },
  ESCAPE: { key: 'Escape', description: 'Close modal/panel' },
  TAB_1: { key: '1', alt: true, description: 'Switch to tab 1' },
  TAB_2: { key: '2', alt: true, description: 'Switch to tab 2' },
  TAB_3: { key: '3', alt: true, description: 'Switch to tab 3' },
  TAB_4: { key: '4', alt: true, description: 'Switch to tab 4' },
  TAB_5: { key: '5', alt: true, description: 'Switch to tab 5' },
} as const;
