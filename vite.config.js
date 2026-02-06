import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    tailwindcss(),
    react(),
    visualizer({ 
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true
     }),
  ],
   preview: {
    host: true,                      
    allowedHosts: ['intranet.promabio.com'], 
    port: 4173                       
  },
  build: {
    target: 'es2020',
    minify: 'terser',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('/react/') || id.includes('/react-dom/')) {
              return 'react-vendor'
            }
            if (id.includes('/@supabase/')) {
              return 'supabase-vendor'
            }
            if (id.includes('/react-toastify/') || id.includes('/framer-motion/')) {
              return 'ui-vendor'
            }
            if (id.includes('/axios/') || id.includes('/lodash/')) {
              return 'utils-vendor'
            }
            if (id.includes('/socket.io/')) {
              return 'socket-vendor'
            }
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: true,
    terserOptions: {
      compress: {
        drop_console: import.meta.env.MODE === 'production', 
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug', 'console.info', 'console.warn']
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-redux',
      '@supabase/supabase-js'
    ]
  }
})
