import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Settings } from '@shared/schema';

type TranslationContextType = {
    t: (text: string) => string;
    language: string;
    isTranslating: boolean;
    translateAsync: (text: string) => Promise<string>;
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

// Translation cache to avoid repeated API calls
const translationCache = new Map<string, string>();

export function TranslationProvider({ children }: { children: React.ReactNode }) {
    const [translations, setTranslations] = useState<Record<string, string>>({});
    const [isTranslating, setIsTranslating] = useState(false);

    // Fetch settings to get current language
    const { data: settings } = useQuery<Settings>({
        queryKey: ['/api/settings'],
    });

    const language = settings?.language || 'en';

    // Translation mutation
    const translateMutation = useMutation({
        mutationFn: async ({ text, targetLang }: { text: string; targetLang: string }) => {
            const response = await apiRequest('POST', '/api/translate', { text, targetLang });
            const data = await response.json();
            return data.translatedText;
        },
    });

    // Synchronous translation function for UI text
    const t = useCallback((text: string): string => {
        // If language is English or text is empty, return as-is
        if (language === 'en' || !text.trim()) {
            return text;
        }

        // Check cache first
        const cacheKey = `${text}:${language}`;
        if (translationCache.has(cacheKey)) {
            return translationCache.get(cacheKey)!;
        }

        // Return original text initially, translation will be updated asynchronously
        return text;
    }, [language]);

    // Asynchronous translation function
    const translateAsync = useCallback(async (text: string): Promise<string> => {
        // If language is English or text is empty, return as-is
        if (language === 'en' || !text.trim()) {
            return text;
        }

        // Check cache first
        const cacheKey = `${text}:${language}`;
        if (translationCache.has(cacheKey)) {
            return translationCache.get(cacheKey)!;
        }

        try {
            setIsTranslating(true);
            const translatedText = await translateMutation.mutateAsync({ text, targetLang: language });

            // Cache the result
            translationCache.set(cacheKey, translatedText);

            return translatedText;
        } catch (error) {
            console.error('Translation failed:', error);
            // Fallback to original text
            return text;
        } finally {
            setIsTranslating(false);
        }
    }, [language, translateMutation]);

    return (
        <TranslationContext.Provider value={{ t, language, isTranslating, translateAsync }}>
            {children}
        </TranslationContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(TranslationContext);
    if (context === undefined) {
        throw new Error('useTranslation must be used within a TranslationProvider');
    }
    return context;
}
