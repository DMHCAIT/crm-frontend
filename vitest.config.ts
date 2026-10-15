import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/__tests__/setup.ts'],
    env: {
      VITE_API_BASE_URL: 'http://127.0.0.1:9',
      VITE_API_BACKEND_URL: 'http://127.0.0.1:9',
      VITE_SUPABASE_URL: 'http://127.0.0.1:9',
      VITE_SUPABASE_ANON_KEY: 'test-only-placeholder'
    }
  },
});