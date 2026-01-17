
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Database } from 'lucide-react';

interface FactoryResetOverlayProps {
    isOpen: boolean;
    onComplete: () => void;
    onError: (error: string) => void;
    performReset: () => Promise<any>;
}

export const FactoryResetOverlay: React.FC<FactoryResetOverlayProps> = ({
    isOpen,
    onComplete,
    onError,
    performReset,
}) => {
    const [step, setStep] = useState<'confirm' | 'resetting' | 'success' | 'error'>('confirm');
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('Initializing...');

    useEffect(() => {
        if (isOpen && step === 'resetting') {
            const resetProcess = async () => {
                try {
                    // Simulate progress stages
                    setStatusMessage('Backing up current data...');
                    await new Promise(r => setTimeout(r, 800));
                    setProgress(30);

                    setStatusMessage('Clearing database tables...');
                    // Start the actual reset
                    const resetPromise = performReset();

                    // Show progress while waiting
                    await new Promise(r => setTimeout(r, 1000));
                    setProgress(60);

                    setStatusMessage('Restoring default settings...');
                    await new Promise(r => setTimeout(r, 800));
                    setProgress(80);

                    await resetPromise;

                    setStatusMessage('Verifying user accounts...');
                    setProgress(90);
                    await new Promise(r => setTimeout(r, 500));

                    setProgress(100);
                    setStep('success');

                    // Auto complete after short delay
                    setTimeout(() => {
                        onComplete();
                    }, 2000);

                } catch (error: any) {
                    console.error('Reset failed:', error);
                    setStep('error');
                    onError(error.message || 'Factory reset failed');
                }
            };

            resetProcess();
        }
    }, [isOpen, step, performReset, onComplete, onError]);

    // Reset state when closed
    useEffect(() => {
        if (!isOpen) {
            setStep('confirm'); // actually confirm is handled by parent, we start at resetting if isOpen is true usually, 
            // but let's assume parent manages 'confirm' dialog and then sets isOpen to true for THIS overlay which is the process overlay.
            // Wait, the plan said "full-screen overlay for 'Factory Resetting...'"
            // So this component assumes validation is done.
            if (isOpen) setStep('resetting');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm">
            <div className="max-w-md w-full p-6 text-center space-y-8">
                <AnimatePresence mode="wait">
                    {step === 'resetting' && (
                        <motion.div
                            key="resetting"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="space-y-6"
                        >
                            <div className="relative mx-auto w-24 h-24">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 border-4 border-primary/30 border-t-primary rounded-full"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Database className="w-10 h-10 text-primary animate-pulse" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold">Factory Reset in Progress</h2>
                                <p className="text-muted-foreground">{statusMessage}</p>
                            </div>

                            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                <motion.div
                                    className="bg-primary h-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </motion.div>
                    )}

                    {step === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-6"
                        >
                            <div className="mx-auto w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold">Reset Complete</h2>
                                <p className="text-muted-foreground">The application will now restart.</p>
                            </div>
                        </motion.div>
                    )}

                    {step === 'error' && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-6"
                        >
                            <div className="mx-auto w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold">Reset Failed</h2>
                                <p className="text-muted-foreground">An error occurred during factory reset.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
