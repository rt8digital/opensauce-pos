#!/bin/bash
# Script to run the unpackaged Electron POS application

echo "Starting OpenSauce POS Desktop Application (Unpackaged Version)"
echo "========================================================="

# Check if required files exist
if [ ! -f "dist/main.cjs" ]; then
    echo "Error: dist/main.cjs not found. Please run 'npm run build:electron:main' first."
    exit 1
fi

if [ ! -d "dist/renderer" ]; then
    echo "Error: dist/renderer directory not found. Please run 'npm run build:electron:client' first."
    exit 1
fi

echo "Launching Electron application..."
npx electron dist/main.cjs