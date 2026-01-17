# Assets for OpenSauce P.O.S.

## Installer Assets

To create a professional-looking installer, you'll need to create the following assets:

1. **Icon Files**:
   - `icon.ico` - Main application icon (256x256 pixels recommended)
   - Place in the `assets/` directory

2. **Installer Sidebar**:
   - `installer/sidebar.bmp` - Sidebar image for the installer (164x314 pixels)
   - Place in the `assets/installer/` directory

## Splash Screen

The splash screen is located at `assets/splash.html` and can be customized by modifying that file.

## Creating Icons

You can create icons using online tools or image editors:
- Convert a PNG to ICO format using online converters
- Recommended size: 256x256 pixels for best quality

## Creating Sidebar Image

For the NSIS installer sidebar:
- Dimensions: 164x314 pixels
- Format: BMP
- Use your brand colors and possibly a logo

## Current Status

Currently, this directory contains placeholder files:
- `icon-placeholder.txt` - Instructions for creating the application icon
- `installer/sidebar-placeholder.txt` - Instructions for creating the sidebar image

You need to replace these with actual asset files:
1. Create your icon and save it as `assets/icon.ico`
2. Create your sidebar image and save it as `assets/installer/sidebar.bmp`

After creating these assets, rebuild the application with:
```
npm run electron-pack
```