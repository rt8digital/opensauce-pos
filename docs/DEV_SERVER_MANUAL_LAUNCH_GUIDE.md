# Manual Development Server Launch Guide

This guide provides step-by-step instructions for manually launching the OpenSauce POS development server for testing and development.

## Prerequisites

### System Requirements
- **Node.js**: Version 18+ required
- **npm**: Version 8+ (comes with Node.js)
- **Git**: For cloning the repository (if not already done)

### Check Prerequisites
```bash
# Verify Node.js installation
node --version

# Verify npm installation
npm --version
```

## Quick Start Commands

### 1. Install Dependencies (First Time Only)
```bash
npm install
```

This will install all required dependencies including:
- Vite (development server)
- React and related packages
- Electron for desktop app
- All UI components and libraries

### 2. Launch Client-Side Development Server

#### Option A: Basic Vite Dev Server
```bash
npm run dev
```

#### Option B: With Electron Desktop App
```bash
npm run dev:electron
```

#### Option C: Separate Terminal Approach
```bash
# Terminal 1: Start the client dev server
npm run dev

# Terminal 2 (Optional): Start backend server (if needed)
npm run start:server
```

## Port Configuration

### Client-Side Development Server
- **URL**: `http://localhost:5173`
- **Network Access**: `http://[your-ip]:5173` (accessible from other devices on same network)
- **Host**: Configured to accept external connections (`--host` flag)

### Backend Server (if running)
- **Default Port**: 3000 (or OS-assigned)
- **API Proxy**: Configured to route `/api/*` requests to backend when not in Electron mode

## Testing the Server

### 1. Verify Client Server is Running
Open your browser and navigate to:
- **Local**: http://localhost:5173
- **Network**: http://[your-computer-ip]:5173

You should see the OpenSauce POS login screen or main interface.

### 2. Check Console Output
Look for these success messages in the terminal:
```
✅ Vite server ready
✅ Local: http://localhost:5173
✅ Network: http://[your-ip]:5173
```

### 3. Verify Functionality
- **Login System**: Test user authentication
- **POS Interface**: Access point-of-sale features
- **Inventory Management**: Add/edit products
- **Settings**: Configure store preferences
- **Mobile Responsiveness**: Test on different screen sizes

## Server Management

### Starting the Server
```bash
# Start client development server
npm run dev

# The server will automatically:
# - Compile TypeScript files
# - Apply hot reload for instant updates
# - Serve static assets
# - Handle routing and API proxying
```

### Stopping the Server
- **Method 1**: Press `Ctrl + C` in the terminal running the server
- **Method 2**: Close the terminal window
- **Method 3**: If running as background process, use task manager to end node process

### Restarting the Server
```bash
# Stop current server (Ctrl+C), then restart
npm run dev
```

## Advanced Configuration

### Custom Ports
If port 5173 is occupied, Vite will automatically use the next available port (5174, 5175, etc.).

### Environment Variables
Create a `.env` file in the root directory for custom configuration:
```bash
# Example .env file
VITE_API_URL=http://localhost:3001
VITE_APP_TITLE=OpenSauce POS Dev
NODE_ENV=development
```

### Proxy Configuration
The Vite configuration includes proxy settings for API requests:
```javascript
// In vite.config.ts
proxy: {
  '/api': {
    target: 'http://localhost:5001',
    changeOrigin: true,
  },
}
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Port Already in Use
```
Error: Port 5173 is already in use
```
**Solution**: 
- Close other applications using port 5173
- Vite will automatically find next available port
- Or specify custom port: `npm run dev -- --port 3000`

#### 2. Node Modules Missing
```
Error: Cannot find module 'vite'
```
**Solution**: 
```bash
npm install
```

#### 3. TypeScript Compilation Errors
```
Error: TS2307: Cannot find module
```
**Solution**:
```bash
# Check TypeScript configuration
npm run check

# Rebuild type definitions
npm run build:client
```

#### 4. Electron App Won't Start
```
Error: electron is not recognized
```
**Solution**:
```bash
# Install Electron dependencies
npm install electron --save-dev

# Rebuild native modules
npm run rebuild:db
```

### Browser Compatibility
- **Recommended**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Features Used**: ES2020, WebGL, Local Storage, Service Workers
- **Mobile**: Responsive design supports iOS 13+ and Android 8+

### Performance Tips
- **Hot Reload**: Changes to `.tsx`, `.ts`, `.css` files auto-reload
- **Full Reload**: Changes to `vite.config.ts` or `package.json` require server restart
- **Build Cache**: Vite automatically caches compiled modules for faster reloads

## Development Workflow

### 1. Initial Setup
```bash
git clone [repository-url]
cd opensauce-pos
npm install
```

### 2. Daily Development
```bash
# Start development server
npm run dev

# Open browser to http://localhost:5173
# Make code changes - hot reload will update automatically
```

### 3. Testing Changes
- **Unit Tests**: `npm test`
- **E2E Tests**: `npm run test:e2e`
- **Type Checking**: `npm run check`

### 4. Building for Production
```bash
# Build all components
npm run build

# Build only client
npm run build:mobile

# Build Electron app
npm run build:electron
```

## Network Access for Testing

### Access from Mobile Device
1. Find your computer's IP address:
   ```bash
   # Windows
   ipconfig

   # Mac/Linux
   ifconfig
   ```

2. On mobile device, navigate to:
   ```
   http://[your-computer-ip]:5173
   ```

3. Ensure both devices are on same network and no firewall blocking port 5173

### Testing Responsive Design
- **Desktop**: http://localhost:5173
- **Tablet**: Use browser dev tools or actual tablet
- **Mobile**: Use browser dev tools or actual mobile device

## Security Notes

### Development Environment
- **Development mode** enables additional debugging features
- **Hot reload** may expose source code in browser dev tools
- **Network access** allows other devices to connect (use caution on public networks)

### Production Considerations
- Development server is **not** suitable for production use
- Use `npm run build` to create production build
- Deploy built files to web server or use Electron packaging

## Support

If you encounter issues not covered in this guide:

1. Check the project documentation in the `/docs` folder
2. Review error messages in browser console (F12)
3. Check terminal output for detailed error information
4. Ensure all dependencies are properly installed with `npm install`
5. Try clearing cache: `npm run dev -- --force`