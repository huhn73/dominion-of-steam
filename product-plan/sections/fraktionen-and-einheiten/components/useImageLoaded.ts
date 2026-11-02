import { useEffect, useState } from 'react'

/**
 * Returns the first URL from `candidates` whose image has loaded, or null.
 * Missing files never resolve, so views keep showing their placeholder
 * (or the next candidate) until real artwork exists.
 */
export function useFirstLoadedImage(candidates: (string | null | undefined)[]) {
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
  return urls.find((u) => done.includes(u)) ?? null
}

/** True once the image at `url` has loaded */
export function useImageLoaded(url: string | null | undefined) {
  return useFirstLoadedImage([url]) !== null
}
