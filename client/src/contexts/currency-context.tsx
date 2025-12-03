import * as React from 'react';
import { useState, useEffect, createContext, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';

type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'INR' | 'ZAR';

interface Currency {
    code: CurrencyCode;
    symbol: string;
    rate: number; // Exchange rate relative to base currency (USD)
}

interface CurrencyContextType {
    currency: Currency;
    setCurrency: (symbol: string) => void;
    availableCurrencies: Currency[];
    formatPrice: (price: number | string) => string;
    isLoading: boolean;
}

// Expanded currency list to include all currencies from settings
const currencyMap: Record<string, Currency> = {
    'R': { code: 'ZAR', symbol: 'R', rate: 18.5 },
    '$': { code: 'USD', symbol: '$', rate: 1 },
    '€': { code: 'EUR', symbol: '€', rate: 0.92 },
    '£': { code: 'GBP', symbol: '£', rate: 0.79 },
    '¥': { code: 'JPY', symbol: '¥', rate: 150.5 },
    '₹': { code: 'INR', symbol: '₹', rate: 83.3 },
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();
    
    // Fetch settings to get the current currency
    const { data: settings, isLoading } = useQuery({
        queryKey: ['/api/settings'],
        queryFn: async () => {
            const response = await apiRequest('GET', '/api/settings');
            return response.json();
        },
    });

    const [currentCurrency, setCurrentCurrency] = useState<Currency>(currencyMap['R']);

    // Sync currency when settings change
    useEffect(() => {
        if (settings?.currency) {
            const currency = currencyMap[settings.currency] || currencyMap['R'];
            setCurrentCurrency(currency);
        }
    }, [settings]);

    const setCurrency = async (symbol: string) => {
        // Update settings with new currency
        try {
            await apiRequest('PATCH', '/api/settings', { currency: symbol });
            // Invalidate settings query to trigger refetch
            queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
        } catch (error) {
            console.error('Failed to update currency:', error);
        }
    };

    const formatPrice = (price: number | string) => {
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        // For now, we'll format without conversion since we're using the symbol directly
        return `${currentCurrency.symbol}${numPrice.toFixed(2)}`;
    };

    return (
        <CurrencyContext.Provider value={{ 
            currency: currentCurrency, 
            setCurrency, 
            availableCurrencies: Object.values(currencyMap),
            formatPrice,
            isLoading
        }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
}
