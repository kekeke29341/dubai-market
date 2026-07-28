import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/__tests__/**/*.{test,spec}.{ts,tsx}'],
    // API route tests use next/server (NextRequest) which needs node-compatible globals
    environmentMatchGlobs: [
      ['src/__tests__/api/**', 'node'],
      ['src/__tests__/pwa/sw-logic.test.ts', 'node'],
      ['src/__tests__/pwa/urlBase64.test.ts', 'node'],
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/app/**/*.tsx', 'src/lib/supabase/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
