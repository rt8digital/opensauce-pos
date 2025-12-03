import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { iconLibrary, iconCategories, allEmojis } from '@/lib/icon-library';
import { Search } from 'lucide-react';
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

    const filteredEmojis = searchQuery
        ? allEmojis.filter((emoji) => emoji.includes(searchQuery))
        : iconLibrary[activeCategory as keyof typeof iconLibrary] || [];

    const handleSelect = (emoji: string) => {
        onSelect(emoji);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Select Icon</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search icons..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* Categories */}
                    {!searchQuery && (
                        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
                            <ScrollArea className="w-full">
                                <TabsList className="inline-flex w-max">
                                    {iconCategories.map((category) => (
                                        <TabsTrigger
                                            key={category.id}
                                            value={category.id}
                                            className="flex items-center gap-1"
                                        >
                                            <span>{category.icon}</span>
                                            <span className="hidden sm:inline">{category.name}</span>
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </ScrollArea>
                        </Tabs>
                    )}

                    {/* Emoji Grid */}
                    <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                        <div className="grid grid-cols-8 gap-2">
                            {filteredEmojis.map((emoji, index) => (
                                <button
                                    key={`${emoji}-${index}`}
                                    type="button"
                                    onClick={() => handleSelect(emoji)}
                                    className={cn(
                                        'text-2xl p-2 rounded hover:bg-accent transition-colors',
                                        selectedEmoji === emoji && 'bg-primary/20 ring-2 ring-primary'
                                    )}
                                    title={emoji}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                        {filteredEmojis.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">
                                No icons found
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
