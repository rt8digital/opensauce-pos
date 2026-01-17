import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw, Rocket, ShieldAlert, Cpu, Database } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface AdvancedFunctionsProps {
  onFactoryReset: () => void;
  onResetToDefaults?: () => void;
  autoLaunchEnabled?: boolean;
  updateSetting?: (field: any, value: any) => void;
}

export const AdvancedFunctions: React.FC<AdvancedFunctionsProps> = ({
  onFactoryReset,
  onResetToDefaults,
  autoLaunchEnabled,
  updateSetting
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Launch Infrastructure</CardTitle>
              <CardDescription>Configure system boot and environment parameters</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-6 rounded-2xl bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors">
            <div className="space-y-1">
              <Label htmlFor="auto-launch" className="text-base font-bold cursor-pointer">Start with Windows</Label>
              <p className="text-xs text-muted-foreground max-w-[400px]">
                Automatically initialize the OpenSauce POS engine upon operating system login. Recommended for dedicated terminals.
              </p>
            </div>
            <Switch
              id="auto-launch"
              checked={autoLaunchEnabled}
              onCheckedChange={(checked) => updateSetting?.('autoLaunchEnabled', checked)}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </CardContent>
      </Card>

      {onResetToDefaults && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden group border-amber-500/20">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Preferences Reset</CardTitle>
                <CardDescription>Revert environment to initial system defaults</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-4">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-amber-900 dark:text-amber-200">Reversible Transformation</p>
                <p className="text-xs text-amber-800/70 dark:text-amber-300/60 leading-relaxed">
                  Only UI preferences, colors, and interface settings will be affected. Your existing product catalog, sales, and accounts <span className="font-bold underline">will remain untouched</span>.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={onResetToDefaults}
                variant="outline"
                className="h-11 rounded-xl border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset System Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/10 overflow-hidden group border-destructive/20">
        <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-destructive/10 text-destructive">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-destructive">Factory Erase</CardTitle>
              <CardDescription>Permanent destruction of all local system data</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 rounded-2xl bg-destructive/5 border border-destructive/10 flex gap-5">
            <div className="p-3 rounded-full bg-destructive/10 text-destructive self-start">
              <Database className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <p className="text-base font-black text-destructive uppercase tracking-tighter">Nuclear Option Warning</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Proceeding will <span className="font-black text-foreground">WIPE THE ENTIRE DATABASE</span>. All products, sales records, customer history, and encrypted keys will be destroyed.
                <span className="block mt-2 font-bold text-destructive">This action is irreversible and cannot be recovered.</span>
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={onFactoryReset}
              variant="destructive"
              className="h-12 px-8 rounded-xl font-black text-md shadow-lg shadow-destructive/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Initialize Factory Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
