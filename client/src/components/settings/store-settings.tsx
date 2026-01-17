import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin, Store, Image as ImageIcon, QrCode, Upload } from 'lucide-react';
import { Settings } from '../../../../shared/types';
import { Button } from '@/components/ui/button';

interface StoreSettingsProps {
  settings: Settings;
  localStoreName?: string;
  localStoreAddress?: string;
  localStorePhone?: string;
  localStoreEmail?: string;
  logoPreview: string | null;
  qrPreview: string | null;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'qr') => void;
  updateSetting: (field: keyof Settings, value: any) => void;
}

export const StoreSettings: React.FC<StoreSettingsProps> = ({
  settings,
  localStoreName,
  localStoreAddress,
  localStorePhone,
  localStoreEmail,
  logoPreview,
  qrPreview,
  handleImageUpload,
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
              <CardTitle className="text-xl font-bold">Contact Details</CardTitle>
              <CardDescription>Public information shown on receipts and reports</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeName" className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Store className="h-3 w-3" /> Brand Name
              </Label>
              <Input
                id="storeName"
                className="bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-xl h-11"
                value={localStoreName ?? settings.storeName ?? ''}
                onChange={(e) => updateSetting('storeName', e.target.value)}
                placeholder="Enter your store name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeAddress" className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <MapPin className="h-3 w-3" /> Physical Address
              </Label>
              <Input
                id="storeAddress"
                className="bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-xl h-11"
                value={localStoreAddress ?? settings.storeAddress ?? ''}
                onChange={(e) => updateSetting('storeAddress', e.target.value)}
                placeholder="Enter your store address"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storePhone" className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Phone className="h-3 w-3" /> Phone Number
                </Label>
                <Input
                  id="storePhone"
                  className="bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-xl h-11"
                  value={localStorePhone ?? settings.storePhone ?? ''}
                  onChange={(e) => updateSetting('storePhone', e.target.value)}
                  placeholder="Enter your store phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeEmail" className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Mail className="h-3 w-3" /> Support Email
                </Label>
                <Input
                  id="storeEmail"
                  type="email"
                  className="bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-xl h-11"
                  value={localStoreEmail ?? settings.storeEmail ?? ''}
                  onChange={(e) => updateSetting('storeEmail', e.target.value)}
                  placeholder="Enter your store email"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Store Branding</CardTitle>
                <CardDescription>Upload your logo for digital and physical branding</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="relative group/logo shrink-0 w-32 h-32 rounded-2xl border-2 border-dashed border-border/50 bg-background/50 flex items-center justify-center overflow-hidden hover:border-primary/50 transition-all">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'logo')}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-sm">Store Logo</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Visible on receipts, reports, and the POS header.<br />
                  Recommended: 200x200px, transparent PNG.
                </p>
                <Button variant="outline" size="sm" className="h-8 rounded-lg mt-2 relative pointer-events-none">
                  Select Image
                </Button>
              </div>
            </div>

            <div className="h-px w-full bg-border/50" />

            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="relative group/qr shrink-0 w-32 h-32 rounded-2xl border-2 border-dashed border-border/50 bg-background/50 flex items-center justify-center overflow-hidden hover:border-primary/50 transition-all">
                {qrPreview ? (
                  <img src={qrPreview} alt="QR Preview" className="w-full h-full object-contain p-2" />
                ) : (
                  <QrCode className="h-8 w-8 text-muted-foreground/50" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/qr:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'qr')}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-sm">Payment QR Code</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Customers can scan this to pay via digital wallets.<br />
                  Recommended: High contrast, square aspect ratio.
                </p>
                <Button variant="outline" size="sm" className="h-8 rounded-lg mt-2 relative pointer-events-none">
                  Select Image
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
