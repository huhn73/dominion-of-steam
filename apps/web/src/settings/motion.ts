/** „Animationen reduzieren“: class on <html> (see styles/index.css), remembered for the next start */
export const REDUCE_MOTION_STORAGE_KEY = 'dos.reduceMotion'
export const REDUCE_MOTION_CLASS = 'dos-reduce-motion'

export function applyReduceMotion(reduce: boolean) {
  document.documentElement.classList.toggle(REDUCE_MOTION_CLASS, reduce)
  try {
    // Read by the inline script in index.html before the first paint
    if (reduce) localStorage.setItem(REDUCE_MOTION_STORAGE_KEY, '1')
    else localStorage.removeItem(REDUCE_MOTION_STORAGE_KEY)
  } catch {
    // Speicher gesperrt: gilt nur für diese Sitzung
  }
}
