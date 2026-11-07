// Avatare: Zuschnitt und Verkleinerung auf ein kleines WebP
import sharp, { type OutputInfo } from 'sharp'

/** Edge length of a stored avatar; twice the largest display size (128 px) for sharp screens */
export const AVATAR_SIZE = 256
/** Smallest square the player may cut out */
export const AVATAR_MIN_CROP = 32
/** Guard against decompression bombs (40 megapixels is more than any phone camera) */
const MAX_INPUT_PIXELS = 40_000_000

/** Square cut-out in pixels of the upright image (after the EXIF rotation) */
export interface AvatarCrop {
  x: number
  y: number
  size: number
}

export class AvatarImageError extends Error {
  constructor(readonly kind: 'unreadable' | 'invalidCrop') {
    super(kind)
  }
}

/**
 * Fit a requested crop into the image: rounded, at most the shorter side, shifted inside. Returns
 * null if it is unusable (not finite, too small, or completely outside the image).
 */
export function fitCrop(crop: AvatarCrop, width: number, height: number): AvatarCrop | null {
  const { x, y, size } = crop
  if (![x, y, size].every(Number.isFinite)) return null
  const side = Math.min(Math.round(size), width, height)
  if (side < AVATAR_MIN_CROP) return null
  if (x >= width || y >= height || x + size <= 0 || y + size <= 0) return null
  const clamp = (v: number, max: number) => Math.min(Math.max(0, Math.round(v)), max)
  return { x: clamp(x, width - side), y: clamp(y, height - side), size: side }
}

/** The largest centred square */
export function centerCrop(width: number, height: number): AvatarCrop {
  const size = Math.min(width, height)
  return { x: Math.floor((width - size) / 2), y: Math.floor((height - size) / 2), size }
}

/**
 * Turn an uploaded image into the stored avatar: upright (EXIF), cut to the square (the centre
 * without a crop), scaled to 256×256, WebP without metadata. Animated images keep the first frame.
 */
export async function renderAvatar(data: Buffer, crop?: AvatarCrop): Promise<Buffer> {
  let upright: { data: Buffer; info: OutputInfo }
  try {
    upright = await sharp(data, { limitInputPixels: MAX_INPUT_PIXELS, animated: false })
      .rotate()
      .raw()
      .toBuffer({ resolveWithObject: true })
  } catch {
    throw new AvatarImageError('unreadable')
  }
  const { width, height, channels } = upright.info
  const area = crop ? fitCrop(crop, width, height) : centerCrop(width, height)
  if (!area) throw new AvatarImageError('invalidCrop')
  try {
    return await sharp(upright.data, { raw: { width, height, channels } })
      .extract({ left: area.x, top: area.y, width: area.size, height: area.size })
      .resize(AVATAR_SIZE, AVATAR_SIZE)
      .webp({ quality: 82 })
      .toBuffer()
  } catch {
    throw new AvatarImageError('unreadable')
  }
}
