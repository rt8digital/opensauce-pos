import React, { useEffect, useState } from "react";
import { useVirtualKeyboard } from "@/contexts/virtual-keyboard-context";
import { Button } from "@/components/ui/button";
import { X, Delete, ArrowBigUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

export function VirtualKeyboard() {
    const { isVisible, closeKeyboard, targetInput, allowPhysicalKeyboard } = useVirtualKeyboard();
    const [location] = useLocation();
    const [isShift, setIsShift] = useState(false);
    const [isNumeric, setIsNumeric] = useState(false);

    // Close keyboard on route change
    useEffect(() => {
        closeKeyboard();
    }, [location, closeKeyboard]);

    // Scroll target into view when keyboard opens
    useEffect(() => {
        if (isVisible && targetInput) {
            // Wait a tick for keyboard to render and take space
            setTimeout(() => {
                targetInput.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 100);
        }
    }, [isVisible, targetInput]);

    // Auto-switch to numeric mode for numeric inputs
    useEffect(() => {
        if (isVisible && targetInput) {
            const input = targetInput as HTMLInputElement;
            const inputType = input.getAttribute('type') || 'text';
            const isNumericInput = inputType === 'number' || inputType === 'tel';

            if (isNumericInput && !isNumeric) {
                setIsNumeric(true);
            } else if (!isNumericInput && isNumeric) {
                setIsNumeric(false);
            }
        }
    }, [isVisible, targetInput, isNumeric]);

    // Auto-close if target is lost/unmounted (optional safety)
    useEffect(() => {
        if (isVisible && !targetInput) {
            closeKeyboard();
        }
    }, [isVisible, targetInput, closeKeyboard]);

    if (!isVisible) return null;

    const handleKeyPress = (key: string) => {
        if (!targetInput) return;

        const input = targetInput as HTMLInputElement | HTMLTextAreaElement;

        // Dispatch events to simulate real user input for React state updates
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value"
        )?.set;

        const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            "value"
        )?.set;

        // Only get selection range for input types that support it
        const inputType = input.getAttribute('type') || 'text';
        // According to MDN: setSelectionRange() only works on input types: password, search, tel, text, url
        const selectionSupportedTypes = ['password', 'search', 'tel', 'text', 'url'];
        let start = 0;
        let end = 0;

        if (selectionSupportedTypes.includes(inputType) || input instanceof HTMLTextAreaElement) {
            start = input.selectionStart || 0;
            end = input.selectionEnd || 0;
        } else {
            // For inputs that don't support selection, place cursor at the end
            start = end = input.value.length;
        }
        const currentValue = input.value;

        let newValue = currentValue;
        let newCursorPos = start;

        // Check input type to handle numeric inputs appropriately
        const isNumericInput = inputType === 'number' || inputType === 'tel';
        const supportsSelection = selectionSupportedTypes.includes(inputType) || input instanceof HTMLTextAreaElement;

        if (key === "BACKSPACE") {
            if (supportsSelection && start === end && start > 0) {
                newValue = currentValue.slice(0, start - 1) + currentValue.slice(end);
                newCursorPos = start - 1;
            } else if (supportsSelection) {
                newValue = currentValue.slice(0, start) + currentValue.slice(end);
                newCursorPos = start;
            } else {
                // For inputs that don't support selection, remove the last character
                newValue = currentValue.slice(0, -1);
                newCursorPos = newValue.length;
            }
        } else if (key === "ENTER") {
            if (supportsSelection) {
                newValue = currentValue.slice(0, start) + "\n" + currentValue.slice(end);
                newCursorPos = start + 1;
            } else {
                // For inputs that don't support selection, append the character
                newValue = currentValue + "\n";
                newCursorPos = newValue.length;
            }
        } else if (key === "SPACE") {
            if (supportsSelection) {
                newValue = currentValue.slice(0, start) + " " + currentValue.slice(end);
                newCursorPos = start + 1;
            } else {
                // For inputs that don't support selection, append the character
                newValue = currentValue + " ";
                newCursorPos = newValue.length;
            }
        } else {
            // For numeric inputs, only allow valid numeric characters
            // Only validate for 'number' type since 'tel' can contain other characters
            if (isNumericInput && inputType === 'number' && !/^[0-9.,\-+]$/.test(key)) {
                return; // Ignore invalid characters for numeric inputs
            }

            if (supportsSelection) {
                const char = isShift ? key.toUpperCase() : key.toLowerCase();
                newValue = currentValue.slice(0, start) + char + currentValue.slice(end);
                newCursorPos = start + 1;
            } else {
                // For inputs that don't support selection, append the character
                const char = isShift ? key.toUpperCase() : key.toLowerCase();
                newValue = currentValue + char;
                newCursorPos = newValue.length;
            }
        }

        // Set value using native setter to trigger React's onChange trackers
        const valueSetter = input instanceof HTMLTextAreaElement ? nativeTextAreaValueSetter : nativeInputValueSetter;
        valueSetter?.call(input, newValue);

        // Dispatch input event
        const event = new Event("input", { bubbles: true });
        input.dispatchEvent(event);

        // Restore focus and cursor position
        // Only set selection range for input types that support it
        // According to MDN: setSelectionRange() only works on input types: password, search, tel, text, url

        input.focus();
        if (selectionSupportedTypes.includes(inputType) || input instanceof HTMLTextAreaElement) {
            input.setSelectionRange(newCursorPos, newCursorPos);
        }
    };

    const keys = [
        ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
        ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
        ["z", "x", "c", "v", "b", "n", "m"]
    ];

    const numericKeys = [
        ["1", "2", "3"],
        ["4", "5", "6"],
        ["7", "8", "9"],
        [".", "0", ","]
    ];

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="fixed bottom-0 left-0 right-0 z-[9999] bg-background border-t shadow-2xl p-4 pb-8"
                >
                    <div className="max-w-7xl mx-auto flex gap-4">
                        {/* Main Keyboard Area */}
                        <div className="flex-1 flex flex-col gap-2">
                            {/* Header / Actions */}
                            <div className="flex justify-between items-center mb-2">
                                <div className="text-sm text-muted-foreground">
                                    Editing: <span className="font-medium text-foreground">{(targetInput as any)?.name || (targetInput as any)?.placeholder || "Text Field"}</span>
                                    {allowPhysicalKeyboard && (
                                        <span className="ml-2 text-xs text-green-600 font-medium">
                                            • Physical keyboard enabled
                                        </span>
                                    )}
                                </div>
                                <Button variant="ghost" size="sm" onClick={closeKeyboard}>
                                    <X className="h-4 w-4 mr-2" />
                                    Close
                                </Button>
                            </div>

                            {/* QWERTY Rows */}
                            {!isNumeric ? (
                                <>
                                    {keys.map((row, rowIndex) => (
                                        <div key={rowIndex} className="flex justify-center gap-1.5">
                                            {rowIndex === 1 && <div className="w-4" />} {/* Spacer for indentation */}
                                            {row.map((key) => (
                                                <Button
                                                    key={key}
                                                    variant="secondary"
                                                    className="h-12 w-10 sm:w-14 text-lg font-medium shadow-sm active:translate-y-0.5 transition-transform"
                                                    onClick={() => handleKeyPress(key)}
                                                >
                                                    {isShift ? key.toUpperCase() : key}
                                                </Button>
                                            ))}
                                            {rowIndex === 1 && <div className="w-4" />}
                                        </div>
                                    ))}

                                    {/* Bottom Row */}
                                    <div className="flex justify-center gap-1.5 mt-1">
                                        <Button
                                            variant={isShift ? "default" : "outline"}
                                            className="h-12 w-16"
                                            onClick={() => setIsShift(!isShift)}
                                        >
                                            <ArrowBigUp className={cn("h-6 w-6", isShift && "fill-current")} />
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            className="h-12 w-64"
                                            onClick={() => handleKeyPress("SPACE")}
                                        >
                                            Space
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            className="h-12 w-16"
                                            onClick={() => handleKeyPress("BACKSPACE")}
                                        >
                                            <Delete className="h-5 w-5" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="h-12 w-20 font-bold"
                                            onClick={() => setIsNumeric(true)}
                                        >
                                            123
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                /* Numeric Layout for Main Area */
                                <>
                                    {numericKeys.map((row, rowIndex) => (
                                        <div key={rowIndex} className="flex justify-center gap-1.5">
                                            {row.map((key) => (
                                                <Button
                                                    key={key}
                                                    variant="secondary"
                                                    className="h-12 w-10 sm:w-14 text-lg font-medium shadow-sm active:translate-y-0.5 transition-transform"
                                                    onClick={() => handleKeyPress(key)}
                                                >
                                                    {key}
                                                </Button>
                                            ))}
                                        </div>
                                    ))}
                                    {/* Bottom Row for Numeric Mode */}
                                    <div className="flex justify-center gap-1.5 mt-1">
                                        <Button
                                            variant="secondary"
                                            className="h-12 w-64"
                                            onClick={() => handleKeyPress("SPACE")}
                                        >
                                            Space
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            className="h-12 w-16"
                                            onClick={() => handleKeyPress("BACKSPACE")}
                                        >
                                            <Delete className="h-5 w-5" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="h-12 w-20 font-bold"
                                            onClick={() => setIsNumeric(false)}
                                        >
                                            ABC
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Always visible NumPad (for easy POS entry) */}
                        <div className="w-64 border-l pl-4 flex flex-col gap-1.5">
                            {numericKeys.map((row, i) => (
                                <div key={i} className="flex gap-1.5 flex-1">
                                    {row.map(key => (
                                        <Button
                                            key={key}
                                            variant="outline"
                                            className="flex-1 h-full text-xl font-bold"
                                            onClick={() => handleKeyPress(key)}
                                        >
                                            {key}
                                        </Button>
                                    ))}
                                </div>
                            ))}
                            <div className="flex gap-1.5 h-14">
                                <Button
                                    className="flex-1 h-full"
                                    variant="destructive"
                                    onClick={() => handleKeyPress("BACKSPACE")}
                                >
                                    <Delete className="h-5 w-5" />
                                </Button>
                                <Button
                                    className="flex-[2] h-full"
                                    variant="default"
                                    onClick={() => handleKeyPress("ENTER")}
                                >
                                    Enter
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}