# POS Application - Installation and Launch Scripts

This document explains the scripts created to manage your POS application with Electron on Windows.

## Scripts Overview

### 1. install-dependencies.bat
This script handles:
- Checking for Node.js and npm installation
- Installing all required Node.js dependencies
- Building the client application (`npm run build:mobile`)
- Building the Electron application (`npm run build:electron`)
- Installing native dependencies for Windows (like serialport for hardware devices)
- Creating a Windows startup shortcut that will run `launch.bat` automatically when Windows starts

### 2. launch.bat
This script handles:
- Checking for Node.js and npm installation
- Starting the backend server (`npm run start:server`)
- Starting the frontend application (`npm run start:vite:electron`)
- Providing instructions for starting the Electron desktop app

### 3. electron-launch.bat
This script handles:
- Starting the complete Electron application (`npm run start:electron:app`)
- The Electron app internally manages both the backend server and the frontend interface
- Providing information about auto-startup capabilities

## Usage Instructions

### For New Installations:
1. Run `install-dependencies.bat` as Administrator to install dependencies and enable auto-startup
2. After installation completes, run `launch.bat` or `electron-launch.bat` to start the application

### For Regular Operation:
- Run `launch.bat` to start backend and frontend separately
- Or run `electron-launch.bat` to start the integrated Electron application

## Auto-Startup Configuration

The `install-dependencies.bat` script automatically adds the application to Windows startup by creating a shortcut in:
`%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\POS Application.lnk`

To disable auto-startup, simply delete this shortcut file.

## Hardware Device Support

The scripts ensure native dependencies for hardware devices are installed:
- Serial port support for barcode scanners, scales, etc. (serialport package)
- USB printer support (escpos-usb package)
- Bluetooth LE support for compatible devices (capacitor-community/bluetooth-le)

## Troubleshooting

If you encounter issues:
1. Make sure you're running the scripts as Administrator
2. Ensure Node.js and npm are properly installed and in your PATH
3. Check that no other processes are using the required ports
4. Verify that hardware devices are properly connected before starting the application

For more detailed information about the application, refer to the main documentation files in the project root. 
