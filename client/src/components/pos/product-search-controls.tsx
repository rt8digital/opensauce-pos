import React from 'react';
import { CustomerSelect } from '@/components/pos/customer-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Grid3X3, List, X } from 'lucide-react';
import { useEnhancedFocus } from '@/hooks/use-enhanced-focus';
import { HeaderWidget } from './header-widget';
import type { Customer } from '../../../../shared/types';

interface ProductSearchControlsProps {
    selectedCustomer: Customer | null;
    onSelectCustomer: (customer: Customer | null) => void;
    viewMode: 'grid' | 'list';
    onViewModeChange: (mode: 'grid' | 'list') => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    selectedCategory: number;
    onCategoryChange: (categoryId: number) => void;
    categories: { id: number; name: string }[];

    searchInputRef?: React.RefObject<HTMLInputElement>;
    autoFocusSearch?: boolean;
}

export function ProductSearchControls({
    selectedCustomer,
    onSelectCustomer,
    viewMode,
    onViewModeChange,
    searchQuery,
    onSearchChange,
    onSearchKeyDown,
    selectedCategory,
    onCategoryChange,
    categories,

    searchInputRef,
    autoFocusSearch = true,
}: ProductSearchControlsProps) {
    // Use enhanced focus management
    const enhancedFocus = useEnhancedFocus<HTMLInputElement>({
        autoFocus: autoFocusSearch,
        selectOnFocus: true,
        focusDelay: 100, // Small delay for better UX
    });

    // Merge refs if external ref is provided
    const mergedRef = React.useCallback((element: HTMLInputElement | null) => {
        (enhancedFocus.ref as React.MutableRefObject<HTMLInputElement | null>).current = element;
        if (searchInputRef) {
            // @ts-ignore - we know this is safe
            (searchInputRef as React.MutableRefObject<HTMLInputElement | null>).current = element;
        }
    }, [enhancedFocus.ref, searchInputRef]);

    return (
        <>
            <div className="flex gap-4 mb-4 overflow-x-auto scrollbar-hide">
                <div className="flex-1 flex-shrink-0 min-w-[200px]">
                    <CustomerSelect
                        selectedCustomer={selectedCustomer}
                        onSelectCustomer={onSelectCustomer}
                    />
                </div>
                <Button
                    variant={viewMode === 'grid' ? 'outline' : 'secondary'}
                    size="icon"
                    onClick={() => onViewModeChange('grid')}
                    title="Grid View"
                    className="flex-shrink-0"
                >
                    <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                    variant={viewMode === 'list' ? 'outline' : 'secondary'}
                    size="icon"
                    onClick={() => onViewModeChange('list')}
                    title="List View"
                    className="flex-shrink-0"
                >
                    <List className="h-4 w-4" />
                </Button>

                <div className="flex-1 min-w-0" />

                <div className="flex-shrink-0">
                    <HeaderWidget />
                </div>
            </div>

            <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        ref={mergedRef}
                        data-testid="input-search"
                        type="text"
                        placeholder="Search products by name or barcode..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onKeyDown={onSearchKeyDown}
                        onFocus={enhancedFocus.onFocus}
                        onBlur={enhancedFocus.onBlur}
                        className="pl-10 pr-10"
                        // Enhanced typing attributes
                        autoComplete="off"
                        spellCheck="false"
                        inputMode="search"
                    />
                    {searchQuery && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                onSearchChange('');
                                enhancedFocus.focus(true); // Focus and select after clearing
                            }}
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                </div>
                <Select value={selectedCategory.toString()} onValueChange={(value) => onCategoryChange(parseInt(value, 10))}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </>
    );
}