# OpenSauce POS Desktop Application - Unpackaged Version Test

## What is this?
This is an unpackaged version of the OpenSauce POS desktop application for testing purposes. It contains all the built files needed to run the application without installing it.

## How to run:
1. Double-click on `run-unpackaged.bat` to start the application
2. Or run `npx electron dist/main.js` from the command line

## What to expect:
- The application window should appear
- Backend server will start automatically
- POS interface should load
- All desktop features should be available

## Directory structure:
```
unpackaged-pos/
├── dist/
│   ├── main.js          # Electron main process
│   ├── preload.js       # Preload script
│   └── renderer/        # Built frontend files
├── run-unpackaged.bat   # Launch script
└── README.txt           # This file
```

## Notes:
- This is for testing only, not for production distribution
- For production use, build a proper installer with `npm run electron:build:win`
- All data is stored in the application directory