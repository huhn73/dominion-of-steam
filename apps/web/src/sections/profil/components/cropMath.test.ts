import { describe, expect, it } from 'vitest'
import { clampView, cropFromView, imageLayout, initialView, MAX_ZOOM, panView } from './cropMath'

describe('cropMath', () => {
  it('startet mit dem größten mittigen Quadrat', () => {
    expect(cropFromView(initialView(400, 200), 400, 200)).toEqual({ x: 100, y: 0, size: 200 })
    expect(cropFromView(initialView(300, 900), 300, 900)).toEqual({ x: 0, y: 300, size: 300 })
  })

  it('Zoom verkleinert den Ausschnitt um die Mitte und bleibt im Bereich', () => {
    const v = clampView({ ...initialView(400, 200), zoom: 2 }, 400, 200)
    expect(cropFromView(v, 400, 200)).toEqual({ x: 150, y: 50, size: 100 })
    expect(clampView({ ...v, zoom: 10 }, 400, 200).zoom).toBe(MAX_ZOOM)
    expect(clampView({ ...v, zoom: 0.2 }, 400, 200).zoom).toBe(1)
  })

  it('Verschieben rechnet Bildschirm- in Bildpixel um und hält den Ausschnitt im Bild', () => {
    // Bühne 200 px, Ausschnitt 200 Bildpixel: 1:1; Bild nach links ziehen = Ausschnitt nach rechts
    const moved = panView(initialView(400, 200), -50, 0, 200, 400, 200)
    expect(cropFromView(moved, 400, 200)).toEqual({ x: 150, y: 0, size: 200 })
    const far = panView(moved, -1000, -1000, 200, 400, 200)
    expect(cropFromView(far, 400, 200)).toEqual({ x: 200, y: 0, size: 200 })
    // Bei Zoom 2 bewegt ein Bildschirmpixel nur einen halben Bildpixel
    const zoomed = panView({ cx: 200, cy: 100, zoom: 2 }, -40, 0, 200, 400, 200)
    expect(zoomed.cx).toBe(220)
  })

  it('Layout legt den Ausschnitt genau auf die Bühne', () => {
    const l = imageLayout({ cx: 300, cy: 100, zoom: 1 }, 100, 400, 200)
    expect(l).toEqual({ width: 200, height: 100, left: -100, top: -0 })
  })
})
