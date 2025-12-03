import { useNetworkStatus } from '@/hooks/use-network-status';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, Wifi } from 'lucide-react';
import { useState, useEffect } from 'react';

export function NetworkStatusIndicator() {
    const isOnline = useNetworkStatus();
    const [showOffline, setShowOffline] = useState(false);

    useEffect(() => {
        if (!isOnline) {
            setShowOffline(true);
        } else {
            // Hide after 3 seconds when back online
            const timer = setTimeout(() => setShowOffline(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isOnline]);

    if (!showOffline) return null;

    return (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2">
            <Alert
                variant={isOnline ? 'default' : 'destructive'}
                className="w-auto shadow-lg"
            >
                {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                <AlertDescription className="ml-2">
                    {isOnline ? 'Back online' : 'Working offline'}
                </AlertDescription>
            </Alert>
        </div>
    );
}
