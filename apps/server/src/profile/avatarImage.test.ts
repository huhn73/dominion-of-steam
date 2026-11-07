import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { AvatarImageError, centerCrop, fitCrop, renderAvatar } from './avatarImage'

const solid = (width: number, height: number, background: string) =>
  sharp({ create: { width, height, channels: 3, background } })

describe('fitCrop', () => {
  it('rundet, kürzt auf die kürzere Seite und schiebt ins Bild', () => {
    expect(fitCrop({ x: 10.4, y: 20.6, size: 100.2 }, 400, 300)).toEqual({
      x: 10,
      y: 21,
      size: 100,
    })
    expect(fitCrop({ x: 0, y: 0, size: 500 }, 400, 300)).toEqual({ x: 0, y: 0, size: 300 })
    expect(fitCrop({ x: 350, y: -20, size: 100 }, 400, 300)).toEqual({ x: 300, y: 0, size: 100 })
  })

  it('verwirft zu kleine, ungültige und völlig fremde Ausschnitte', () => {
    expect(fitCrop({ x: 0, y: 0, size: 20 }, 400, 300)).toBeNull()
    expect(fitCrop({ x: Number.NaN, y: 0, size: 100 }, 400, 300)).toBeNull()
    expect(fitCrop({ x: 400, y: 0, size: 100 }, 400, 300)).toBeNull()
    expect(fitCrop({ x: -100, y: 0, size: 100 }, 400, 300)).toBeNull()
  })

  it('mittiges Quadrat', () => {
    expect(centerCrop(400, 300)).toEqual({ x: 50, y: 0, size: 300 })
    expect(centerCrop(100, 301)).toEqual({ x: 0, y: 100, size: 100 })
  })
})

describe('renderAvatar', () => {
  it('liefert 256×256 WebP ohne Metadaten', async () => {
    const out = await renderAvatar(await solid(1000, 600, '#336699').jpeg().toBuffer())
    const meta = await sharp(out).metadata()
    expect([meta.format, meta.width, meta.height, meta.exif]).toEqual(['webp', 256, 256, undefined])
  })

  it('dreht nach EXIF, bevor der Ausschnitt greift', async () => {
    // Querformat 400×200, links rot, rechts blau; EXIF 6 heißt: aufrecht 200×400, oben rot
    const landscape = await solid(400, 200, '#ff0000')
      .composite([{ input: await solid(200, 200, '#0000ff').png().toBuffer(), left: 200, top: 0 }])
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer()
    const top = await renderAvatar(landscape, { x: 0, y: 0, size: 200 })
    const [r, , b] = await sharp(top)
      .extract({ left: 128, top: 128, width: 1, height: 1 })
      .raw()
      .toBuffer()
    expect(r).toBeGreaterThan(200)
    expect(b).toBeLessThan(60)
  })

  it('animierte GIFs werden zum Standbild', async () => {
    const gif = await solid(64, 64, '#00ff00').gif().toBuffer()
    const meta = await sharp(await renderAvatar(gif)).metadata()
    expect([meta.width, meta.height, meta.pages ?? 1]).toEqual([256, 256, 1])
  })

  it('kaputte Bilder und falsche Ausschnitte werfen AvatarImageError', async () => {
    await expect(renderAvatar(Buffer.from('kein Bild'))).rejects.toMatchObject({
      kind: 'unreadable',
    })
    const png = await solid(100, 100, '#000').png().toBuffer()
    await expect(renderAvatar(png, { x: 0, y: 0, size: 10 })).rejects.toBeInstanceOf(
      AvatarImageError,
    )
  })
})
