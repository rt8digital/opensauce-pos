/**
 * Utility functions for enhanced input focus management
 */

/**
 * Enhanced focus function that focuses an element and optionally selects its text
 * @param element - The HTML input element to focus
 * @param selectText - Whether to select all text after focusing (default: true)
 * @param delay - Delay in milliseconds before selecting text (default: 10ms)
 */
export function enhancedFocus(
  element: HTMLInputElement | null, 
  selectText: boolean = true, 
  delay: number = 10
): void {
  if (!element) return;
  
  element.focus();
  
  if (selectText) {
    // Add slight delay to ensure focus is properly established before selection
    setTimeout(() => {
      if (document.activeElement === element) {
        element.select();
      }
    }, delay);
  }
}

/**
 * Enhanced blur function that removes focus from an element
 * @param element - The HTML element to blur
 */
export function enhancedBlur(element: HTMLInputElement | null): void {
  if (element) {
    element.blur();
  }
}

/**
 * Check if an element is currently focused
 * @param element - The HTML element to check
 * @returns boolean indicating if element is focused
 */
export function isFocused(element: HTMLInputElement | null): boolean {
  return element ? document.activeElement === element : false;
}