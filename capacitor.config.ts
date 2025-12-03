import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.opensauce.pos',
    appName: 'OpenSauce POS',
    webDir: 'dist/public',
    plugins: {
        StatusBar: {
            style: 'DARK',
            backgroundColor: '#000000',
        },
        SplashScreen: {
            launchShowDuration: 2000,
            backgroundColor: '#000000',
            showSpinner: true,
            androidSpinnerStyle: 'small',
            iosSpinnerStyle: 'small',
            spinnerColor: '#ffffff',
        },
        Haptics: {
            enabled: true,
        },
        Network: {
            enabled: true,
        },
        BluetoothLe: {
            displayStrings: {
                scanning: 'Scanning for devices...',
                cancel: 'Cancel',
                availableDevices: 'Available Devices',
                noDeviceFound: 'No device found',
            },
        },
    },
    android: {
        buildOptions: {
            keystorePath: undefined,
            keystoreAlias: undefined,
            keystorePassword: undefined,
            keystoreAliasPassword: undefined,
        },
    },
    ios: {
        scheme: 'OpenSauce POS',
    },
};

export default config;