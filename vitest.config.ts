import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./__tests__/setup.ts'],
    include: ['__tests__/**/*.test.{ts,tsx}'],
    // Tests are mock-contract tests; pin the backend so the suite is hermetic
    // regardless of a developer's local .env (e.g. VITE_BACKEND=supabase for manual testing).
    env: { VITE_BACKEND: 'mock' },
  },
})
