import * as React from "react"
import { Keyboard } from "lucide-react"
import { useVirtualKeyboard } from "@/contexts/virtual-keyboard-context"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { }

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    const { openKeyboard } = useVirtualKeyboard();

    return (
      <div className="relative w-full">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            const input = e.currentTarget.previousElementSibling as HTMLTextAreaElement;
            if (input) {
              input.focus();
              openKeyboard(input);
            }
          }}
          className="absolute right-2 top-2 text-muted-foreground hover:text-primary transition-colors p-1"
          tabIndex={-1}
          aria-label="Open virtual keyboard"
        >
          <Keyboard className="h-4 w-4" />
        </button>
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
