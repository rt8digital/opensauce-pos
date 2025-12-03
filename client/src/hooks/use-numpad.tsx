import { useEffect, useState, useCallback } from 'react';

export type NumpadMode = 'plu' | 'quantity' | 'amount' | 'calculator';

interface NumpadState {
    display: string;
    mode: NumpadMode;
    quantity: number | null;
}

interface UseNumpadOptions {
    onPLUSubmit: (plu: string) => void;
    onQuantitySubmit: (quantity: number, plu: string) => void;
    onAmountSubmit: (amount: string) => void;
    enabled?: boolean;
}

export function useNumpad({
    onPLUSubmit,
    onQuantitySubmit,
    onAmountSubmit,
    enabled = true,
}: UseNumpadOptions) {
    const [state, setState] = useState<NumpadState>({
        display: '',
        mode: 'plu',
        quantity: null,
    });

    const clear = useCallback(() => {
        setState({
            display: '',
            mode: 'plu',
            quantity: null,
        });
    }, []);

    const handleSubmit = useCallback(() => {
        if (!state.display) return;

        switch (state.mode) {
            case 'plu':
                onPLUSubmit(state.display);
                break;
            case 'quantity':
                if (state.quantity !== null) {
                    onQuantitySubmit(state.quantity, state.display);
                }
                break;
            case 'amount':
                onAmountSubmit(state.display);
                break;
        }
        clear();
    }, [state, onPLUSubmit, onQuantitySubmit, onAmountSubmit, clear]);

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input/textarea
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return;
            }

            // Check if it's a numpad or number key
            const isNumpadKey = e.code.startsWith('Numpad') || e.code.startsWith('Digit');
            const isNumpadOperator = ['NumpadAdd', 'NumpadMultiply', 'NumpadSubtract', 'NumpadDivide', 'NumpadDecimal'].includes(e.code);

            // Handle number input
            if (isNumpadKey && !isNumpadOperator) {
                e.preventDefault();
                const digit = e.key;
                if (/^[0-9.]$/.test(digit)) {
                    setState(prev => ({
                        ...prev,
                        display: prev.display + digit,
                    }));
                }
            }

            // Handle operators
            if (e.code === 'NumpadMultiply' || (e.shiftKey && e.key === '*')) {
                e.preventDefault();
                // Switch to quantity mode
                const qty = parseFloat(state.display) || 1;
                setState(prev => ({
                    ...prev,
                    mode: 'quantity',
                    quantity: qty,
                    display: '',
                }));
            }

            if (e.code === 'NumpadAdd' || (e.shiftKey && e.key === '+')) {
                e.preventDefault();
                // Switch to amount mode
                setState(prev => ({
                    ...prev,
                    mode: 'amount',
                }));
            }

            // Handle Enter
            if (e.code === 'NumpadEnter' || (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey)) {
                e.preventDefault();
                handleSubmit();
            }

            // Handle Backspace
            if (e.key === 'Backspace') {
                e.preventDefault();
                setState(prev => ({
                    ...prev,
                    display: prev.display.slice(0, -1),
                }));
            }

            // Handle Escape
            if (e.key === 'Escape') {
                e.preventDefault();
                clear();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [enabled, state.display, handleSubmit, clear]);

    return {
        display: state.display,
        mode: state.mode,
        quantity: state.quantity,
        clear,
    };
}
