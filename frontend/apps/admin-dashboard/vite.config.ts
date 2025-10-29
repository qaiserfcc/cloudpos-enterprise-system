import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@cloudpos/types': resolve(__dirname, '../../packages/types/src'),
      '@cloudpos/api-client': resolve(__dirname, '../../packages/api-client/src'),
      '@cloudpos/shared-ui': resolve(__dirname, '../../packages/shared-ui/src'),
      '@cloudpos/utils': resolve(__dirname, '../../packages/utils/src'),
      '@cloudpos/auth-store': resolve(__dirname, '../../packages/auth-store/src'),
      '@cloudpos/layout': resolve(__dirname, '../../packages/layout/src'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.env.REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL || 'http://localhost:3000/api'),
    'process.env.REACT_APP_ENCRYPTION_KEY': JSON.stringify(process.env.REACT_APP_ENCRYPTION_KEY || 'cloudpos-default-key'),
  },
  server: {
    port: 3002,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});