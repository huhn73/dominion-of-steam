import { describe, expect, it } from 'vitest'
import { mean, median, percentile, wilson } from '../stats'

describe('Statistik', () => {
  it('Wilson-Intervall mit Referenzwerten', () => {
    const close = (got: [number, number], want: [number, number]) => {
      expect(got[0]).toBeCloseTo(want[0], 3)
      expect(got[1]).toBeCloseTo(want[1], 3)
    }
    close(wilson(0, 10), [0, 0.2775])
    close(wilson(5, 10), [0.2366, 0.7634])
    close(wilson(10, 10), [0.7225, 1])
    expect(wilson(0, 0)).toEqual([0, 1])
  })

  it('Median und Perzentil', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 3, 2])).toBe(2.5)
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.95)).toBeCloseTo(9.55)
    expect(mean([])).toBe(0)
    expect(mean([2, 4])).toBe(3)
  })
})
