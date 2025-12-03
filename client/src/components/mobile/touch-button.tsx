import React from 'react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/capacitor';

export interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'destructive';
    size?: 'sm' | 'md' | 'lg';
    haptic?: boolean;
    hapticStyle?: 'light' | 'medium' | 'heavy';
    children: React.ReactNode;
}

/**
 * Touch-optimized button component with haptic feedback
 */
export const TouchButton = React.forwardRef<HTMLButtonElement, TouchButtonProps>(
    ({
        className,
        variant = 'default',
        size = 'md',
        haptic = true,
        hapticStyle = 'medium',
        onClick,
        disabled,
        children,
        ...props
    }, ref) => {
        const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
            if (disabled) return;

            // Trigger haptic feedback
            if (haptic) {
                await triggerHaptic(hapticStyle);
            }

            // Call original onClick
            onClick?.(e);
        };

        const baseStyles = 'touch-target inline-flex items-center justify-center rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none touch-ripple';

        const variantStyles = {
            default: 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300',
            primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
            secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400',
            ghost: 'hover:bg-gray-100 active:bg-gray-200',
            destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
        };

        const sizeStyles = {
            sm: 'px-3 py-2 text-sm min-h-[40px]',
            md: 'px-4 py-3 text-base min-h-[48px]',
            lg: 'px-6 py-4 text-lg min-h-[56px]',
        };

        return (
            <button
                ref={ref}
                className={cn(
                    baseStyles,
                    variantStyles[variant],
                    sizeStyles[size],
                    className
                )}
                onClick={handleClick}
                disabled={disabled}
                {...props}
            >
                {children}
            </button>
        );
    }
);

TouchButton.displayName = 'TouchButton';
