import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true // exposes to local network for testing on real mobile devices via Wi-Fi!
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
