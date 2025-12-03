# OpenSauce P.O.S.

A modern Point of Sale system built with React, Express, and TypeScript. Supports desktop (Electron) and mobile (Capacitor) deployments.

## Features

- Modern React-based POS interface
- Express backend with SQLite database
- Inventory management
- Customer management
- Sales tracking
- Receipt printing
- Offline support with PWA
- Desktop app support (Electron)
- Mobile app support (Capacitor)

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5000`

## Desktop App (Electron)

### Development

```bash
npm run electron-dev
```

This will start both the server and Electron app in development mode.

### Building for Production

```bash
npm run electron-dist
```

This creates distributable packages for Windows, macOS, and Linux in the `dist-electron` folder.

### Manual Electron Commands

```bash
# Run Electron directly (requires built app)
npm run electron

# Build and package
npm run electron-pack
```

## Mobile App (Capacitor)

### Setup

First, initialize Capacitor (only needed once):

```bash
npm run capacitor-init
```

Add platforms:

```bash
# For Android
npm run capacitor-add-android

# For iOS (macOS only)
npm run capacitor-add-ios
```

### Development

```bash
npm run capacitor-dev
```

### Building for Mobile

```bash
# Build web assets and sync to platforms
npm run capacitor-build

# Open in Android Studio
npm run capacitor-build-android

# Open in Xcode (macOS only)
npm run capacitor-build-ios
```

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilities
│   └── public/            # Static assets
├── server/                 # Express backend
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   └── storage.ts         # Database operations
├── shared/                 # Shared types/schemas
├── electron.js            # Electron main process
├── preload.js             # Electron preload script
├── capacitor.config.ts    # Capacitor configuration
├── electron-builder.json  # Electron builder config
└── dist/                  # Built output
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type checking
- `npm run db:push` - Push database schema

### Electron Scripts

- `npm run electron` - Run Electron app
- `npm run electron-dev` - Development with hot reload
- `npm run electron-dist` - Build distributables

### Capacitor Scripts

- `npm run capacitor-init` - Initialize Capacitor
- `npm run capacitor-add-android` - Add Android platform
- `npm run capacitor-add-ios` - Add iOS platform
- `npm run capacitor-build` - Build and sync platforms
- `npm run capacitor-build-android` - Open Android project
- `npm run capacitor-build-ios` - Open iOS project
- `npm run capacitor-dev` - Run on device/emulator

## Technologies

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Express.js, Node.js
- **Database**: SQLite with Drizzle ORM
- **Desktop**: Electron
- **Mobile**: Capacitor
- **PWA**: Vite PWA plugin

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on all platforms
5. Submit a pull request

## License

MIT License
