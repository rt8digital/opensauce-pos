# Testing Splash Screen Functionality

## Overview

This document provides instructions on how to test the splash screen functionality that has been implemented in the OpenSauce POS Electron application.

## Prerequisites

1. Ensure you have Node.js and npm installed
2. Make sure all project dependencies are installed (`npm install`)

## Testing Methods

### Method 1: Direct Test Script

We've created a standalone test script to verify the splash screen functionality:

1. Run the test script:
   ```
   npx electron test-splash.js
   ```

2. Observe:
   - A splash screen window should appear
   - It should display the content from `assets/splash.html`
   - The window should automatically close after 3 seconds

### Method 2: Full Application Test

1. Run the application in development mode:
   ```
   npm run electron-dev
   ```

2. Observe:
   - A splash screen should appear immediately
   - The main application window should appear after initialization
   - The splash screen should close automatically

### Method 3: Packaged Application Test

1. Build the application:
   ```
   npm run electron-pack
   ```

2. Install the generated installer from `build-output/`

3. Run the installed application and observe the splash screen behavior

## Troubleshooting

### Issue: Splash screen doesn't appear

**Possible Causes**:
1. The `assets/splash.html` file is missing or inaccessible
2. There's an error in the `createSplashScreen()` function
3. Path resolution issues in the Electron main process

**Solutions**:
1. Verify that `assets/splash.html` exists
2. Check the Electron console for errors (`console.log` statements in main process)
3. Ensure the path to the splash HTML file is correct

### Issue: Splash screen doesn't close

**Possible Causes**:
1. The `mainWindow.once('ready-to-show')` event isn't firing
2. The splash window reference is lost

**Solutions**:
1. Add debug logging to verify event firing
2. Ensure the `splashWindow` variable is properly maintained

## Customization Testing

### Testing Splash Screen Customization

1. Modify `assets/splash.html` with custom branding
2. Run the test script or application
3. Verify that changes appear correctly

### Testing Installer Branding

1. Create custom `assets/icon.ico` and `assets/installer/sidebar.bmp` files
2. Run `npm run electron-pack`
3. Verify that the generated installer uses the custom assets

## Debugging Tips

1. Add `console.log` statements in the `createSplashScreen()` function
2. Use Electron's developer tools in development mode
3. Check the terminal output for any error messages
4. Verify file paths are correct, especially in the packaged application

## Validation Checklist

Before considering the splash screen implementation complete, verify that:

- [ ] Splash screen appears during application startup
- [ ] Splash screen content is displayed correctly
- [ ] Splash screen automatically closes when main window is ready
- [ ] Splash screen doesn't interfere with application functionality
- [ ] Customization of splash screen HTML works as expected
- [ ] No errors appear in the console during splash screen operation