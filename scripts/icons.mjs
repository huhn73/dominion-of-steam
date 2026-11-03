// Renders public/icon.svg into the PNG sizes that index.html and manifest.webmanifest reference,
// and wraps the 32 px PNG into favicon.ico. Run after replacing the logo: `node scripts/icons.mjs`.
// Needs a Chromium (scripts/chromium.mjs).
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launchChromium } from './chromium.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pub = path.join(root, 'public')
const SIZES = [
  ['favicon-32.png', 32],
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
]

/** ICO container with a single PNG entry (every current browser reads PNG-in-ICO) */
function ico(png, size) {
  const header = Buffer.alloc(6 + 16)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(1, 4) // one image
  header.writeUInt8(size, 6)
  header.writeUInt8(size, 7)
  header.writeUInt8(0, 8) // palette
  header.writeUInt8(0, 9) // reserved
  header.writeUInt16LE(1, 10) // planes
  header.writeUInt16LE(32, 12) // bits per pixel
  header.writeUInt32LE(png.length, 14)
  header.writeUInt32LE(header.length, 18)
  return Buffer.concat([header, png])
}

const svg = readFileSync(path.join(pub, 'icon.svg'), 'utf8')
const browser = await launchChromium()
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 })
  const data = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  for (const [file, size] of SIZES) {
    await page.setViewportSize({ width: size, height: size })
    await page.setContent(
      `<!doctype html><html><body style="margin:0;background:#171C22"><img src="${data}" width="${size}" height="${size}" style="display:block"></body></html>`,
    )
    await page.waitForLoadState('load')
    const png = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: size, height: size },
    })
    writeFileSync(path.join(pub, file), png)
    if (size === 32) writeFileSync(path.join(pub, 'favicon.ico'), ico(png, size))
    console.log(`${file} (${size}px, ${png.length} bytes)`)
  }
} finally {
  await browser.close()
}
