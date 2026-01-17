import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ReceiptPreview } from '@/components/pos/receipt-preview';
import { Button } from '@/components/ui/button';
import { Layout, Type, ListChecks, QrCode, Printer, Eye, Palette, Scissors } from 'lucide-react';
import type { Settings } from '../../../../shared/types';

interface ReceiptSettingsProps {
  settings: Settings;
  localReceiptWidth?: string;
  localReceiptHeaderText?: string;
  localReceiptFooterText?: string;
  localReceiptShowLogo?: boolean;
  localReceiptShowOrderNumber?: boolean;
  localReceiptShowDate?: boolean;
  localReceiptShowCustomer?: boolean;
  localReceiptShowPaymentMethod?: boolean;
  localReceiptShowBarcode?: boolean;
  localReceiptShowQrCode?: boolean;
  localReceiptQrCodeScale?: number;

  // New customization props passed from parent
  localReceiptHeaderFont?: string;
  localReceiptHeaderScale?: number;
  localReceiptItemsFont?: string;
  localReceiptItemsScale?: number;
  localReceiptNumbersFont?: string;
  localReceiptNumbersScale?: number;
  localReceiptDetailsFont?: string;
  localReceiptDetailsScale?: number;
  localReceiptMetadataFont?: string;
  localReceiptMetadataScale?: number;
  localReceiptShowItemDivider?: boolean;
  localReceiptItemDividerStyle?: 'solid' | 'dashed' | 'dotted';
  localReceiptShowTotalDivider?: boolean;
  localReceiptCompactMode?: boolean;
  localReceiptLogoScale?: number;
  localReceiptDividerOpacity?: number;
  qrPreview?: string | null;
  logoPreview: string | null;
  updateSetting: (field: keyof Settings, value: any) => void;
  printTestReceipt: () => void;
}

export const ReceiptSettings: React.FC<ReceiptSettingsProps> = ({
  settings,
  localReceiptWidth,
  localReceiptHeaderText,
  localReceiptFooterText,
  localReceiptShowLogo,
  localReceiptShowOrderNumber,
  localReceiptShowDate,
  localReceiptShowCustomer,
  localReceiptShowPaymentMethod,
  localReceiptShowBarcode,
  localReceiptShowQrCode,
  localReceiptQrCodeScale,

  localReceiptHeaderFont,
  localReceiptHeaderScale,
  localReceiptItemsFont,
  localReceiptItemsScale,
  localReceiptNumbersFont,
  localReceiptNumbersScale,
  localReceiptDetailsFont,
  localReceiptDetailsScale,
  localReceiptMetadataFont,
  localReceiptMetadataScale,
  localReceiptShowItemDivider,
  localReceiptItemDividerStyle,
  localReceiptShowTotalDivider,
  localReceiptCompactMode,
  localReceiptLogoScale,
  localReceiptDividerOpacity,

  qrPreview,
  logoPreview,
  updateSetting,
  printTestReceipt,
}) => {
  const qrScale = localReceiptQrCodeScale ?? settings.qrCodeScale ?? 100;

  const fontOptions = [
    { value: 'standard', label: 'Classic Thermal' },
    { value: 'modern', label: 'Premium Sans' },
    { value: 'condensed', label: 'Tight Narrow' },
    { value: 'mono', label: 'Digital Mono' },
    { value: 'custom', label: 'Custom System Font' },
  ];

  const isPresetFont = (font?: string) => !font || ['standard', 'modern', 'condensed', 'mono'].includes(font);

  const previewSettings: Settings = {
    ...settings,
    receiptWidth: localReceiptWidth ?? settings.receiptWidth,
    receiptHeaderText: localReceiptHeaderText ?? settings.receiptHeaderText,
    receiptFooterText: localReceiptFooterText ?? settings.receiptFooterText,
    receiptShowLogo: localReceiptShowLogo ?? settings.receiptShowLogo,
    receiptShowOrderNumber: localReceiptShowOrderNumber ?? settings.receiptShowOrderNumber,
    receiptShowDate: localReceiptShowDate ?? settings.receiptShowDate,
    receiptShowCustomer: localReceiptShowCustomer ?? settings.receiptShowCustomer,
    receiptShowPaymentMethod: localReceiptShowPaymentMethod ?? settings.receiptShowPaymentMethod,
    receiptShowBarcode: localReceiptShowBarcode ?? settings.receiptShowBarcode,
    receiptShowQrCode: localReceiptShowQrCode ?? settings.receiptShowQrCode,
    qrCodeScale: localReceiptQrCodeScale ?? settings.qrCodeScale,
    receiptHeaderFont: localReceiptHeaderFont ?? settings.receiptHeaderFont,
    receiptHeaderScale: localReceiptHeaderScale ?? settings.receiptHeaderScale,
    receiptItemsFont: localReceiptItemsFont ?? settings.receiptItemsFont,
    receiptItemsScale: localReceiptItemsScale ?? settings.receiptItemsScale,
    receiptNumbersFont: localReceiptNumbersFont ?? settings.receiptNumbersFont,
    receiptNumbersScale: localReceiptNumbersScale ?? settings.receiptNumbersScale,
    receiptDetailsFont: localReceiptDetailsFont ?? settings.receiptDetailsFont,
    receiptDetailsScale: localReceiptDetailsScale ?? settings.receiptDetailsScale,
    receiptMetadataFont: localReceiptMetadataFont ?? settings.receiptMetadataFont,
    receiptMetadataScale: localReceiptMetadataScale ?? settings.receiptMetadataScale,
    receiptShowItemDivider: localReceiptShowItemDivider ?? settings.receiptShowItemDivider,
    receiptItemDividerStyle: localReceiptItemDividerStyle ?? (settings.receiptItemDividerStyle as any),
    receiptShowTotalDivider: localReceiptShowTotalDivider ?? settings.receiptShowTotalDivider,
    receiptCompactMode: localReceiptCompactMode ?? settings.receiptCompactMode,
    receiptLogoScale: localReceiptLogoScale ?? settings.receiptLogoScale,
    receiptDividerOpacity: localReceiptDividerOpacity ?? settings.receiptDividerOpacity,
    paymentQrCode: qrPreview ?? settings.paymentQrCode,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-12 xl:col-span-8 space-y-6">
        {/* Basic Dimensions & Mode */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Layout className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">Paper & Layout</CardTitle>
                  <CardDescription>Size and spacing control</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Width Standard</Label>
                <Select
                  value={localReceiptWidth ?? settings.receiptWidth ?? '80mm'}
                  onValueChange={(value) => updateSetting('receiptWidth', value)}
                >
                  <SelectTrigger className="bg-background/50 border-border/50 rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="58mm">58mm (Narrow Role)</SelectItem>
                    <SelectItem value="80mm">80mm (Standard Role)</SelectItem>
                    <SelectItem value="custom">Custom Dimensions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10 transition-colors">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold">Compact Mode</Label>
                  <p className="text-[10px] text-muted-foreground tracking-tight">Reduce vertical spacing for shorter receipts</p>
                </div>
                <Switch
                  checked={localReceiptCompactMode ?? settings.receiptCompactMode ?? false}
                  onCheckedChange={(checked) => updateSetting('receiptCompactMode', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <Palette className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">Store Branding</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
                <Label className="text-sm font-bold">Display Store Logo</Label>
                <Switch
                  checked={localReceiptShowLogo ?? settings.receiptShowLogo ?? true}
                  onCheckedChange={(checked) => updateSetting('receiptShowLogo', checked)}
                />
              </div>

              {(localReceiptShowLogo ?? settings.receiptShowLogo ?? true) && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Logo Visual Scale</Label>
                    <span className="text-xs font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-md">{localReceiptLogoScale ?? settings.receiptLogoScale ?? 100}%</span>
                  </div>
                  <div className="px-1">
                    <Slider
                      min={10} max={200} step={5}
                      value={[localReceiptLogoScale ?? settings.receiptLogoScale ?? 100]}
                      onValueChange={(v) => updateSetting('receiptLogoScale', v[0])}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <Scissors className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">Item Separators</CardTitle>
                  <CardDescription>Visual breaks between items</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
                <Label className="text-sm font-medium">Show Item Dividers</Label>
                <Switch
                  checked={localReceiptShowItemDivider ?? settings.receiptShowItemDivider ?? true}
                  onCheckedChange={(checked) => updateSetting('receiptShowItemDivider', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
                <Label className="text-sm font-medium">Show Total Divider</Label>
                <Switch
                  checked={localReceiptShowTotalDivider ?? settings.receiptShowTotalDivider ?? true}
                  onCheckedChange={(checked) => updateSetting('receiptShowTotalDivider', checked)}
                />
              </div>

              {(localReceiptShowItemDivider ?? settings.receiptShowItemDivider ?? true) && (
                <div className="space-y-4 pt-1 animate-in fade-in slide-in-from-top-1">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Divider Style</Label>
                    <Select
                      value={localReceiptItemDividerStyle ?? settings.receiptItemDividerStyle ?? 'dashed'}
                      onValueChange={(value) => updateSetting('receiptItemDividerStyle', value)}
                    >
                      <SelectTrigger className="bg-background/50 border-border/50 rounded-xl h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="solid">Solid Line</SelectItem>
                        <SelectItem value="dashed">Dashed Line</SelectItem>
                        <SelectItem value="dotted">Dotted Line</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Line Shade (Darkness)</Label>
                      <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md">{localReceiptDividerOpacity ?? settings.receiptDividerOpacity ?? 20}%</span>
                    </div>
                    <div className="px-1">
                      <Slider
                        min={5} max={100} step={5}
                        value={[localReceiptDividerOpacity ?? settings.receiptDividerOpacity ?? 20]}
                        onValueChange={(v) => updateSetting('receiptDividerOpacity', v[0])}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Font Customization */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-violet-500" />
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500">
                <Palette className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Robust Font Control</CardTitle>
                <CardDescription>Independent font and scale for key sections</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Header Font Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Store Header</Label>
                <span className="text-xs font-bold text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded-md">Scale: {localReceiptHeaderScale ?? settings.receiptHeaderScale ?? 100}%</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Select
                    value={isPresetFont(localReceiptHeaderFont ?? settings.receiptHeaderFont) ? (localReceiptHeaderFont ?? settings.receiptHeaderFont ?? 'standard') : 'custom'}
                    onValueChange={(value) => updateSetting('receiptHeaderFont', value === 'custom' ? 'Arial' : value)}
                  >
                    <SelectTrigger className="bg-background/50 border-border/50 rounded-xl h-11 font-medium">
                      <SelectValue placeholder="Select Header Font" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {fontOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {!isPresetFont(localReceiptHeaderFont ?? settings.receiptHeaderFont) && (
                    <Input
                      className="bg-background/50 border-border/50 rounded-xl h-10 text-xs"
                      value={localReceiptHeaderFont ?? settings.receiptHeaderFont ?? ''}
                      onChange={(e) => updateSetting('receiptHeaderFont', e.target.value)}
                      placeholder="Enter Font (e.g. Times New Roman)"
                    />
                  )}
                </div>
                <div className="flex items-center px-2">
                  <Slider
                    min={50} max={250} step={5}
                    value={[localReceiptHeaderScale ?? settings.receiptHeaderScale ?? 100]}
                    onValueChange={(v) => updateSetting('receiptHeaderScale', v[0])}
                  />
                </div>
              </div>
            </div>

            {/* Items Font Section */}
            <div className="space-y-4 pt-2 border-t border-border/10">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Product Items</Label>
                <span className="text-xs font-bold text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded-md">Scale: {localReceiptItemsScale ?? settings.receiptItemsScale ?? 100}%</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Select
                    value={isPresetFont(localReceiptItemsFont ?? settings.receiptItemsFont) ? (localReceiptItemsFont ?? settings.receiptItemsFont ?? 'standard') : 'custom'}
                    onValueChange={(value) => updateSetting('receiptItemsFont', value === 'custom' ? 'Arial' : value)}
                  >
                    <SelectTrigger className="bg-background/50 border-border/50 rounded-xl h-11 font-medium">
                      <SelectValue placeholder="Select Item Font" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {fontOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {!isPresetFont(localReceiptItemsFont ?? settings.receiptItemsFont) && (
                    <Input
                      className="bg-background/50 border-border/50 rounded-xl h-10 text-xs"
                      value={localReceiptItemsFont ?? settings.receiptItemsFont ?? ''}
                      onChange={(e) => updateSetting('receiptItemsFont', e.target.value)}
                      placeholder="Enter Font Name"
                    />
                  )}
                </div>
                <div className="flex items-center px-2">
                  <Slider
                    min={50} max={250} step={5}
                    value={[localReceiptItemsScale ?? settings.receiptItemsScale ?? 100]}
                    onValueChange={(v) => updateSetting('receiptItemsScale', v[0])}
                  />
                </div>
              </div>
            </div>

            {/* Numbers Font Section */}
            <div className="space-y-4 pt-2 border-t border-border/10">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Price & Totals</Label>
                <span className="text-xs font-bold text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded-md">Scale: {localReceiptNumbersScale ?? settings.receiptNumbersScale ?? 100}%</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Select
                    value={isPresetFont(localReceiptNumbersFont ?? settings.receiptNumbersFont) ? (localReceiptNumbersFont ?? settings.receiptNumbersFont ?? 'mono') : 'custom'}
                    onValueChange={(value) => updateSetting('receiptNumbersFont', value === 'custom' ? 'Arial' : value)}
                  >
                    <SelectTrigger className="bg-background/50 border-border/50 rounded-xl h-11 font-medium">
                      <SelectValue placeholder="Select Number Font" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {fontOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {!isPresetFont(localReceiptNumbersFont ?? settings.receiptNumbersFont) && (
                    <Input
                      className="bg-background/50 border-border/50 rounded-xl h-10 text-xs"
                      value={localReceiptNumbersFont ?? settings.receiptNumbersFont ?? ''}
                      onChange={(e) => updateSetting('receiptNumbersFont', e.target.value)}
                      placeholder="Enter Font Name"
                    />
                  )}
                </div>
                <div className="flex items-center px-2">
                  <Slider
                    min={50} max={250} step={5}
                    value={[localReceiptNumbersScale ?? settings.receiptNumbersScale ?? 100]}
                    onValueChange={(v) => updateSetting('receiptNumbersScale', v[0])}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4 pt-4 border-t border-border/10">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Item Details (Qty/Price)</Label>
                <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">Scale: {localReceiptDetailsScale ?? settings.receiptDetailsScale ?? 90}%</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Select
                    value={isPresetFont(localReceiptDetailsFont ?? settings.receiptDetailsFont) ? (localReceiptDetailsFont ?? settings.receiptDetailsFont ?? 'mono') : 'custom'}
                    onValueChange={(value) => updateSetting('receiptDetailsFont', value === 'custom' ? 'Arial' : value)}
                  >
                    <SelectTrigger className="bg-background/50 border-border/50 rounded-xl h-11 font-medium">
                      <SelectValue placeholder="Select Details Font" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {fontOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {!isPresetFont(localReceiptDetailsFont ?? settings.receiptDetailsFont) && (
                    <Input
                      className="bg-background/50 border-border/50 rounded-xl h-10 text-xs"
                      value={localReceiptDetailsFont ?? settings.receiptDetailsFont ?? ''}
                      onChange={(e) => updateSetting('receiptDetailsFont', e.target.value)}
                      placeholder="Enter Font Name"
                    />
                  )}
                </div>
                <div className="flex items-center px-2">
                  <Slider
                    min={50} max={200} step={5}
                    value={[localReceiptDetailsScale ?? settings.receiptDetailsScale ?? 90]}
                    onValueChange={(v) => updateSetting('receiptDetailsScale', v[0])}
                  />
                </div>
              </div>
            </div>

            {/* Metadata Font Section */}
            <div className="space-y-4 pt-4 border-t border-border/10">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Order Info (ID/Date/Customer)</Label>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">Scale: {localReceiptMetadataScale ?? settings.receiptMetadataScale ?? 80}%</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Select
                    value={isPresetFont(localReceiptMetadataFont ?? settings.receiptMetadataFont) ? (localReceiptMetadataFont ?? settings.receiptMetadataFont ?? 'standard') : 'custom'}
                    onValueChange={(value) => updateSetting('receiptMetadataFont', value === 'custom' ? 'Arial' : value)}
                  >
                    <SelectTrigger className="bg-background/50 border-border/50 rounded-xl h-11 font-medium">
                      <SelectValue placeholder="Select Metadata Font" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {fontOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {!isPresetFont(localReceiptMetadataFont ?? settings.receiptMetadataFont) && (
                    <Input
                      className="bg-background/50 border-border/50 rounded-xl h-10 text-xs"
                      value={localReceiptMetadataFont ?? settings.receiptMetadataFont ?? ''}
                      onChange={(e) => updateSetting('receiptMetadataFont', e.target.value)}
                      placeholder="Enter Font Name"
                    />
                  )}
                </div>
                <div className="flex items-center px-2">
                  <Slider
                    min={40} max={180} step={5}
                    value={[localReceiptMetadataScale ?? settings.receiptMetadataScale ?? 80]}
                    onValueChange={(v) => updateSetting('receiptMetadataScale', v[0])}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messaging & Visibility */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-400" />
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-400/10 text-blue-400">
                  <Type className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">Custom Messaging</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Header Message</Label>
                <Input
                  className="bg-background/50 border-border/50 rounded-xl h-11"
                  value={localReceiptHeaderText ?? settings.receiptHeaderText ?? ''}
                  onChange={(e) => updateSetting('receiptHeaderText', e.target.value)}
                  placeholder="Thank you for shopping!"
                />
              </div>
              <div className="space-y-2 pt-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Footer Message</Label>
                <Input
                  className="bg-background/50 border-border/50 rounded-xl h-11"
                  value={localReceiptFooterText ?? settings.receiptFooterText ?? ''}
                  onChange={(e) => updateSetting('receiptFooterText', e.target.value)}
                  placeholder="Visit us again soon!"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <ListChecks className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">Visibility</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-y-3">
              {[
                { id: 'receiptShowOrderNumber', label: 'Order ID', checked: localReceiptShowOrderNumber ?? settings.receiptShowOrderNumber ?? true },
                { id: 'receiptShowDate', label: 'Date & Time', checked: localReceiptShowDate ?? settings.receiptShowDate ?? true },
                { id: 'receiptShowCustomer', label: 'Customer Name', checked: localReceiptShowCustomer ?? settings.receiptShowCustomer ?? true },
                { id: 'receiptShowPaymentMethod', label: 'Payment Method', checked: localReceiptShowPaymentMethod ?? settings.receiptShowPaymentMethod ?? true },
                { id: 'receiptShowBarcode', label: 'Receipt Barcode', checked: localReceiptShowBarcode ?? settings.receiptShowBarcode ?? false },
              ].map((opt) => (
                <div key={opt.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted text-xs font-medium">
                  <Label htmlFor={opt.id} className="cursor-pointer">{opt.label}</Label>
                  <Switch
                    id={opt.id}
                    checked={opt.checked}
                    onCheckedChange={(checked) => updateSetting(opt.id as any, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">QR Scaling</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/30">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold">Show QR Code</Label>
                </div>
                <Switch
                  checked={localReceiptShowQrCode ?? settings.receiptShowQrCode ?? false}
                  onCheckedChange={(checked) => updateSetting('receiptShowQrCode', checked)}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Visual Size</Label>
                  <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">{qrScale}px</span>
                </div>
                <div className="px-1">
                  <Slider
                    min={50} max={250} step={10}
                    value={[qrScale]}
                    onValueChange={(value) => updateSetting('qrCodeScale', value[0])}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                  <Printer className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">Hardware</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
                <Label className="text-sm font-medium text-xs">Continuous Print</Label>
                <Switch
                  checked={settings.receiptContinuousPrinting ?? false}
                  onCheckedChange={(checked) => updateSetting('receiptContinuousPrinting', checked)}
                />
              </div>
              <div className="space-y-2 pt-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Rows Per Segment</Label>
                <Input
                  type="number"
                  className="bg-background/50 border-border/50 rounded-xl h-11"
                  value={settings.receiptMaxLinesPerPage || 50}
                  onChange={(e) => updateSetting('receiptMaxLinesPerPage', parseInt(e.target.value) || 50)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="lg:col-span-12 xl:col-span-4 sticky top-24">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl shadow-black/10 overflow-hidden min-h-[600px] flex flex-col">
          <div className="absolute top-0 right-0 w-1 h-full bg-primary/50" />
          <CardHeader className="pb-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Robust Preview</CardTitle>
                <CardDescription>Visualizing your custom fonts</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center p-6 bg-muted/40 overflow-y-auto">
            <div className="w-full h-full flex flex-col items-center">
              <div className="receipt-container-wrapper relative w-fit shadow-2xl transition-all duration-300 hover:scale-[1.05]">
                <ReceiptPreview
                  settings={previewSettings}
                  logoPreview={logoPreview}
                />
              </div>
            </div>
          </CardContent>
          <div className="p-6 border-t border-border/50 bg-muted/30 space-y-3">
            <Button onClick={printTestReceipt} className="w-full h-11 rounded-xl bg-primary font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
              <Printer className="mr-2 h-4 w-4" />
              Standard Test Print
            </Button>
            <p className="text-[10px] text-center text-muted-foreground font-medium italic">Scaling is simulated relative to 80mm standard</p>
          </div>
        </Card>
      </div>
    </div>
  );
};