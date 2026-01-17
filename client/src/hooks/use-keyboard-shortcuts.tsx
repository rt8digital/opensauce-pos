import React from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  allowInInputs?: boolean;
  action: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields, unless it's a global shortcut
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';

      for (const shortcut of shortcuts) {
        const eventKey = event.key || '';
        const keyMatches = eventKey.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = !!shortcut.ctrl === event.ctrlKey;
        const altMatches = !!shortcut.alt === event.altKey;
        const shiftMatches = !!shortcut.shift === event.shiftKey;

        if (keyMatches && ctrlMatches && altMatches && shiftMatches) {
          // Allow shortcuts that are permitted in inputs, or when not in an input
          if (shortcut.allowInInputs || !isInput) {
            event.preventDefault();
            event.stopPropagation();
            shortcut.action();
            break;
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Common shortcuts that can be reused
export const commonShortcuts = {
  // Function keys
  F1: { key: 'F1' },
  F2: { key: 'F2' },
  F3: { key: 'F3' },
  F4: { key: 'F4' },
  F5: { key: 'F5' },
  F6: { key: 'F6' },
  F7: { key: 'F7' },
  F8: { key: 'F8' },
  F9: { key: 'F9' },
  F10: { key: 'F10' },
  F11: { key: 'F11' },
  F12: { key: 'F12' },

  // Common combinations
  SAVE: { key: 's', ctrl: true },
  NEW: { key: 'n', ctrl: true },
  OPEN: { key: 'o', ctrl: true },
  PRINT: { key: 'p', ctrl: true },
  EXPORT: { key: 'e', ctrl: true },
  IMPORT: { key: 'i', ctrl: true },
  LOAD: { key: 'l', ctrl: true },
  SEARCH: { key: 'f', ctrl: true },

  // Navigation
  ENTER: { key: 'Enter' },
  ESCAPE: { key: 'Escape' },
  TAB: { key: 'Tab' },
  ARROW_UP: { key: 'ArrowUp' },
  ARROW_DOWN: { key: 'ArrowDown' },
  ARROW_LEFT: { key: 'ArrowLeft' },
  ARROW_RIGHT: { key: 'ArrowRight' },
};
