import { fireEvent, render, screen } from '@testing-library/react'
import { DEFAULT_SETTINGS, type ControlSettings } from '@dos/shared/profile'
import { BoardSettingsLayer, zoomStepsPerWheel } from './BoardSettingsLayer'

function renderLayer(controls: Partial<ControlSettings>) {
  const onWheel = vi.fn()
  const onContextMenu = vi.fn()
  render(
    <BoardSettingsLayer
      display={DEFAULT_SETTINGS.display}
      controls={{ ...DEFAULT_SETTINGS.controls, ...controls }}
    >
      <div data-testid="map" onWheel={onWheel} onContextMenu={onContextMenu} />
    </BoardSettingsLayer>,
  )
  return { map: screen.getByTestId('map'), onWheel, onContextMenu }
}

describe('Spielfeld-Einstellungen', () => {
  it('Zoom-Empfindlichkeit: 50 wie bisher, 0 halb so viele, 100 doppelt so viele Schritte', () => {
    expect(zoomStepsPerWheel(50)).toBe(1)
    expect(zoomStepsPerWheel(0)).toBe(0.5)
    expect(zoomStepsPerWheel(100)).toBe(2)
  })

  it('lässt bei geringer Empfindlichkeit jedes zweite Mausrad-Ereignis aus', () => {
    const { map, onWheel } = renderLayer({ zoomSensitivity: 0 })
    for (let i = 0; i < 4; i++) fireEvent.wheel(map, { deltaY: -100 })
    expect(onWheel).toHaveBeenCalledTimes(2)
  })

  it('wiederholt Zoom-Schritte bei hoher Empfindlichkeit', async () => {
    const { map, onWheel } = renderLayer({ zoomSensitivity: 100 })
    fireEvent.wheel(map, { deltaY: -100 })
    expect(onWheel).toHaveBeenCalledTimes(1)
    await vi.waitFor(() => expect(onWheel).toHaveBeenCalledTimes(2))
  })

  it('rechte Maustaste: „Abbrechen“ erreicht die Karte, „Kontextmenü“ nicht', () => {
    const cancel = renderLayer({ rightClick: 'cancel' })
    fireEvent.contextMenu(cancel.map)
    expect(cancel.onContextMenu).toHaveBeenCalledTimes(1)
    document.body.innerHTML = ''
    const menu = renderLayer({ rightClick: 'contextMenu' })
    fireEvent.contextMenu(menu.map)
    expect(menu.onContextMenu).not.toHaveBeenCalled()
  })
})
