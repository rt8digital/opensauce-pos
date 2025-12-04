import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { iconLibrary, iconCategories, allEmojis } from '@/lib/icon-library';
import { Search, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmojiPickerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (emoji: string) => void;
    selectedEmoji?: string;
}

export function EmojiPicker({ open, onOpenChange, onSelect, selectedEmoji }: EmojiPickerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('food');

    const filteredEmojis = useMemo(() => {
        if (searchQuery) {
            return allEmojis.filter((emoji) =>
                emoji.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return iconLibrary[activeCategory as keyof typeof iconLibrary] || [];
    }, [searchQuery, activeCategory]);

    const handleSelect = (emoji: string) => {
        onSelect(emoji);
        onOpenChange(false);
        setSearchQuery(''); // Reset search when closing
    };

    const handleClose = () => {
        onOpenChange(false);
        setSearchQuery(''); // Reset search when closing
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-full h-full max-h-full p-0 gap-0 bg-background">
                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <DialogTitle className="text-xl font-semibold">Choose an Icon</DialogTitle>

                    {/* Search Bar */}
                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Search icons and emojis..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-12 text-base"
                            autoFocus
                        />
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    {/* Categories - Only show when not searching */}
                    {!searchQuery && (
                        <div className="px-6 py-3 border-b bg-muted/30">
                            <ScrollArea className="w-full">
                                <div className="flex gap-1 pb-2">
                                    {iconCategories.map((category) => (
                                        <Button
                                            key={category.id}
                                            variant={activeCategory === category.id ? "default" : "ghost"}
                                            size="sm"
                                            onClick={() => setActiveCategory(category.id)}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2 h-auto whitespace-nowrap",
                                                activeCategory === category.id && "bg-primary text-primary-foreground"
                                            )}
                                        >
                                            <span className="text-lg">{category.icon}</span>
                                            <span className="hidden sm:inline text-sm">{category.name}</span>
                                        </Button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                    {/* Emoji Grid */}
                    <ScrollArea className="flex-1 px-6 py-4">
                        <div className="max-w-4xl mx-auto">
                            {filteredEmojis.length > 0 ? (
                                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-16 gap-1 sm:gap-2">
                                    {filteredEmojis.map((emoji, index) => (
                                        <button
                                            key={`${emoji}-${index}`}
                                            type="button"
                                            onClick={() => handleSelect(emoji)}
                                            className={cn(
                                                'group relative aspect-square flex items-center justify-center text-2xl sm:text-3xl p-2 sm:p-3 rounded-lg hover:bg-accent hover:scale-105 transition-all duration-200 active:scale-95',
                                                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                                                selectedEmoji === emoji && 'bg-primary/20 ring-2 ring-primary scale-105'
                                            )}
                                            title={`Select ${emoji}`}
                                        >
                                            <span className="select-none">{emoji}</span>
                                            {selectedEmoji === emoji && (
                                                <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                                                    <Check className="h-3 w-3" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="text-6xl mb-4">🔍</div>
                                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No icons found</h3>
                                    <p className="text-sm text-muted-foreground max-w-sm">
                                        Try searching for different keywords or browse categories above.
                                    </p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Footer with selected emoji preview */}
                {selectedEmoji && (
                    <div className="px-6 py-4 border-t bg-muted/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{selectedEmoji}</span>
                                <span className="text-sm text-muted-foreground">Selected icon</span>
                            </div>
                            <Button onClick={() => handleSelect(selectedEmoji)} size="sm">
                                Confirm Selection
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
