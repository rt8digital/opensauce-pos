import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.opensauce.pos',
    appName: 'OpenSauce POS',
    webDir: 'dist/public',
    server: {
        // For development with live reload (uncomment and set your IP):
        // url: 'http://192.168.x.x:5177',
        // cleartext: true,

        // For production - use bundled app
        androidScheme: 'https'
    },
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
            launchAutoHide: true,
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
        allowMixedContent: false,
    },
};

export default config;