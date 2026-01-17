import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

const snackbarVariants = cva(
  "fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 ease-in-out max-w-md w-full mx-4",
  {
    variants: {
      variant: {
        default: "bg-background/95 border border-border/50 text-foreground",
        success: "bg-green-500/95 border border-green-600/50 text-white",
        error: "bg-red-500/95 border border-red-600/50 text-white",
        warning: "bg-yellow-500/95 border border-yellow-600/50 text-white",
        info: "bg-blue-500/95 border border-blue-600/50 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface SnackbarProps extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof snackbarVariants> {
  title?: string
  description?: string
  action?: React.ReactNode
  onClose?: () => void
  autoClose?: boolean
  duration?: number
}

const Snackbar = React.forwardRef<HTMLDivElement, SnackbarProps>(
  ({ className, variant, title, description, action, onClose, autoClose = true, duration = 4000, children, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true)
    const [isAnimating, setIsAnimating] = React.useState(false)

    React.useEffect(() => {
      // Trigger enter animation
      setTimeout(() => setIsAnimating(true), 10)

      // Auto-close logic
      if (autoClose && duration > 0) {
        const timer = setTimeout(() => {
          handleClose()
        }, duration)

        return () => clearTimeout(timer)
      }
    }, [autoClose, duration])

    const handleClose = () => {
      setIsAnimating(false)
      setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, 300)
    }

    if (!isVisible) return null

    const getIcon = () => {
      switch (variant) {
        case 'success':
          return <CheckCircle className="h-5 w-5 flex-shrink-0" />
        case 'error':
          return <AlertCircle className="h-5 w-5 flex-shrink-0" />
        case 'warning':
          return <AlertTriangle className="h-5 w-5 flex-shrink-0" />
        case 'info':
          return <Info className="h-5 w-5 flex-shrink-0" />
        default:
          return null
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          snackbarVariants({ variant }),
          isAnimating 
            ? "opacity-100 translate-y-0 scale-100" 
            : "opacity-0 -translate-y-2 scale-95",
          className
        )}
        {...props}
      >
        {getIcon()}
        <div className="flex-1 min-w-0">
          {title && (
            <div className="font-medium text-sm truncate">{title}</div>
          )}
          {description && (
            <div className="text-sm opacity-90 truncate">{description}</div>
          )}
          {children}
        </div>
        {action && (
          <div className="flex-shrink-0 ml-2">
            {action}
          </div>
        )}
        {(onClose || !autoClose) && (
          <button
            onClick={handleClose}
            className="flex-shrink-0 ml-2 p-1 rounded-md hover:bg-black/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)
Snackbar.displayName = "Snackbar"

export { Snackbar, snackbarVariants }
