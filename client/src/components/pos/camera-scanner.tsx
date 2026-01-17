import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Cart } from '@/components/pos/cart';
import type { Product } from '../../../../shared/types';

interface CartItem {
    product: Product | { id: number; name: string; price: string };
    quantity: number;
    originalPrice?: string;
    discountedPrice?: string;
}

interface CameraScannerProps {
    isCameraScanning: boolean;
    onClose: () => void;
    videoDevices: MediaDeviceInfo[];
    selectedDeviceId: string;
    setSelectedDeviceId: (id: string) => void;
    cameraVideoRef: React.RefObject<HTMLVideoElement>;
    cart: CartItem[];
    onUpdateQuantity: (productId: number, delta: number) => void;
    onRemoveItem: (productId: number) => void;

    currentDisplay: string;
    selectedCartItemId: number | null;
    onSelectCartItem: (id: number) => void;
    isMultiplicationMode: boolean;
    multiplicationMultiplier: string;
}

export function CameraScanner({
    isCameraScanning,
    onClose,
    videoDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    cameraVideoRef,
    cart,
    onUpdateQuantity,
    onRemoveItem,

    currentDisplay,
    selectedCartItemId,
    onSelectCartItem,
    isMultiplicationMode,
    multiplicationMultiplier,
}: CameraScannerProps) {
    if (!isCameraScanning) return null;

    return (
        <div className="absolute inset-0 z-50 bg-background flex">
            {/* Camera View */}
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md mb-4 space-y-2">
                    {videoDevices.length > 0 && (
                        <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Camera" />
                            </SelectTrigger>
                            <SelectContent>
                                {videoDevices.map(device => (
                                    <SelectItem key={device.deviceId} value={device.deviceId || `device-${device.label}`}>
                                        {device.label || `Camera ${device.deviceId.slice(0, 5)}...`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    <div className="relative w-full h-64 bg-background rounded-md overflow-hidden border">
                        <video ref={cameraVideoRef} className="w-full h-full object-cover" playsInline></video>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-64 h-32 border-2 border-primary opacity-75 rounded-md animate-pulse relative">
                                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary -mt-1 -ml-1"></div>
                                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary -mt-1 -mr-1"></div>
                                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary -mb-1 -ml-1"></div>
                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary -mb-1 -mr-1"></div>
                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 opacity-50"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground text-center mb-4">
                    Position the barcode within the frame.
                </p>
                <Button onClick={onClose} variant="secondary">
                    Stop Scanning
                </Button>
            </div>

            {/* Camera View Cart Panel */}
            <div className="w-[450px] border-l flex flex-col h-full bg-background">
                <div className="p-4 border-b">
                    <h2 className="text-lg font-semibold">Current Cart</h2>
                </div>

                <Cart
                    cart={cart}
                    onUpdateQuantity={onUpdateQuantity}
                    onRemoveItem={onRemoveItem}
                    currentDisplay={currentDisplay}
                    selectedCartItemId={selectedCartItemId}
                    onSelectCartItem={onSelectCartItem}
                    isMultiplicationMode={isMultiplicationMode}
                    multiplicationMultiplier={multiplicationMultiplier}
                />
            </div>
        </div>
    );
}