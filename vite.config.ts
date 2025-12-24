import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'aws': ['@aws-sdk/client-s3'],
          'ui': ['antd']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@aws-sdk/client-s3']
  }
})
