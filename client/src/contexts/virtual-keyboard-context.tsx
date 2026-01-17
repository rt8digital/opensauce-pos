
import React, { createContext, useContext, useState, useRef, useCallback } from "react";

interface VirtualKeyboardContextType {
    isVisible: boolean;
    openKeyboard: (input: HTMLElement) => void;
    closeKeyboard: () => void;
    targetInput: HTMLElement | null;
    // New: Allow physical keyboard to work alongside virtual keyboard
    allowPhysicalKeyboard: boolean;
    setAllowPhysicalKeyboard: (allowed: boolean) => void;
}

const VirtualKeyboardContext = createContext<VirtualKeyboardContextType | undefined>(undefined);

export function VirtualKeyboardProvider({ children }: { children: React.ReactNode }) {
    const [isVisible, setIsVisible] = useState(false);
    const [targetInput, setTargetInput] = useState<HTMLElement | null>(null);
    const [allowPhysicalKeyboard, setAllowPhysicalKeyboard] = useState(true);

    const openKeyboard = useCallback((input: HTMLElement) => {
        console.log('🔧 VIRTUAL KEYBOARD: Opening keyboard - allowing physical keyboard to work simultaneously');
        setTargetInput(input);
        setIsVisible(true);
        // Always allow physical keyboard to work alongside virtual keyboard
        setAllowPhysicalKeyboard(true);
    }, []);

    const closeKeyboard = useCallback(() => {
        console.log('🔧 VIRTUAL KEYBOARD: Closing keyboard - restoring normal input behavior');
        setIsVisible(false);
        setTargetInput(null);
        setAllowPhysicalKeyboard(true);
    }, []);

    return (
        <VirtualKeyboardContext.Provider value={{ 
            isVisible, 
            openKeyboard, 
            closeKeyboard, 
            targetInput, 
            allowPhysicalKeyboard, 
            setAllowPhysicalKeyboard 
        }}>
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
