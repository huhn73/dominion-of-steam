import { useEffect, useState } from 'react'
import { REDUCE_MOTION_CLASS } from '../../../settings/motion'

/**
 * URLs from `candidates` whose images have loaded so far, in the order of `candidates`.
 * Missing files never resolve, so views keep showing their placeholder until real artwork exists.
 */
export function useLoadedImages(candidates: (string | null | undefined)[]) {
  const urls = candidates.filter((u): u is string => !!u)
  const key = urls.join('|')
  const [loaded, setLoaded] = useState<{ key: string; urls: string[] }>({ key: '', urls: [] })

  useEffect(() => {
    if (!key) return
    const images = key.split('|').map((url) => {
      const img = new Image()
      img.onload = () =>
        setLoaded((prev) => ({ key, urls: prev.key === key ? [...prev.urls, url] : [url] }))
      img.src = url
      return img
    })
    return () => images.forEach((img) => (img.onload = null))
  }, [key])

  const done = loaded.key === key ? loaded.urls : []
  return urls.filter((u) => done.includes(u))
}

/** The first URL from `candidates` whose image has loaded (or the next candidate), or null */
export function useFirstLoadedImage(candidates: (string | null | undefined)[]) {
  return useLoadedImages(candidates)[0] ?? null
}

/** True once the image at `url` has loaded */
export function useImageLoaded(url: string | null | undefined) {
  return useFirstLoadedImage([url]) !== null
}

/** Small preview of a unit illustration (`scripts/unit-thumbs.mjs`, 320×240) */
export function unitThumbUrl(url: string): string
export function unitThumbUrl(url: string | null | undefined): string | null
export function unitThumbUrl(url: string | null | undefined) {
  return url ? url.replace('/art/units/', '/art/units/thumbs/') : null
}

/** Preview first, the original as fallback if the preview is missing */
export const unitImageCandidates = (url: string | null | undefined) => [unitThumbUrl(url), url]

export const VARIANT_CYCLE_MS = 6000

function motionReduced() {
  return (
    document.documentElement.classList.contains(REDUCE_MOTION_CLASS) ||
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  )
}

/**
 * Index that advances every `intervalMs` through `count` entries, one timer for all rows that
 * share it. Stands still with reduced motion (checked on every tick, so the setting applies at
 * once) and while the tab is hidden.
 */
export function useVariantCycle(count: number, intervalMs = VARIANT_CYCLE_MS) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (count < 2) return
    const timer = setInterval(() => {
      if (motionReduced()) setIndex(0)
      else if (!document.hidden) setIndex((i) => (i + 1) % count)
    }, intervalMs)
    return () => clearInterval(timer)
  }, [count, intervalMs])
  return count > 0 ? index % count : 0
}
