import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Keyboard, MousePointer2, Zap, Navigation, Hash, Info } from 'lucide-react';

export const KeyboardShortcuts: React.FC = () => {
  const ShortcutItem = ({ label, keys }: { label: string, keys: string[] }) => (
    <div className="flex justify-between items-center p-3 rounded-xl bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-1.5">
        {keys.map((key, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && idx < keys.length && <span className="text-[10px] text-muted-foreground font-black">+</span>}
            <kbd className="min-w-[24px] h-7 px-2 flex items-center justify-center text-xs font-black bg-background border border-border/50 rounded-lg shadow-sm text-primary">
              {key}
            </kbd>
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Keyboard className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Speed Master</CardTitle>
              <CardDescription>Master the POS with professional keyboard bindings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Column 1: Core Operations */}
            <div className="space-y-6">
              <section className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Quick Actions</h3>
                </div>
                <div className="grid gap-2">
                  <ShortcutItem label="Focus Search" keys={['F1']} />
                  <ShortcutItem label="Camera Scan" keys={['F2']} />
                  <ShortcutItem label="Custom Amount" keys={['F3']} />
                  <ShortcutItem label="Clear Cart" keys={['F7']} />
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Navigation className="h-4 w-4 text-blue-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Flow Control</h3>
                </div>
                <div className="grid gap-2">
                  <ShortcutItem label="Save Cart" keys={['F4']} />
                  <ShortcutItem label="Load Carts" keys={['F5']} />
                  <ShortcutItem label="Checkout" keys={['F6']} />
                  <ShortcutItem label="Reprint Receipt" keys={['F8']} />
                  <ShortcutItem label="Close Dialog" keys={['ESC']} />
                </div>
              </section>
            </div>

            {/* Column 2: Data & Entry */}
            <div className="space-y-6">
              <section className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Hash className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Numpad Tools</h3>
                </div>
                <div className="grid gap-2">
                  <ShortcutItem label="Submit Barcode" keys={['+']} />
                  <ShortcutItem label="Add to Cart" keys={['ENTER']} />
                  <ShortcutItem label="Checkout (Alt)" keys={['SHIFT', 'ENTER']} />
                  <ShortcutItem label="Clear Entry" keys={['C']} />
                  <ShortcutItem label="Delete Char" keys={['⌫']} />
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <MousePointer2 className="h-4 w-4 text-rose-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Hotkeys ALT + (1-9)</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['ALT + 1', 'ALT + 2', 'ALT + 3', 'ALT + 4', 'ALT + 5', 'ALT + 6', 'ALT + 7', 'ALT + 8', 'ALT + 9'].map((k, i) => (
                    <div key={k} className="flex flex-col items-center justify-center p-2 rounded-xl bg-muted/20 border border-border/20 text-[10px] text-muted-foreground uppercase font-black tracking-tighter">
                      <span>Prod {i + 1}</span>
                      <kbd className="mt-1 min-w-[20px] h-6 flex items-center justify-center bg-background border border-border/50 rounded shadow-sm text-primary">{k}</kbd>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Info className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-primary">Smart Recognition</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The system automatically distinguishes between human typing and hardware scanner input based on character frequency and timing. No manual mode switching required.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
