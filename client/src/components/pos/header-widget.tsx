import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, Info } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import type { Settings } from '../../../../shared/types';

export function HeaderWidget() {
    const [time, setTime] = useState(new Date());
    const [adviceIndex, setAdviceIndex] = useState(0);

    const { data: settings } = useQuery<Settings>({
        queryKey: ['/api/settings'],
        queryFn: async () => {
            const response = await apiRequest('GET', '/api/settings');
            return response.json();
        },
        staleTime: 5 * 60 * 1000,
    });

    const adviceList = React.useMemo(() => {
        try {
            if (settings?.adviceList) {
                return JSON.parse(settings.adviceList);
            }
        } catch (e) {
            console.error('Failed to parse adviceList', e);
        }
        return [
            "Remember to ask about gift wrapping!",
            "Suggest a loyalty card to new customers.",
            "Check for damaged packaging on items.",
            "Friendly smile goes a long way!"
        ];
    }, [settings?.adviceList]);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (adviceList.length > 1) {
            const adviceTimer = setInterval(() => {
                setAdviceIndex((prev) => (prev + 1) % adviceList.length);
            }, 10000); // Rotate every 10 seconds
            return () => clearInterval(adviceTimer);
        }
    }, [adviceList]);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    };

    return (
        <div className="flex items-center gap-4 px-4 py-1 bg-muted/30 rounded-lg border border-border/50 shadow-sm transition-all hover:bg-muted/50">
            {/* Clock Section */}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 pr-4 border-r border-border/50 cursor-default">
                            <Clock className="h-4 w-4 text-primary animate-pulse" />
                            <div className="flex flex-col">
                                <span className="text-sm font-bold tabular-nums leading-none">
                                    {formatTime(time)}
                                </span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                                    {formatDate(time)}
                                </span>
                            </div>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Current Server Time</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {/* Advice Section */}
            <div className="flex items-center gap-2 overflow-hidden min-w-[200px] max-w-[400px]">
                <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <div className="relative flex-1 overflow-hidden h-5">
                    <div
                        key={adviceIndex}
                        className="text-sm text-foreground animate-in slide-in-from-bottom-2 fade-in duration-500 truncate italic"
                    >
                        {adviceList[adviceIndex]}
                    </div>
                </div>
            </div>
        </div>
    );
}
