import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Receipt, ScanLine, DollarSign, Scale, Monitor, Send, Printer } from 'lucide-react';
import { Settings } from '../../../../shared/types';
import { BluetoothSettingsCard } from './bluetooth-settings-card';

interface PeripheralsSettingsProps {
  settings: Settings;
  setPrinterType: (value: string) => void;
  setPrinterIp: (value: string) => void;
  setScannerType: (value: string) => void;
  setCashDrawerPort: (value: string) => void;
  setCashDrawerPulse: (value: number) => void;
  setCustomerDisplayType: (value: string) => void;
  setCustomerDisplayValue: (value: string) => void;
  testPrinterConnection: () => void;
  printTestReceipt: () => void;
  printLargeTestReceipt: () => void;
  testScannerConnection: () => void;
  testCashDrawerConnection: () => void;
  openCashDrawer: () => void;
  testCustomerDisplayConnection: () => void;
  updateCustomerDisplay: () => void;
  onDeviceConnected: (deviceId: string) => void;
}

export const PeripheralsSettings: React.FC<PeripheralsSettingsProps> = ({
  settings,
  setPrinterType,
  setPrinterIp,
  setScannerType,
  setCashDrawerPort,
  setCashDrawerPulse,
  setCustomerDisplayType,
  setCustomerDisplayValue,
  testPrinterConnection,
  printTestReceipt,
  printLargeTestReceipt,
  testScannerConnection,
  testCashDrawerConnection,
  openCashDrawer,
  testCustomerDisplayConnection,
  updateCustomerDisplay,
  onDeviceConnected,
}) => {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Receipt className="mr-2 h-5 w-5" />
            Printer
          </CardTitle>
          <CardDescription>
            Configure your receipt printer settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="printerType">Printer Type</Label>
              <Select
                value={settings.printerType || 'usb'}
                onValueChange={setPrinterType}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usb">USB</SelectItem>
                  <SelectItem value="network">Network</SelectItem>
                  <SelectItem value="bluetooth">Bluetooth</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {settings?.printerType === 'network' && (
              <div className="space-y-2">
                <Label htmlFor="printerIp">Printer IP Address</Label>
                <Input
                  id="printerIp"
                  value={settings.printerIp || ''}
                  onChange={(e) => setPrinterIp(e.target.value)}
                  placeholder="192.168.1.100"
                />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={testPrinterConnection} variant="outline" size="sm">
              <Printer className="mr-2 h-4 w-4" />
              Test Connection
            </Button>
            <Button onClick={printTestReceipt} variant="outline" size="sm">
              <Receipt className="mr-2 h-4 w-4" />
              Print Test Receipt
            </Button>
            <Button onClick={printLargeTestReceipt} variant="outline" size="sm">
              <Receipt className="mr-2 h-4 w-4" />
              Print Large Test (25+ Items)
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ScanLine className="mr-2 h-5 w-5" />
            Scanner
          </CardTitle>
          <CardDescription>
            Configure barcode scanner settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="scannerType">Scanner Type</Label>
            <Select
              value={settings.scannerType || 'usb'}
              onValueChange={setScannerType}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usb">USB</SelectItem>
                <SelectItem value="bluetooth">Bluetooth</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={testScannerConnection} variant="outline" size="sm">
            <ScanLine className="mr-2 h-4 w-4" />
            Test Connection
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5" />
            Cash Drawer
          </CardTitle>
          <CardDescription>
            Configure cash drawer settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cashDrawerPort">Cash Drawer Port</Label>
              <Input
                id="cashDrawerPort"
                value={settings.cashDrawerPort || ''}
                onChange={(e) => setCashDrawerPort(e.target.value)}
                placeholder="COM1 or /dev/ttyUSB0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cashDrawerPulse">Pulse Duration (ms)</Label>
              <Input
                id="cashDrawerPulse"
                type="text"
                inputMode="numeric"
                value={settings.cashDrawerPulse || 100}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty input or valid positive integers
                  if (value === '' || /^\d+$/.test(value)) {
                    setCashDrawerPulse(value === '' ? 100 : parseInt(value) || 100);
                  }
                }}
                onKeyDown={(e) => {
                  // Prevent non-numeric characters
                  if (!/[0-9]/.test(e.key) && 
                      !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <Button onClick={testCashDrawerConnection} variant="outline" size="sm">
              <Scale className="mr-2 h-4 w-4" />
              Test Connection
            </Button>
            <Button onClick={openCashDrawer} variant="outline" size="sm">
              <DollarSign className="mr-2 h-4 w-4" />
              Open Drawer
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Monitor className="mr-2 h-5 w-5" />
            Customer Display
          </CardTitle>
          <CardDescription>
            Configure customer display settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerDisplayType">Display Type</Label>
              <Select
                value={settings.customerDisplayType || 'none'}
                onValueChange={setCustomerDisplayType}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="hdmi">HDMI Display</SelectItem>
                  <SelectItem value="bluetooth">Bluetooth Display</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {settings?.customerDisplayType === 'bluetooth' && (
              <div className="space-y-2">
                <Label htmlFor="customerDisplayValue">Device ID</Label>
                <Input
                  id="customerDisplayValue"
                  value={settings.customerDisplayValue || ''}
                  onChange={(e) => setCustomerDisplayValue(e.target.value)}
                  placeholder="Bluetooth device ID"
                />
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <Button onClick={testCustomerDisplayConnection} variant="outline" size="sm">
              <Monitor className="mr-2 h-4 w-4" />
              Test Connection
            </Button>
            <Button onClick={updateCustomerDisplay} variant="outline" size="sm">
              <Send className="mr-2 h-4 w-4" />
              Send Test Message
            </Button>
          </div>
        </CardContent>
      </Card>

      <BluetoothSettingsCard onDeviceConnected={onDeviceConnected} />
    </div>
  );
};