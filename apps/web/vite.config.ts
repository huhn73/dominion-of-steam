/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'

// Version from the root package.json; the image build adds commit and date (VITE_APP_*)
const { version } = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
) as { version: string }

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: { __APP_VERSION__: JSON.stringify(version) },
  // Illustrationen und Audio liegen im Repo unter public/ (siehe product-plan/briefs/)
  publicDir: '../../public',
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      // Hochgeladene Avatare liefert der Server aus
      '/uploads': 'http://localhost:3000',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
