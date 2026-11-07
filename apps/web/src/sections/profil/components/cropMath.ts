// Geometrie des Zuschnitt-Dialogs: Zustand ist die Mitte des Ausschnitts in Bildpixeln und der Zoom

/** Square cut-out in pixels of the upright image, as the server expects it */
export interface Crop {
  x: number
  y: number
  size: number
}

export interface CropView {
  /** Centre of the cut-out in image pixels */
  cx: number
  cy: number
  /** 1 = the largest square that fits, up to MAX_ZOOM */
  zoom: number
}

export const MAX_ZOOM = 4

/** Edge length of the cut-out in image pixels */
export const cropSize = (width: number, height: number, zoom: number) =>
  Math.min(width, height) / zoom

/** Keep zoom in range and the cut-out inside the image */
export function clampView(view: CropView, width: number, height: number): CropView {
  const zoom = Math.min(Math.max(view.zoom, 1), MAX_ZOOM)
  const half = cropSize(width, height, zoom) / 2
  const clamp = (v: number, max: number) => Math.min(Math.max(v, half), max - half)
  return { cx: clamp(view.cx, width), cy: clamp(view.cy, height), zoom }
}

/** Start: the largest centred square */
export const initialView = (width: number, height: number): CropView => ({
  cx: width / 2,
  cy: height / 2,
  zoom: 1,
})

/** Move the picture by `dx`/`dy` screen pixels on a stage `stage` pixels wide */
export function panView(
  view: CropView,
  dx: number,
  dy: number,
  stage: number,
  width: number,
  height: number,
): CropView {
  const perScreenPx = cropSize(width, height, view.zoom) / stage
  return clampView(
    { ...view, cx: view.cx - dx * perScreenPx, cy: view.cy - dy * perScreenPx },
    width,
    height,
  )
}

/** The cut-out in whole image pixels */
export function cropFromView(view: CropView, width: number, height: number): Crop {
  const v = clampView(view, width, height)
  const size = Math.floor(cropSize(width, height, v.zoom))
  const x = Math.round(v.cx - size / 2)
  const y = Math.round(v.cy - size / 2)
  return {
    x: Math.min(Math.max(x, 0), width - size),
    y: Math.min(Math.max(y, 0), height - size),
    size,
  }
}

/** Where to draw the image on the stage: size and offset in screen pixels */
export function imageLayout(view: CropView, stage: number, width: number, height: number) {
  const size = cropSize(width, height, view.zoom)
  const scale = stage / size
  return {
    width: width * scale,
    height: height * scale,
    left: -(view.cx - size / 2) * scale,
    top: -(view.cy - size / 2) * scale,
  }
}
