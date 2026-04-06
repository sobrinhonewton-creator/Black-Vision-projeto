import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Garante que Vite resolva extensões corretamente no Windows
    extensions: ['.jsx', '.js', '.tsx', '.ts', '.json'],
  },
  build: {
    outDir:    'dist',
    assetsDir: 'assets',
    sourcemap: false,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
})
