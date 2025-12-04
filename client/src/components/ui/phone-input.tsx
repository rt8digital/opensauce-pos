import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { countries } from '@/lib/countries';

interface PhoneInputProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function PhoneInput({ value = '', onChange, placeholder = 'Phone number', className }: PhoneInputProps) {
    const [countryCode, setCountryCode] = useState('+27'); // Default to South Africa
    const [phoneNumber, setPhoneNumber] = useState('');

    // Parse initial value if provided
    React.useEffect(() => {
        if (value) {
            // Try to extract country code and number
            const match = value.match(/^(\+\d+)\s*(.*)$/);
            if (match) {
                setCountryCode(match[1]);
                setPhoneNumber(match[2]);
            } else {
                setPhoneNumber(value);
            }
        }
    }, [value]);

    const handleCountryCodeChange = (newCountryCode: string) => {
        setCountryCode(newCountryCode);
        const fullNumber = `${newCountryCode} ${phoneNumber}`.trim();
        onChange?.(fullNumber);
    };

    const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPhoneNumber = e.target.value.replace(/\D/g, ''); // Only allow digits
        setPhoneNumber(newPhoneNumber);
        const fullNumber = `${countryCode} ${newPhoneNumber}`.trim();
        onChange?.(fullNumber);
    };

    const selectedCountry = useMemo(() => {
        return countries.find(country => country.code === countryCode);
    }, [countryCode]);

    return (
        <div className={`flex ${className}`}>
            <Select value={countryCode} onValueChange={handleCountryCodeChange}>
                <SelectTrigger className="w-32 rounded-r-none border-r-0">
                    <SelectValue>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{selectedCountry?.flag}</span>
                            <span className="text-sm font-medium">{countryCode}</span>
                        </div>
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{country.flag}</span>
                                <span className="text-sm font-medium">{country.code}</span>
                                <span className="text-xs text-muted-foreground ml-2">{country.name}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Input
                type="tel"
                placeholder={placeholder}
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                className="rounded-l-none flex-1"
            />
        </div>
    );
}
