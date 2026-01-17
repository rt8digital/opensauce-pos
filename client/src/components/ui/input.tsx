import * as React from "react"
import { Keyboard } from "lucide-react"
import { useVirtualKeyboard } from "@/contexts/virtual-keyboard-context"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  hideKeyboardIcon?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, hideKeyboardIcon, ...props }, ref) => {
    const { openKeyboard } = useVirtualKeyboard();

    // Check if this is a compact input that needs special handling
    const isCompactInput = className?.includes('w-20') || className?.includes('w-16') || className?.includes('w-24');

    return (
      <div className={`relative ${isCompactInput ? 'w-auto' : 'w-full'}`}>
        <input
          type={type}
          className={cn(
            "flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            // Adjust padding for compact inputs to prevent text overlap with keyboard button
            !hideKeyboardIcon && (isCompactInput ? "pr-8" : "pr-10"),
            className
          )}
          ref={ref}
          {...props}
        />
        {!hideKeyboardIcon && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              // Use currentTarget's previous sibling (the input) or ref if available,
              // but for simplicity, we can just grab the input by DOM traversal or ref if simple.
              // Better: use event to find the input sibling.
              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
              if (input) {
                // Focus first - ensure the input has focus for physical keyboard
                input.focus();
                // Open virtual keyboard alongside physical keyboard
                openKeyboard(input);
              }
            }}
            className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1 ${isCompactInput ? 'right-1' : 'right-2'
              }`}
            tabIndex={-1}
            aria-label="Open virtual keyboard (physical keyboard still works)"
            title="Click to open virtual keyboard - physical keyboard will still work"
          >
            <Keyboard className={` ${isCompactInput ? 'h-3 w-3' : 'h-4 w-4'}`} />
          </button>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

export { Input }
