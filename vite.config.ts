import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            const p = id.replace(/\\/g, '/');
            if (!p.includes('node_modules')) return;
            if (p.includes('recharts') || p.includes('/d3-')) return 'charts';
            if (p.includes('/xlsx/') || p.endsWith('/xlsx')) return 'xlsx';
            if (p.includes('jspdf') || p.includes('html2canvas')) return 'pdf';
            if (p.includes('/react-dom/') || p.endsWith('/react-dom') || p.includes('/react/') || p.includes('/scheduler/')) return 'react';
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
