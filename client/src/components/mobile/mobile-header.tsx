import React from 'react';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { ChevronLeft, Menu } from 'lucide-react';
import { triggerHaptic } from '@/utils/capacitor';

interface MobileHeaderProps {
    title?: string;
    showBack?: boolean;
    onBack?: () => void;
    onMenuClick?: () => void;
    rightAction?: React.ReactNode;
    transparent?: boolean;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
    title,
    showBack = false,
    onBack,
    onMenuClick,
    rightAction,
    transparent = false,
}) => {
    const [, navigate] = useLocation();

    const handleBack = async () => {
        await triggerHaptic('light');
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    const handleMenu = async () => {
        await triggerHaptic('light');
        onMenuClick?.();
    };

    return (
        <header
            className={cn(
                'fixed top-0 left-0 right-0 z-40 pt-safe md:hidden',
                transparent
                    ? 'bg-transparent'
                    : 'bg-white border-b border-gray-200'
            )}
        >
            <div className="flex items-center justify-between h-14 px-4">
                {/* Left Action */}
                <div className="flex items-center min-w-[44px]">
                    {showBack ? (
                        <button
                            onClick={handleBack}
                            className="touch-target-min flex items-center justify-center -ml-2 text-gray-700 active:text-blue-600 transition-colors"
                            aria-label="Go back"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    ) : onMenuClick ? (
                        <button
                            onClick={handleMenu}
                            className="touch-target-min flex items-center justify-center -ml-2 text-gray-700 active:text-blue-600 transition-colors"
                            aria-label="Open menu"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    ) : null}
                </div>

                {/* Title */}
                <h1 className="text-lg font-semibold text-gray-900 truncate flex-1 text-center px-2">
                    {title}
                </h1>

                {/* Right Action */}
                <div className="flex items-center min-w-[44px] justify-end">
                    {rightAction}
                </div>
            </div>
        </header>
    );
};
