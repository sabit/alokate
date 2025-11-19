# Application Icons

This directory contains the application icons for the Alokate Electron app.

## Required Icon Files

To complete the Electron packaging setup, you need to provide the following icon files:

### Windows
- **icon.ico** - Windows application icon
  - Recommended sizes: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256
  - Format: ICO file with multiple resolutions

### macOS
- **icon.icns** - macOS application icon
  - Recommended sizes: 16x16, 32x32, 64x64, 128x128, 256x256, 512x512, 1024x1024
  - Format: ICNS file
  - Can be created from PNG files using `iconutil` on macOS

### Linux
- **icon.png** - Linux application icon
  - Recommended size: 512x512 or 1024x1024
  - Format: PNG with transparency

## Creating Icons

You can create these icons from a single high-resolution PNG (1024x1024) using various tools:

- **electron-icon-builder**: `npm install -g electron-icon-builder`
- **Online tools**: https://www.electronjs.org/docs/latest/tutorial/application-distribution#icon-requirements
- **Manual creation**: Use image editing software like GIMP, Photoshop, or Sketch

## Placeholder Icons

Until proper icons are provided, the Electron Forge build process will use default icons. The application will still build and run, but will not have custom branding in the taskbar, dock, or installer.
