import React from 'react';

interface UseEnhancedFocusOptions {
  /** Whether to auto-focus the element on mount */
  autoFocus?: boolean;
  /** Whether to select all text when focused */
  selectOnFocus?: boolean;
  /** Delay before focusing (in ms) */
  focusDelay?: number;
  /** Callback when element gains focus */
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  /** Callback when element loses focus */
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

/**
 * Enhanced focus management hook for input elements
 * Provides better control over focus behavior and typing experience
 */
export function useEnhancedFocus<T extends HTMLInputElement>({
  autoFocus = false,
  selectOnFocus = true,
  focusDelay = 0,
  onFocus,
  onBlur
}: UseEnhancedFocusOptions = {}) {
  const ref = React.useRef<T>(null);

  // Auto-focus on mount if enabled
  React.useEffect(() => {
    if (autoFocus && ref.current) {
      const focusElement = () => {
        if (ref.current) {
          ref.current.focus();
          if (selectOnFocus) {
            ref.current.select();
          }
        }
      };

      if (focusDelay > 0) {
        const timer = setTimeout(focusElement, focusDelay);
        return () => clearTimeout(timer);
      } else {
        // Small delay to ensure DOM is ready
        const timer = setTimeout(focusElement, 10);
        return () => clearTimeout(timer);
      }
    }
  }, [autoFocus, selectOnFocus, focusDelay]);

  // Enhanced focus handler
  const handleFocus = React.useCallback((e: React.FocusEvent<T>) => {
    // Select all text for easier replacement
    if (selectOnFocus) {
      e.target.select();
    }
    
    // Call custom onFocus handler
    onFocus?.(e);
  }, [selectOnFocus, onFocus]);

  // Enhanced blur handler
  const handleBlur = React.useCallback((e: React.FocusEvent<T>) => {
    // Optional: Handle blur events
    onBlur?.(e);
  }, [onBlur]);

  // Programmatic focus method
  const focus = React.useCallback((selectText = true) => {
    if (ref.current) {
      ref.current.focus();
      if (selectText && selectOnFocus) {
        ref.current.select();
      }
    }
  }, [selectOnFocus]);

  // Programmatic blur method
  const blur = React.useCallback(() => {
    if (ref.current) {
      ref.current.blur();
    }
  }, []);

  return {
    ref,
    onFocus: handleFocus,
    onBlur: handleBlur,
    focus,
    blur
  };
}