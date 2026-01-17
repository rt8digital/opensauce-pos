const { spawn, execSync } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');

console.log('🚀 Starting Optimized Electron Development Environment...\n');

// Track file modification times to avoid unnecessary rebuilds
let lastMainBuildTime = 0;
let lastPreloadBuildTime = 0;

// Function to check if main process files have changed
function shouldRebuildMain() {
    try {
        const mainFiles = [
            'electron/main.ts',
            'electron/db-init.ts',
            'electron/preload.ts'
        ];
        
        const currentMaxTime = Math.max(...mainFiles
            .filter(file => fs.existsSync(file))
            .map(file => fs.statSync(file).mtimeMs)
        );
        
        const needsRebuild = currentMaxTime > lastMainBuildTime;
        if (needsRebuild) {
            lastMainBuildTime = Date.now();
        }
        return needsRebuild;
    } catch (error) {
        // If we can't check, rebuild to be safe
        return true;
    }
}

// Function to build main process only if needed
function buildMainProcessIfNeeded() {
    return new Promise((resolve, reject) => {
        if (!shouldRebuildMain()) {
            console.log('⏭️  Skipping main process build (no changes detected)');
            resolve();
            return;
        }
        
        console.log('🏗️  Building electron main process...');
        const buildProcess = spawn('npm', ['run', 'build:electron:main'], {
            stdio: 'inherit',
            shell: true
        });
        
        buildProcess.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Main process build completed\n');
                resolve();
            } else {
                console.error('❌ Failed to build electron main process');
                reject(new Error(`Build failed with code ${code}`));
            }
        });
        
        buildProcess.on('error', reject);
    });
}

// Function to start Vite dev server
function startViteServer() {
    return new Promise((resolve, reject) => {
        console.log('⚡ Starting Vite development server...');
        const viteProcess = spawn('npm', ['run', 'dev'], {
            stdio: 'pipe',
            shell: true
        });
        
        // Capture Vite output to detect when it's ready
        let viteOutput = '';
        viteProcess.stdout.on('data', (data) => {
            const output = data.toString();
            viteOutput += output;
            process.stdout.write(output);
            
            // Check if Vite is ready
            if (output.includes('ready in') || output.includes('Local:')) {
                console.log('\n✅ Vite server is ready!\n');
                resolve(viteProcess);
            }
        });
        
        viteProcess.stderr.on('data', (data) => {
            process.stderr.write(data);
        });
        
        viteProcess.on('error', reject);
        
        // Timeout after 2 minutes
        setTimeout(() => {
            reject(new Error('Vite server failed to start within timeout'));
        }, 120000);
    });
}

// Function to start Electron app
function startElectron(userDataDir) {
    return new Promise((resolve, reject) => {
        console.log('🖥️  Starting Electron app...');
        
        const electronArgs = [
            'electron', 
            '.', 
            '--user-data-dir=' + userDataDir,
            '--enable-logging'
        ];
        
        const electronProcess = spawn('npx', electronArgs, {
            stdio: 'inherit',
            shell: true
        });
        
        electronProcess.on('close', (code) => {
            console.log(`\nElectron app closed with code ${code}`);
            resolve(code);
        });
        
        electronProcess.on('error', reject);
    });
}

// Main async function
async function startDevEnvironment() {
    try {
        // Build main process if needed (in parallel with other setup)
        const buildPromise = buildMainProcessIfNeeded();
        
        // Set up user data directory
        const userDataDir = path.join(process.cwd(), '.dev-data');
        if (!fs.existsSync(userDataDir)) {
            fs.mkdirSync(userDataDir, { recursive: true });
        }
        
        // Wait for build to complete
        await buildPromise;
        
        // Start Vite server
        const viteProcess = await startViteServer();
        
        // Start Electron app
        const exitCode = await startElectron(userDataDir);
        
        // Cleanup
        try {
            viteProcess.kill();
        } catch (error) {
            console.log('Vite process already terminated');
        }
        
        process.exit(exitCode);
        
    } catch (error) {
        console.error('\n❌ Development environment startup failed:', error.message);
        process.exit(1);
    }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development environment...');
    process.exit(0);
});

// Start everything
startDevEnvironment();