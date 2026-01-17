import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Database, AlertTriangle, Settings2 } from 'lucide-react';
import { Settings } from '../../../../shared/types';

interface InventorySettingsProps {
  settings: Settings;
  updateSetting: (field: keyof Settings, value: any) => void;
}

export const InventorySettings: React.FC<InventorySettingsProps> = ({
  settings,
  updateSetting,
}) => {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Stock Management</CardTitle>
              <CardDescription>Configure how stock levels and alerts are handled</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/30 group/item hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-background/50 border border-border/50 shadow-inner group-hover/item:border-primary/50 transition-colors">
                  <AlertTriangle className="h-6 w-6 text-amber-500" />
                </div>
                <div className="space-y-0.5">
                  <Label htmlFor="stockAlertEnabled" className="text-base font-bold cursor-pointer">Low Stock Alerts</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable visual notifications when items reach critical levels.
                  </p>
                </div>
              </div>
              <Switch
                id="stockAlertEnabled"
                checked={settings.stockAlertEnabled ?? true}
                onCheckedChange={(checked) => updateSetting('stockAlertEnabled', checked)}
              />
            </div>

            <div className="p-6 rounded-xl bg-muted/30 border border-border/30 space-y-4">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                <Label htmlFor="lowStockThreshold" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Threshold Threshold</Label>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <Input
                  id="lowStockThreshold"
                  type="text"
                  inputMode="numeric"
                  className="w-full sm:w-32 bg-background/50 border-border/50 rounded-xl h-11 text-center text-lg font-bold focus:ring-primary/20"
                  value={settings.lowStockThreshold || 10}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d+$/.test(value)) {
                      updateSetting('lowStockThreshold', value === '' ? 10 : parseInt(value) || 0);
                    }
                  }}
                />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Items with current stock <span className="text-primary font-bold">≤ {settings.lowStockThreshold || 10}</span> will be flagged with a <span className="text-amber-500">Low Stock</span> badge across the system.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};