import React, { useState, useEffect } from 'react';
import { scanner } from '@/lib/scanner';

interface UseScannerProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    onBarcodeScanned: (barcode: string, type: 'camera' | 'remote', deviceId?: string) => void;
}

export function useScanner({ videoRef, onBarcodeScanned }: UseScannerProps) {
    const [isCameraScanning, setIsCameraScanning] = useState(false);
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

    // Load devices when camera scanning starts
    useEffect(() => {
        if (isCameraScanning) {
            scanner.getDevices().then(devices => {
                const safeDevices = devices || [];
                setVideoDevices(safeDevices);
                if (safeDevices.length > 0 && !selectedDeviceId) {
                    // Prefer back/environment facing camera
                    const backCamera = safeDevices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
                    setSelectedDeviceId(backCamera ? backCamera.deviceId : safeDevices[0].deviceId);
                }
            }).catch(error => {
                console.warn('Failed to get video devices:', error);
                setVideoDevices([]);
            });
        }
    }, [isCameraScanning, selectedDeviceId]);

    // Camera scanner effect
    useEffect(() => {
        if (isCameraScanning && videoRef.current) {
            const handleScan = (barcode: string) => onBarcodeScanned(barcode, 'camera');

            scanner.start(videoRef.current, handleScan, selectedDeviceId)
                .catch(err => {
                    console.error("Failed to start camera scanner:", err);
                    setIsCameraScanning(false);
                });
        } else {
            scanner.stop();
        }

        return () => {
            scanner.stop();
        };
    }, [isCameraScanning, selectedDeviceId, onBarcodeScanned, videoRef]);

    // Initialize scanner activity tracking and enable hardware scanner when component mounts
    useEffect(() => {
        // Initialize the last scanner activity time to a value that ensures no conflicts at startup
        (window as any).lastScannerActivityTime = 0;

        const handleHardwareScan = (barcode: string) => {
            onBarcodeScanned(barcode, 'remote', '');
        };

        scanner.enableHardwareScanner(handleHardwareScan);

        return () => {
            scanner.disableHardwareScanner();
        };
    }, [onBarcodeScanned]);

    // Listen for remote barcode scans
    useEffect(() => {
        const handleRemoteScan = (event: CustomEvent) => {
            const { barcode, deviceId } = event.detail;
            onBarcodeScanned(barcode, 'remote', deviceId);
        };

        window.addEventListener('remoteBarcodeScan', handleRemoteScan as EventListener);

        return () => {
            window.removeEventListener('remoteBarcodeScan', handleRemoteScan as EventListener);
        };
    }, [onBarcodeScanned]);

    return {
        isCameraScanning,
        setIsCameraScanning,
        videoDevices,
        selectedDeviceId,
        setSelectedDeviceId,
    };
}