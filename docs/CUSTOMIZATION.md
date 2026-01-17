# OpenSauce POS Customization Guide

This guide explains how to customize the branding and user experience of your OpenSauce POS application.

## 1. Splash Screen

The application now displays a splash screen during startup to improve user experience.

### Location
- `assets/splash.html` - The HTML file for the splash screen

### Customization
You can modify the splash screen by editing the HTML and CSS in this file:
- Change colors, fonts, and layout
- Replace the "POS" text with your logo or brand name
- Modify the loading animation
- Add your company name or tagline

## 2. Installer Branding

Customize the Windows installer to match your brand identity.

### Files Needed
1. `assets/icon.ico` - Application and installer icon (256x256 pixels)
2. `assets/installer/sidebar.bmp` - Installer sidebar image (164x314 pixels)

**Note:** These files are currently placeholders. You need to create actual asset files as described in the Asset Creation Tips section.

### Configuration
The desktop packager configuration has been updated to use these assets:
- `"icon": "assets/icon.ico"` - Sets the application icon
- `"installerIcon": "assets/icon.ico"` - Sets the installer icon
- `"installerSidebar": "assets/installer/sidebar.bmp"` - Sets the sidebar image

## 3. Building with Custom Assets

After creating your custom assets, rebuild the application:

```bash
npm run electron-pack
```

This will generate a branded installer in the `build-output` directory.

## 4. Asset Creation Tips

### Creating Icons
1. Design a logo/icon at 256x256 pixels
2. Save as PNG format
3. Convert to ICO format using:
   - Online converters: convertio.co, cloudconvert.com
   - Image editors: GIMP, Photoshop
   - Command line: ImageMagick (`magick input.png assets/icon.ico`)

### Creating Sidebar Images
1. Create an image at exactly 164x314 pixels
2. Use your brand colors and possibly a logo
3. Save as 24-bit BMP format
4. Place in `assets/installer/sidebar.bmp`

## 5. Helper Script

We've included a helper script to guide you through asset creation:

```bash
npm run generate-assets
```

This script provides detailed instructions for creating all necessary assets.

## 6. Testing Your Changes

After making changes to assets:
1. Run `npm run electron-pack` to rebuild the application
2. Install the generated setup file from `build-output/`
3. Verify that:
   - The splash screen appears correctly
   - The installer shows your custom icon and sidebar
   - The installed application has the correct icon