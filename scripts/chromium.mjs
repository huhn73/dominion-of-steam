// Shared by the image scripts: a Chromium via Playwright (dependency or npx cache), with Google
// Chrome as the browser if the Playwright browsers are not installed.
import { existsSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

async function loadPlaywright() {
  try {
    return await import('playwright')
  } catch {
    // not a dependency: look in the npx cache
  }
  const cache = path.join(homedir(), '.npm', '_npx')
  if (existsSync(cache))
    for (const dir of readdirSync(cache)) {
      const entry = path.join(cache, dir, 'node_modules', 'playwright', 'index.mjs')
      if (existsSync(entry)) return import(pathToFileURL(entry).href)
    }
  throw new Error(
    'Playwright nicht gefunden. Einmal `npx -y playwright@1.56.1 --version` ausführen oder `pnpm add -D -w playwright`.',
  )
}

export async function launchChromium() {
  const { chromium } = await loadPlaywright()
  const chrome = '/usr/bin/google-chrome'
  return chromium.launch(existsSync(chrome) ? { executablePath: chrome } : {})
}
