import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  root: './client',
  base: './',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      overlay: false, // Disable error overlay for better performance
    },
  },
  build: {
    outDir: '../dist/renderer',
    emptyOutDir: true,
    sourcemap: false, // Disable sourcemaps for faster builds
    commonjsOptions: {
      include: [/@zxing\/library/, /node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'wouter'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-slot',
            '@radix-ui/react-toast',
            'lucide-react',
            'framer-motion'
          ],
          'utils-vendor': ['clsx', 'tailwind-merge', 'date-fns', 'zod'],
        }
      }
    }
  },
  plugins: [
    react(),
    visualizer({
      open: false,
      filename: '../dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './client/src'),
      '@shared': resolve(__dirname, './shared'),
    },
  },
  optimizeDeps: {
    include: [
      'lucide-react',
      '@zxing/library',
      'framer-motion',
      'react-hook-form',
      '@tanstack/react-query',
      'recharts'
    ],
  },
});
