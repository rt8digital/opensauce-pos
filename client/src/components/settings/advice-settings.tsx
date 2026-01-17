import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit2, Check, X, MessageSquareQuote, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import { Settings } from '../../../../shared/types';

interface AdviceSettingsProps {
    settings: Settings;
    updateSetting: (field: keyof Settings, value: any) => void;
}

export const AdviceSettings: React.FC<AdviceSettingsProps> = ({ settings, updateSetting }) => {
    const [adviceList, setAdviceList] = useState<string[]>([]);
    const [newAdvice, setNewAdvice] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingValue, setEditingValue] = useState('');

    useEffect(() => {
        try {
            if (settings?.adviceList) {
                setAdviceList(JSON.parse(settings.adviceList));
            } else {
                setAdviceList([]);
            }
        } catch (e) {
            console.error('Failed to parse adviceList', e);
            setAdviceList([]);
        }
    }, [settings?.adviceList]);

    const saveAdviceList = (newList: string[]) => {
        updateSetting('adviceList', JSON.stringify(newList));
    };

    const handleAdd = () => {
        if (newAdvice.trim()) {
            const newList = [...adviceList, newAdvice.trim()];
            setAdviceList(newList);
            saveAdviceList(newList);
            setNewAdvice('');
        }
    };

    const handleDelete = (index: number) => {
        const newList = adviceList.filter((_, i) => i !== index);
        setAdviceList(newList);
        saveAdviceList(newList);
    };

    const startEditing = (index: number) => {
        setEditingIndex(index);
        setEditingValue(adviceList[index]);
    };

    const handleUpdate = () => {
        if (editingIndex !== null && editingValue.trim()) {
            const newList = [...adviceList];
            newList[editingIndex] = editingValue.trim();
            setAdviceList(newList);
            saveAdviceList(newList);
            setEditingIndex(null);
        }
    };

    const moveItem = (index: number, direction: 'up' | 'down') => {
        const newList = [...adviceList];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex >= 0 && newIndex < newList.length) {
            [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]];
            setAdviceList(newList);
            saveAdviceList(newList);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <CardHeader className="pb-4 border-b border-border/10">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <MessageSquareQuote className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold">Cashier Guidance</CardTitle>
                                <CardDescription>Customize revolving motivational tips and operational reminders</CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-8">
                    <div className="flex items-end gap-3 p-4 rounded-2xl bg-muted/30 border border-border/30">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="newAdvice" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">New Directive / Insight</Label>
                            <Input
                                id="newAdvice"
                                placeholder="Don't forget to upsell the premium membership today!"
                                value={newAdvice}
                                onChange={(e) => setNewAdvice(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                className="h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary/50"
                            />
                        </div>
                        <Button onClick={handleAdd} className="h-12 px-6 rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
                            <Plus className="h-4 w-4 mr-2" /> Inject
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                            <Sparkles className="h-3 w-3" /> Active Guidance Reservoir
                        </div>

                        {adviceList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-6 text-center border-2 border-dashed border-border/50 rounded-3xl bg-muted/20">
                                <MessageSquareQuote className="h-12 w-12 text-muted-foreground/20 mb-4" />
                                <p className="text-sm font-medium text-muted-foreground">No custom guidance segments detected.</p>
                                <p className="text-xs text-muted-foreground/60 mt-1 italic">System default rotation will be automatically deployed.</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {adviceList.map((advice, index) => (
                                    <div
                                        key={index}
                                        className="group/item relative flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/30 hover:bg-muted/50 hover:border-primary/30 transition-all"
                                    >
                                        <div className="flex flex-col gap-0.5 opacity-40 group-hover/item:opacity-100 transition-opacity">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6 rounded-md hover:bg-primary/10 hover:text-primary"
                                                disabled={index === 0}
                                                onClick={() => moveItem(index, 'up')}
                                            >
                                                <ChevronUp className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6 rounded-md hover:bg-primary/10 hover:text-primary"
                                                disabled={index === adviceList.length - 1}
                                                onClick={() => moveItem(index, 'down')}
                                            >
                                                <ChevronDown className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>

                                        {editingIndex === index ? (
                                            <div className="flex-1 flex gap-2 animate-in fade-in zoom-in-95 duration-200">
                                                <Input
                                                    value={editingValue}
                                                    onChange={(e) => setEditingValue(e.target.value)}
                                                    autoFocus
                                                    className="h-10 rounded-lg bg-background border-primary/50"
                                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                                                />
                                                <Button size="icon" variant="ghost" onClick={handleUpdate} className="h-10 w-10 text-emerald-500 hover:bg-emerald-50">
                                                    <Check className="h-5 w-5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => setEditingIndex(null)} className="h-10 w-10 text-rose-500 hover:bg-rose-50">
                                                    <X className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-foreground leading-relaxed">
                                                        {advice}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-all translate-x-2 group-hover/item:translate-x-0">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary"
                                                        onClick={() => startEditing(index)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive"
                                                        onClick={() => handleDelete(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
