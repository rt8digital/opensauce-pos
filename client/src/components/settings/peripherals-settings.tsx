import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Receipt, ScanLine, DollarSign, Scale, Monitor, Send, Printer, Bluetooth, Wifi, Cpu } from 'lucide-react';
import { Settings } from '../../../../shared/types';
import { BluetoothSettingsCard } from './bluetooth-settings-card';

interface PeripheralsSettingsProps {
  settings: Settings;
  updateSetting: (field: keyof Settings, value: any) => void;
  testPrinterConnection: () => void;
  printTestReceipt: () => void;
  testScannerConnection: () => void;
  testCashDrawerConnection: () => void;
  openCashDrawer: () => void;
  testCustomerDisplayConnection: () => void;
  updateCustomerDisplay: () => void;
  onDeviceConnected: (deviceId: string) => void;
}

export const PeripheralsSettings: React.FC<PeripheralsSettingsProps> = ({
  settings,
  updateSetting,
  testPrinterConnection,
  printTestReceipt,
  testScannerConnection,
  testCashDrawerConnection,
  openCashDrawer,
  testCustomerDisplayConnection,
  updateCustomerDisplay,
  onDeviceConnected,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Printer className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">POS Printer</CardTitle>
                <CardDescription>Main receipt printing unit</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Cpu className="h-3 w-3" /> Connection Type
                </Label>
                <Select
                  value={settings.printerType || 'usb'}
                  onValueChange={(value) => updateSetting('printerType', value)}
                >
                  <SelectTrigger className="bg-background/50 border-border/50 rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="usb">USB (Local)</SelectItem>
                    <SelectItem value="network">Network (WLAN/LAN)</SelectItem>
                    <SelectItem value="bluetooth">Bluetooth (Wireless)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings?.printerType === 'network' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Wifi className="h-3 w-3" /> IP Address
                  </Label>
                  <Input
                    value={settings.printerIp || ''}
                    onChange={(e) => updateSetting('printerIp', e.target.value)}
                    placeholder="192.168.1.100"
                    className="bg-background/50 border-border/50 rounded-xl h-11"
                  />
                </div>
              )}

              {settings?.printerType === 'bluetooth' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Bluetooth className="h-3 w-3" /> Device ID
                  </Label>
                  <Input
                    value={settings.printerDeviceId || ''}
                    onChange={(e) => updateSetting('printerDeviceId', e.target.value)}
                    placeholder="BT-001"
                    className="bg-background/50 border-border/50 rounded-xl h-11"
                  />
                </div>
              )}
            </div>

            {/* Printer Encoding Settings */}
            <div className="space-y-4 pt-4 border-t border-border/30">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-primary"></span> Character Encoding
                </Label>
                <Select
                  value={settings.printerCodepage || 'cp437'}
                  onValueChange={(value) => updateSetting('printerCodepage', value)}
                >
                  <SelectTrigger className="bg-background/50 border-border/50 rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="auto">Auto-detect (Recommended)</SelectItem>
                    <SelectItem value="cp437">CP437 (USA/Europe)</SelectItem>
                    <SelectItem value="cp850">CP850 (Multilingual)</SelectItem>
                    <SelectItem value="cp858">CP858 (Euro Symbol)</SelectItem>
                    <SelectItem value="cp1252">Windows-1252</SelectItem>
                    <SelectItem value="iso8859_1">ISO-8859-1</SelectItem>
                    <SelectItem value="utf8">UTF-8 (Experimental)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Select the character encoding for your thermal printer. Choose "Auto-detect" for automatic detection.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Printer Model
                  </Label>
                  <Input
                    value={settings.printerModel || ''}
                    onChange={(e) => updateSetting('printerModel', e.target.value)}
                    placeholder="e.g., EPSON TM-T88V"
                    className="bg-background/50 border-border/50 rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Manufacturer
                  </Label>
                  <Input
                    value={settings.printerManufacturer || ''}
                    onChange={(e) => updateSetting('printerManufacturer', e.target.value)}
                    placeholder="e.g., EPSON, BIXOLON"
                    className="bg-background/50 border-border/50 rounded-xl h-11"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button onClick={testPrinterConnection} variant="outline" className="h-10 rounded-xl border-border/50 bg-background/50">
                <Printer className="mr-2 h-4 w-4" />
                Connectivity Test
              </Button>
              <Button onClick={printTestReceipt} variant="outline" className="h-10 rounded-xl border-border/50 bg-background/50">
                <Receipt className="mr-2 h-4 w-4" />
                Sample Print
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <ScanLine className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Barcode Scanner</CardTitle>
                <CardDescription>Input device for product lookup</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Scanner Interface</Label>
              <Select
                value={settings.scannerType || 'usb'}
                onValueChange={(value) => updateSetting('scannerType', value)}
              >
                <SelectTrigger className="bg-background/50 border-border/50 rounded-xl h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="usb">USB (HID/Virtual COM)</SelectItem>
                  <SelectItem value="bluetooth">Bluetooth Scanner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-4">
              <Button onClick={testScannerConnection} variant="outline" className="w-full h-11 rounded-xl border-border/50 bg-background/50">
                <ScanLine className="mr-2 h-4 w-4" />
                Initialize Scanner
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Cash Drawer</CardTitle>
                <CardDescription>Fiscal storage with automated trigger</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Connection Port</Label>
                <Input
                  value={settings.cashDrawerPort || ''}
                  onChange={(e) => updateSetting('cashDrawerPort', e.target.value)}
                  placeholder="COM1 / USB Port"
                  className="bg-background/50 border-border/50 rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Trigger Pulse (ms)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={settings.cashDrawerPulse || 100}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d+$/.test(value)) {
                      updateSetting('cashDrawerPulse', value === '' ? 100 : parseInt(value) || 100);
                    }
                  }}
                  className="bg-background/50 border-border/50 rounded-xl h-11"
                />
              </div>
            </div>
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button onClick={testCashDrawerConnection} variant="outline" className="h-10 rounded-xl border-border/50 bg-background/50">
                <Scale className="mr-2 h-4 w-4" />
                Test Voltage
              </Button>
              <Button onClick={openCashDrawer} variant="outline" className="h-10 rounded-xl border-border/50 bg-background/50">
                <DollarSign className="mr-2 h-4 w-4" />
                Kick Drawer
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                <Monitor className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Customer UI</CardTitle>
                <CardDescription>Feature not yet implimented (Coming Soon)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Hardware Type</Label>
                <Select
                  value={settings.customerDisplayType || 'none'}
                  onValueChange={(value) => updateSetting('customerDisplayType', value)}
                >
                  <SelectTrigger className="bg-background/50 border-border/50 rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none">Disabled</SelectItem>
                    <SelectItem value="hdmi">HDMI / Virtual Screen</SelectItem>
                    <SelectItem value="bluetooth">BT Customer Panel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {settings?.customerDisplayType === 'bluetooth' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Bluetooth className="h-3 w-3" /> Panel ID
                  </Label>
                  <Input
                    value={settings.customerDisplayValue || ''}
                    onChange={(e) => updateSetting('customerDisplayValue', e.target.value)}
                    placeholder="PANEL-01"
                    className="bg-background/50 border-border/50 rounded-xl h-11"
                  />
                </div>
              )}
            </div>
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={async () => {
                  if (window.electronAPI && window.electronAPI.openCustomerDisplay) {
                    await window.electronAPI.openCustomerDisplay();
                  }
                  testCustomerDisplayConnection();
                }}
                variant="outline"
                className="h-10 rounded-xl border-border/50 bg-background/50 hover:bg-primary/5 hover:border-primary/50 transition-all shadow-sm"
              >
                <Monitor className="mr-2 h-4 w-4" />
                Launch Display
              </Button>
              <Button onClick={updateCustomerDisplay} variant="outline" className="h-10 rounded-xl border-border/50 bg-background/50 hover:bg-primary/5 hover:border-primary/50 transition-all shadow-sm">
                <Send className="mr-2 h-4 w-4" />
                Push Test Info
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <BluetoothSettingsCard onDeviceConnected={onDeviceConnected} />
    </div>
  );
};