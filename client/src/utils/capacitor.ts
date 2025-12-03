import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Check if the app is running in a Capacitor (native mobile) environment
 */
export const isCapacitor = (): boolean => {
    return Capacitor.isNativePlatform();
};

/**
 * Check if the app is running on iOS
 */
export const isIOS = (): boolean => {
    return Capacitor.getPlatform() === 'ios';
};

/**
 * Check if the app is running on Android
 */
export const isAndroid = (): boolean => {
    return Capacitor.getPlatform() === 'android';
};

/**
 * Check if the app is running on web
 */
export const isWeb = (): boolean => {
    return Capacitor.getPlatform() === 'web';
};

/**
 * Trigger haptic feedback (vibration)
 * @param style - The style of haptic feedback (light, medium, heavy)
 */
export const triggerHaptic = async (style: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> => {
    if (!isCapacitor()) return;

    try {
        const impactStyle = {
            light: ImpactStyle.Light,
            medium: ImpactStyle.Medium,
            heavy: ImpactStyle.Heavy,
        }[style];

        await Haptics.impact({ style: impactStyle });
    } catch (error) {
        console.warn('Haptic feedback not available:', error);
    }
};

/**
 * Trigger selection haptic feedback (for UI selections)
 */
export const triggerSelectionHaptic = async (): Promise<void> => {
    if (!isCapacitor()) return;

    try {
        await Haptics.selectionStart();
    } catch (error) {
        console.warn('Selection haptic not available:', error);
    }
};

/**
 * Trigger notification haptic feedback
 * @param type - The type of notification (success, warning, error)
 */
export const triggerNotificationHaptic = async (type: 'success' | 'warning' | 'error' = 'success'): Promise<void> => {
    if (!isCapacitor()) return;

    try {
        await Haptics.notification({ type: type.toUpperCase() as any });
    } catch (error) {
        console.warn('Notification haptic not available:', error);
    }
};

/**
 * Get safe area insets for notched devices
 */
export const getSafeAreaInsets = () => {
    if (typeof window === 'undefined') {
        return { top: 0, bottom: 0, left: 0, right: 0 };
    }

    const style = getComputedStyle(document.documentElement);

    return {
        top: parseInt(style.getPropertyValue('--safe-area-top') || '0'),
        bottom: parseInt(style.getPropertyValue('--safe-area-bottom') || '0'),
        left: parseInt(style.getPropertyValue('--safe-area-left') || '0'),
        right: parseInt(style.getPropertyValue('--safe-area-right') || '0'),
    };
};

/**
 * Check if device has a notch/dynamic island
 */
export const hasNotch = (): boolean => {
    const insets = getSafeAreaInsets();
    return insets.top > 20 || insets.bottom > 0;
};
