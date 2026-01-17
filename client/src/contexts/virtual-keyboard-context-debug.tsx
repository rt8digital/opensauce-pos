
import React, { createContext, useContext, useState, useRef, useCallback } from "react";

interface VirtualKeyboardContextType {
    isVisible: boolean;
    openKeyboard: (input: HTMLElement) => void;
    closeKeyboard: () => void;
    targetInput: HTMLElement | null;
}

const VirtualKeyboardContext = createContext<VirtualKeyboardContextType | undefined>(undefined);

export function VirtualKeyboardProvider({ children }: { children: React.ReactNode }) {
    const [isVisible, setIsVisible] = useState(false);
    const [targetInput, setTargetInput] = useState<HTMLElement | null>(null);

    const openKeyboard = useCallback((input: HTMLElement) => {
        console.log('🔍 VIRTUAL KEYBOARD: Opening keyboard for input:', {
            tagName: input?.tagName,
            type: (input as HTMLInputElement)?.type,
            placeholder: (input as HTMLInputElement)?.placeholder,
            id: (input as HTMLInputElement)?.id,
            className: (input as HTMLInputElement)?.className
        });
        setTargetInput(input);
        setIsVisible(true);
    }, []);

    const closeKeyboard = useCallback(() => {
        console.log('🔍 VIRTUAL KEYBOARD: Closing keyboard');
        setIsVisible(false);
        setTargetInput(null);
    }, []);

    return (
        <VirtualKeyboardContext.Provider value={{ isVisible, openKeyboard, closeKeyboard, targetInput }}>
            {children}
        </VirtualKeyboardContext.Provider>
    );
}

export function useVirtualKeyboard() {
    const context = useContext(VirtualKeyboardContext);
    if (context === undefined) {
        throw new Error("useVirtualKeyboard must be used within a VirtualKeyboardProvider");
    }
    return context;
}