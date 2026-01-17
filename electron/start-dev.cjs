const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

console.log('Starting Electron development environment...\n');

// Build electron main process
console.log('Building electron main process...');
const buildProcess = spawn('npm', ['run', 'build:electron:main'], {
    stdio: 'inherit',
    shell: true
});

buildProcess.on('close', (code) => {
    if (code !== 0) {
        console.error('Failed to build electron main process');
        process.exit(code);
    }

    console.log('\nStarting Vite development server...');
    const viteProcess = spawn('npm', ['run', 'dev'], {
        stdio: 'inherit',
        shell: true
    });

    viteProcess.on('error', (error) => {
        console.error('Failed to start Vite process:', error);
        process.exit(1);
    });

    // Simple function to check if Vite is ready
    function waitForVite(attempts = 0) {
        if (attempts > 120) { // 2 minute timeout (120 * 1 second)
            console.error('Vite server failed to start within timeout');
            process.exit(1);
        }

        const req = http.get('http://localhost:5173', (res) => {
            if (res.statusCode) {
                console.log('Vite server is ready!\n');
                console.log('Starting Electron app...');

                // Use a local user data directory to avoid permission issues and conflicts
                const userDataDir = path.join(process.cwd(), '.dev-data');

                const electronProcess = spawn('npx', ['electron', '.', '--user-data-dir=' + userDataDir], {
                    stdio: 'inherit',
                    shell: true
                });

                electronProcess.on('close', () => {
                    // Kill the Vite process when Electron closes
                    try {
                        viteProcess.kill();
                    } catch (error) {
                        console.log('Vite process already terminated');
                    }
                    process.exit(0);
                });
            }
        });

        req.on('error', () => {
            // Vite not ready yet, wait and retry
            setTimeout(() => waitForVite(attempts + 1), 1000);
        });

        req.end();
    }

    console.log('Waiting for Vite server to be ready on http://localhost:5173...');
    setTimeout(() => waitForVite(), 2000);
});