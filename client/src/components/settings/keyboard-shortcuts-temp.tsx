import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Keyboard } from 'lucide-react';

export const KeyboardShortcuts: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Keyboard className="mr-2 h-5 w-5" />
            Keyboard Shortcuts
          </CardTitle>
          <CardDescription>
            Learn and use these keyboard shortcuts to speed up your POS operations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Product Shortcuts */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Product Selection</h3>
            <div className="grid gap-3">
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded">
                <span className="text-sm">Add first product to cart</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">Q</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded">
                <span className="text-sm">Add second product to cart</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">W</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded">
                <span className="text-sm">Add third product to cart</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">E</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded">
                <span className="text-sm">Add fourth product to cart</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">R</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded">
                <span className="text-sm">Add fifth product to cart</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">T</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded">
                <span className="text-sm">Add sixth product to cart</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">A</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded">
                <span className="text-sm">Add seventh product to cart</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">S</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded">
                <span className="text-sm">Add eighth product to cart</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">D</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded">
                <span className="text-sm">Add ninth product to cart</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">F</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded">
                <span className="text-sm">Add tenth product to cart</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">Z</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded">
                <span className="text-sm">Add eleventh product to cart</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">X</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded">
                <span className="text-sm">Add twelfth product to cart</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">C</kbd>
                </div>
              </div>
            </div>
          </div>

          {/* POS Operations */}
          <div>
            <h3 className="text-lg font-semibold mb-3">POS Operations</h3>
            <div className="grid gap-3">
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded">
                <span className="text-sm">Focus search input</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">F1</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded">
                <span className="text-sm">Start camera scan</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">F2</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded">
                <span className="text-sm">Add custom amount</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">F3</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded">
                <span className="text-sm">Save cart</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">F4</kbd>
                  <span className="text-xs text-muted-foreground">or</span>
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">Ctrl</kbd>
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">S</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded">
                <span className="text-sm">Load saved carts</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">F5</kbd>
                  <span className="text-xs text-muted-foreground">or</span>
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">Ctrl</kbd>
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">L</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded">
                <span className="text-sm">Checkout</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">F6</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded">
                <span className="text-sm">Clear cart</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">F7</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded">
                <span className="text-sm">Reprint last receipt</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">F8</kbd>
                  <span className="text-xs text-muted-foreground">or</span>
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">Ctrl</kbd>
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">P</kbd>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Navigation</h3>
            <div className="grid gap-3">
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded">
                <span className="text-sm">Confirm checkout</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">Enter</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded">
                <span className="text-sm">Close dialogs</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">Esc</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded">
                <span className="text-sm">Navigate between fields</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">Tab</kbd>
                </div>
              </div>
            </div>
          </div>

          {/* Numeric Keypad */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Numeric Keypad</h3>
            <div className="grid gap-3">
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded">
                <span className="text-sm">Submit barcode/PLU code</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">+</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded">
                <span className="text-sm">Add custom amount</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">Enter</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded">
                <span className="text-sm">Clear entry</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">C</kbd>
                  <span className="text-xs text-muted-foreground">or</span>
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">Esc</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded">
                <span className="text-sm">Backspace</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-background border rounded">⌫</kbd>
                </div>
              </div>
            </div>
          </div>

          {/* Barcode Scanning */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Barcode Scanning</h3>
            <div className="grid gap-3">
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded">
                <span className="text-sm">Hardware barcode scanner</span>
                <span className="text-xs text-muted-foreground">Works like a keyboard - just scan!</span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded">
                <span className="text-sm">Camera barcode scanner</span>
                <span className="text-xs text-muted-foreground">Use F2 to start scanning</span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded">
                <span className="text-sm">Mobile remote scanning</span>
                <span className="text-xs text-muted-foreground">Scan on mobile device, view on POS</span>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">💡 Pro Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use + key to submit barcode/PLU codes, and Enter key for checkout</li>
              <li>• Use QWERTY keys (Q, W, E, R, T, A, S, D, F, Z, X, C) to quickly select the first 12 products</li>
              <li>• Use function keys (F1-F8) for quick POS operations</li>
              <li>• Ctrl+S, Ctrl+L, Ctrl+P work like other applications</li>
              <li>• Hardware barcode scanners work automatically - no shortcuts needed</li>
              <li>• Press Esc to quickly close any open dialogs</li>
              <li>• Use Tab to navigate between input fields</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};