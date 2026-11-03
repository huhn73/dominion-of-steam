// Scales the unit illustrations (public/art/units/**/*.webp, 4:3) down to 320×240 previews in
// public/art/units/thumbs/ with the same relative path. Lists and the faction page load these
// instead of the large originals. Run after adding or replacing unit art:
// `node scripts/unit-thumbs.mjs`. Needs a Chromium (scripts/chromium.mjs).
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launchChromium } from './chromium.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const units = path.join(root, 'public', 'art', 'units')
const thumbs = path.join(units, 'thumbs')
const WIDTH = 320
const HEIGHT = 240
const QUALITY = 0.8

const sources = readdirSync(units, { recursive: true })
  .map(String)
  .filter((f) => f.endsWith('.webp') && !f.startsWith('thumbs'))
  .sort()

const browser = await launchChromium()
let total = 0
try {
  const page = await browser.newPage()
  for (const file of sources) {
    const data = `data:image/webp;base64,${readFileSync(path.join(units, file)).toString('base64')}`
    const out = await page.evaluate(
      async ({ data, width, height, quality }) => {
        const img = new Image()
        img.src = data
        await img.decode()
        // cover: crop to 4:3 around the center if an original deviates
        const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight)
        const w = img.naturalWidth * scale
        const h = img.naturalHeight * scale
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h)
        return canvas.toDataURL('image/webp', quality)
      },
      { data, width: WIDTH, height: HEIGHT, quality: QUALITY },
    )
    const bytes = Buffer.from(out.slice(out.indexOf(',') + 1), 'base64')
    const target = path.join(thumbs, file)
    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, bytes)
    total += bytes.length
    console.log(`${file} (${bytes.length} bytes)`)
  }
} finally {
  await browser.close()
}
console.log(`${sources.length} Vorschaubilder, zusammen ${Math.round(total / 1024)} KB`)
