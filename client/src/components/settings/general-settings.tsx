import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Store, Monitor, Settings as SettingsIcon, Globe, Languages } from 'lucide-react';
import { Settings } from '../../../../shared/types';

interface GeneralSettingsProps {
  settings: Settings;
  localStoreName?: string;
  localStoreAddress?: string;
  localStorePhone?: string;
  localTaxRate?: number;
  localCurrency?: string;
  localEnableCustomerDisplay?: boolean;
  localEnableBluetoothPeripherals?: boolean;
  localTheme?: string;
  localLanguage?: string;
  localVatPercentage?: number;
  localVatNumber?: string;
  updateSetting: (field: keyof Settings, value: any) => void;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  settings,
  localStoreName,
  localStoreAddress,
  localStorePhone,
  localTaxRate,
  localCurrency,
  localEnableCustomerDisplay,
  localEnableBluetoothPeripherals,
  localTheme,
  localLanguage,
  localVatPercentage,
  localVatNumber,
  updateSetting,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Store Profile</CardTitle>
              <CardDescription>Configure your core business details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="storeName" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Store Name</Label>
              <Input
                id="storeName"
                className="bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-xl h-11"
                placeholder="My Awesome Store"
                value={localStoreName ?? settings.storeName ?? ''}
                onChange={(e) => updateSetting('storeName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeAddress" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Location</Label>
              <Input
                id="storeAddress"
                className="bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-xl h-11"
                placeholder="123 Business St, City"
                value={localStoreAddress ?? settings.storeAddress ?? ''}
                onChange={(e) => updateSetting('storeAddress', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="storePhone" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Contact Phone</Label>
              <Input
                id="storePhone"
                className="bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-xl h-11"
                placeholder="+1 234 567 890"
                value={localStorePhone ?? settings.storePhone ?? ''}
                onChange={(e) => updateSetting('storePhone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRate" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Sales Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="text"
                className="bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-xl h-11"
                inputMode="decimal"
                value={localTaxRate ?? settings.taxRate ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    updateSetting('taxRate', value === '' ? 0 : parseFloat(value) || 0);
                  }
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Operational Currency</Label>
            <Select value={localCurrency ?? settings.currency ?? 'R'} onValueChange={(value) => updateSetting('currency', value)}>
              <SelectTrigger className="bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-xl h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50">
                <SelectItem value="R">R - South African Rand (ZAR)</SelectItem>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50 group/item hover:bg-muted/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-background shadow-sm text-primary group-hover/item:scale-110 transition-transform">
                  <Monitor className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold">Customer Display</span>
                  <span className="text-[10px] text-muted-foreground">Show order summary to customers</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest border-primary/20 hover:bg-primary/5 transition-all"
                  onClick={async () => {
                    if (window.electronAPI && window.electronAPI.openCustomerDisplay) {
                      await window.electronAPI.openCustomerDisplay();
                    }
                  }}
                >
                  Launch
                </Button>
                <Switch
                  id="enableCustomerDisplay"
                  checked={localEnableCustomerDisplay ?? settings.enableCustomerDisplay ?? false}
                  onCheckedChange={(checked) => updateSetting('enableCustomerDisplay', checked)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50 group/item hover:bg-muted/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-background shadow-sm text-blue-500 group-hover/item:scale-110 transition-transform">
                  <Languages className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold">Bluetooth Peripherals</span>
                  <span className="text-[10px] text-muted-foreground">Feature not yet implimented (Coming Soon)</span>
                </div>
              </div>
              <Switch
                id="enableBluetoothPeripherals"
                checked={localEnableBluetoothPeripherals ?? settings.enableBluetoothPeripherals ?? false}
                onCheckedChange={(checked) => updateSetting('enableBluetoothPeripherals', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Localization</CardTitle>
                <CardDescription>Visual themes and language preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="theme" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Visual Theme</Label>
              <Select value={localTheme ?? settings.theme ?? 'light'} onValueChange={(value) => updateSetting('theme', value)}>
                <SelectTrigger className="bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-xl h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  <SelectItem value="light">Light Mode</SelectItem>
                  <SelectItem value="dark">Dark Mode</SelectItem>
                  <SelectItem value="system">System Default</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language" className="text-xs font-black uppercase tracking-widest text-muted-foreground">App Language</Label>
              <Select value={localLanguage ?? settings.language ?? 'en'} onValueChange={(value) => updateSetting('language', value)}>
                <SelectTrigger className="bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-xl h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  <SelectItem value="en">English (General)</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <SettingsIcon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Tax & VAT</CardTitle>
                <CardDescription>Fiscal and taxation compliance settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="vatPercentage" className="text-xs font-black uppercase tracking-widest text-muted-foreground">VAT Percentage (%)</Label>
                <Input
                  id="vatPercentage"
                  type="text"
                  inputMode="decimal"
                  className="bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-xl h-11"
                  value={localVatPercentage ?? settings.vatPercentage ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      updateSetting('vatPercentage', value === '' ? 0 : parseFloat(value) || 0);
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vatNumber" className="text-xs font-black uppercase tracking-widest text-muted-foreground">VAT Registration #</Label>
                <Input
                  id="vatNumber"
                  placeholder="TAX-12345678"
                  className="bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-xl h-11"
                  value={localVatNumber ?? settings.vatNumber ?? ''}
                  onChange={(e) => updateSetting('vatNumber', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};