/** Wilson score interval for k successes in n trials, z = 1.96 for 95 % */
export function wilson(k: number, n: number, z = 1.96): [number, number] {
  if (n === 0) return [0, 1]
  const p = k / n
  const z2 = z * z
  const denom = 1 + z2 / n
  const centre = (p + z2 / (2 * n)) / denom
  const half = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / denom
  return [Math.max(0, centre - half), Math.min(1, centre + half)]
}

export const mean = (xs: readonly number[]) =>
  xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length

/** Linear interpolation between the neighbouring ranks */
export function percentile(xs: readonly number[], q: number): number {
  if (xs.length === 0) return 0
  const sorted = [...xs].sort((a, b) => a - b)
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (pos - lo)
}

export const median = (xs: readonly number[]) => percentile(xs, 0.5)
