# Application Testing Walkthrough

## Prerequisites
- Node.js installed
- All dependencies installed (npm install)
- For Electron builds: Visual Studio Build Tools (see DEPENDENCY_INSTALLATION_GUIDE.md)
- For Android builds: Java JDK and Android SDK (see DEPENDENCY_INSTALLATION_GUIDE.md)

## Testing the Web Application

1. Start the development server:
   ```
   npm run dev
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:5177
   ```

3. Test the following features:
   - Login functionality
   - Product browsing and selection
   - Shopping cart operations
   - Checkout process
   - Receipt printing (simulated)
   - Settings management

## Testing the Electron Desktop Application

1. Start the Electron app in development mode:
   ```
   npm run electron-dev
   ```

2. Test the following features:
   - All web application features
   - Native file dialogs
   - Printer integration (if hardware is available)
   - Cash drawer integration (if hardware is available)
   - Customer display integration (if hardware is available)

Note: Hardware integrations require the actual peripheral devices to be connected.

## Testing the Mobile Application

1. Open the Android project in Android Studio:
   ```
   npm run cap:android
   ```

2. Build and run the application in an emulator or on a physical device

3. Test the following features:
   - All web application features
   - Mobile-specific UI components
   - Offline functionality
   - Bluetooth printer integration (if hardware is available)

## Build Commands Reference

### Web Application
- Development: `npm run dev`
- Production build: `npm run build`

### Electron Desktop
- Development: `npm run electron-dev`
- Production build: `npm run electron-dist`

### Mobile Application
- Sync assets: `npm run cap:sync`
- Build Android: `npm run cap:run:android`
- Open Android project: `npm run cap:android`

## Troubleshooting

### Common Issues

1. **Port conflicts**: If port 5177 is in use, the application won't start
   - Solution: Stop other processes using the port or modify the port in `vite.config.ts`

2. **Missing dependencies**: If any dependencies are missing
   - Solution: Run `npm install` to install all dependencies

3. **Build errors**: If there are build errors
   - Solution: Check the error messages and ensure all prerequisites are installed

### Hardware Integration Testing

For testing hardware integrations without actual devices:
1. Use the simulation features built into the application
2. Check the developer console for integration logs
3. Verify that the correct APIs are being called

Note: Full hardware testing requires actual peripheral devices to be connected to the system.