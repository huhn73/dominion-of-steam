import { defineConfig } from 'vitest/config'

// DATABASE_URL & Co. aus .env, falls vorhanden
try {
  process.loadEnvFile('.env')
} catch {
  // keine .env: Datenbanktests werden übersprungen
}

export default defineConfig({
  test: {
    // Die Tests teilen sich eine Datenbank
    fileParallelism: false,
  },
})
