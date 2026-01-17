#!/usr/bin/env node
const path = require('path');
const net = require('net');
const { spawn } = require('child_process');

const DEFAULT_PORT = process.env.PORT || 3000;
const HOST = '127.0.0.1';
const serverEntry = path.join(__dirname, '..', 'server', 'index.js'); // adjust to your server entry

function checkPortAvailable(port, host) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => resolve(false))
      .once('listening', () => {
        tester.once('close', () => resolve(true)).close();
      })
      .listen(port, host);
  });
}

(async () => {
  const available = await checkPortAvailable(DEFAULT_PORT, HOST);
  if (!available) {
    console.error(`Port ${DEFAULT_PORT} is already in use. Check running servers.`);
    process.exit(1);
  }

  // Spawn server using node
  const child = spawn(process.execPath, [serverEntry], {
    env: Object.assign({}, process.env, { PORT: DEFAULT_PORT }),
    stdio: 'inherit',
  });

  child.on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code);
  });
})();
