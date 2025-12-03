import { useEffect } from 'react';

interface ShortcutHandler {
    key: string;
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    action: () => void;
    preventDefault?: boolean;
}

export function useKeyboardShortcuts(handlers: ShortcutHandler[]) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            handlers.forEach((handler) => {
                if (
                    event.key === handler.key &&
                    !!event.ctrlKey === !!handler.ctrlKey &&
                    !!event.altKey === !!handler.altKey &&
                    !!event.shiftKey === !!handler.shiftKey
                ) {
                    if (handler.preventDefault !== false) {
                        event.preventDefault();
                    }
                    handler.action();
                }
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlers]);
}
