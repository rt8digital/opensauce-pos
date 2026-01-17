# Cross-Platform Assets

This directory contains platform-specific assets for building on different operating systems.

## macOS
- `icon.icns` - macOS application icon (required for Mac builds)
- `entitlements.mac.plist` - macOS code signing entitlements

## Linux  
- `icons/` - Directory containing various icon sizes for Linux distributions

## Windows
- `icon.ico` - Windows application icon (already exists)
- `installer/` - NSIS installer scripts (already exists)

## Setup Instructions:

### For macOS:
1. Create `icon.icns` from your app icon
2. Create `assets/entitlements.mac.plist` with required permissions

### For Linux:
1. Add various icon sizes (16x16, 32x32, 48x48, 64x64, 128x128, 256x256) to `assets/icons/`
2. Supported formats: PNG

Note: These assets are required for proper cross-platform distribution.