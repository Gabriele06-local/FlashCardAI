import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    // Ottimizzazioni per il deployment
    minify: 'terser',
    rollupOptions: {
      input: {
        main: 'index.html'
      },
      output: {
        manualChunks: {
          // Separa Supabase in un chunk separato per il caching
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['@supabase/supabase-js']
  },
  // Configurazione per il deployment
  base: './',
  // Assicurati che i path relativi funzionino
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname
    }
  }
})
