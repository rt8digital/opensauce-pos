import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Smartphone, RefreshCw, Layers, Zap } from 'lucide-react';

interface MobileSettingsProps {
  refreshLinkedDevices: () => void;
}

export const MobileSettings: React.FC<MobileSettingsProps> = ({
  refreshLinkedDevices,
}) => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Mobile Link</CardTitle>
              <CardDescription>Extend your POS to any mobile device</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="group/item flex items-center justify-between p-6 rounded-2xl bg-muted/30 border border-border/30 hover:bg-muted/50 transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-background/50 border border-border/50 shadow-inner group-hover/item:border-primary/50 transition-colors">
                <QrCode className="h-10 w-10 text-muted-foreground group-hover/item:text-primary transition-colors" />
              </div>
              <div>
                <p className="text-lg font-bold group-hover/item:text-primary transition-colors">Pair New Device</p>
                <p className="text-sm text-muted-foreground">
                  Generate a secure QR code for mobile auth
                </p>
              </div>
            </div>
            <Button onClick={refreshLinkedDevices} variant="ghost" className="h-12 w-12 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors">
              <RefreshCw className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2 px-1">
              <Layers className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Connected Sessions</h4>
            </div>

            <div className="relative p-12 rounded-2xl border-2 border-dashed border-border/50 bg-muted/10 flex flex-col items-center justify-center text-center gap-4">
              <div className="p-4 rounded-full bg-primary/5">
                <Zap className="h-8 w-8 text-primary/40 animate-pulse" />
              </div>
              <div className="max-w-[280px] space-y-1">
                <p className="font-bold text-muted-foreground">Mobile Companion Beta</p>
                <p className="text-xs text-muted-foreground/60 leading-relaxed">
                  Real-time stock lookup, POS terminal networking and remote printing capabilities are coming soon.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
