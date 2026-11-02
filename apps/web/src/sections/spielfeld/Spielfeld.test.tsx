import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import sample from '../../../../../product-plan/sections/spielfeld-and-zuge/sample-data.json'
import { Spielfeld } from './components'
import { buildIndex, hexKey, hexToPixel, packMap, reachableTiles } from './components/hex'
import { clampCamera, fitScale, MAX_SCALE } from './components/camera'
import { airBases, unsafeTiles } from '@dos/shared/game/fuel'
import type { CombatResult, HexCoord, SpielfeldUndZuegeProps, Tile, Unit } from './types'

// Beispieldaten aus der Design-Übergabe, wie in tests.md beschrieben; die Karte dort hat noch
// Feldobjekte, der Client liest das kompakte Format
const data = {
  ...sample,
  map: packMap(sample.map as { width: number; height: number; seed: string; tiles: Tile[] }),
} as unknown as SpielfeldUndZuegeProps & { lastCombat: CombatResult }

function renderBoard(overrides: Partial<SpielfeldUndZuegeProps> = {}) {
  const callbacks = {
    onSelectUnit: vi.fn(),
    onSetSentry: vi.fn(),
    onEndTurn: vi.fn(),
    onSkipReplay: vi.fn(),
    onSelectEvent: vi.fn(),
    onCue: vi.fn(),
  }
  const props = { ...data, lastCombat: null, ...callbacks, ...overrides }
  const result = render(
    <div style={{ width: 1280, height: 744 }}>
      <Spielfeld {...props} />
    </div>,
  )
  return { ...callbacks, props, ...result }
}

const nextUnitButton = () => screen.getByRole('button', { name: /Nächste/ })
const endTurnButton = () => screen.getByRole('button', { name: /Zug beenden/ })
/** Tap a tile: in jsdom the map's camera stays at 0/0/1, so hex pixels are screen pixels */
function tap(c: HexCoord) {
  const map = screen.getByRole('application', { name: 'Spielkarte' })
  const { x, y } = hexToPixel(c)
  fireEvent.pointerDown(map, { clientX: x, clientY: y, pointerId: 1, button: 0 })
  fireEvent.pointerUp(map, { clientX: x, clientY: y, pointerId: 1, button: 0 })
}
const unitPanel = (name: RegExp | string) => screen.queryByRole('region', { name })

describe('Spielfeld', () => {
  it('springt mit „Nächste Einheit“ zu offenen Einheiten und gibt Befehle', async () => {
    const { onSelectUnit, onSetSentry } = renderBoard()
    expect(nextUnitButton()).toHaveTextContent('5')

    await userEvent.click(nextUnitButton())
    expect(onSelectUnit).toHaveBeenCalledWith('u1')
    const panel = screen.getByRole('region', { name: 'Einheit Grenadiere' })
    expect(panel).toHaveTextContent('Björn · Eisenbund von Valdrin')
    expect(panel).toHaveTextContent('Kein Befehl')

    await userEvent.click(within(panel).getByRole('button', { name: /Wache/ }))
    expect(onSetSentry).toHaveBeenCalledWith('u1')
  })

  it('fragt beim Zugende nach, wenn Einheiten noch Befehle brauchen', async () => {
    const { onEndTurn, onSelectUnit } = renderBoard()
    await userEvent.click(endTurnButton())
    const dialog = screen.getByRole('alertdialog', { name: 'Zug beenden?' })
    expect(dialog).toHaveTextContent('5 Einheiten haben in dieser Runde noch keine Befehle.')

    await userEvent.click(within(dialog).getByRole('button', { name: 'Zu den Einheiten' }))
    expect(onEndTurn).not.toHaveBeenCalled()
    expect(onSelectUnit).toHaveBeenCalled()

    await userEvent.click(endTurnButton())
    await userEvent.click(screen.getByRole('button', { name: 'Trotzdem beenden' }))
    expect(onEndTurn).toHaveBeenCalledTimes(1)
  })

  it('beendet den Zug ohne Rückfrage, wenn keine Einheit Befehle braucht', async () => {
    const units = data.units.map((u) => ({ ...u, needsOrders: false }))
    const { onEndTurn } = renderBoard({ units })
    expect(nextUnitButton()).toBeDisabled()
    await userEvent.click(endTurnButton())
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(onEndTurn).toHaveBeenCalledTimes(1)
  })

  it('zeigt die Gegnerzug-Wiederholung und lässt sie überspringen', async () => {
    const { onSkipReplay } = renderBoard({ match: { ...data.match, phase: 'replay' } })
    expect(screen.getByText(/Gegnerzug/)).toHaveTextContent('Admiral Kessler')
    expect(screen.getByText('1/4')).toBeInTheDocument()
    expect(endTurnButton()).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: /Überspringen/ }))
    expect(onSkipReplay).toHaveBeenCalled()
  })

  it('überspringt eine leere Wiederholung sofort', () => {
    const { onSkipReplay } = renderBoard({ match: { ...data.match, phase: 'replay' }, replay: [] })
    expect(onSkipReplay).toHaveBeenCalled()
    expect(screen.queryByText(/Gegnerzug/)).not.toBeInTheDocument()
  })

  it('zeigt beim Warten die aktiven Gegner und sperrt die Aktionen', () => {
    renderBoard({ match: { ...data.match, phase: 'waiting' } })
    expect(screen.getByText('Warte auf Admiral Kessler & Lena Hartmann …')).toBeInTheDocument()
    expect(endTurnButton()).toBeDisabled()
  })

  it('listet Ereignisse und meldet den angetippten Eintrag', async () => {
    const { onSelectEvent } = renderBoard()
    const toggle = screen.getByRole('button', { name: /Ereignisse/ })
    expect(toggle).toHaveTextContent('6 neu')
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(screen.getByText('Südwacht wurde von Admiral Kessler erobert.'))
    expect(onSelectEvent).toHaveBeenCalledWith('ev1')
  })

  it('zeigt ohne Ereignisse keinen Zähler, aber einen Hinweis', async () => {
    renderBoard({ events: [] })
    const toggle = screen.getByRole('button', { name: /Ereignisse/ })
    expect(toggle).not.toHaveTextContent('neu')
    await userEvent.click(toggle)
    expect(screen.getByText('Keine Ereignisse seit deinem letzten Zug.')).toBeInTheDocument()
  })

  it('meldet das Kampfergebnis als Toast, sobald lastCombat gesetzt wird', () => {
    const { rerender, props } = renderBoard()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    rerender(
      <div style={{ width: 1280, height: 744 }}>
        <Spielfeld {...props} lastCombat={{ ...data.lastCombat }} />
      </div>,
    )
    const toast = screen.getByRole('status')
    expect(toast).toHaveTextContent('Niederlage')
    expect(toast).toHaveTextContent('Dein Doppeldecker wurde vom Wolkenkreuzer abgeschossen.')
    expect(toast).toHaveTextContent('Schaden: eigene −1 · Gegner −0 TP · 1 Runde')
  })

  it('wechselt beim Tippen reihum: Einheit → Stadt → nichts', async () => {
    renderBoard()
    tap({ col: 3, row: 4 }) // Eisenhafen mit u3 auf Wache
    expect(unitPanel('Einheit Grenadiere')).toBeInTheDocument()
    tap({ col: 3, row: 4 })
    expect(unitPanel('Stadt Eisenhafen')).toBeInTheDocument()
    expect(unitPanel('Einheit Grenadiere')).not.toBeInTheDocument()
    tap({ col: 3, row: 4 })
    expect(unitPanel('Stadt Eisenhafen')).not.toBeInTheDocument()
    expect(unitPanel('Einheit Grenadiere')).not.toBeInTheDocument()
  })

  it('zeigt Stapel mit Zähler, Feldliste und Garnison', async () => {
    const extra: Unit = {
      ...data.units.find((u) => u.id === 'u2')!,
      id: 'u99',
      col: 3,
      row: 4,
      order: { type: 'none' },
      needsOrders: true,
    }
    const { onSelectUnit } = renderBoard({ units: [...data.units, extra] })
    expect(screen.getByLabelText('2 Einheiten')).toBeInTheDocument()
    // Ladung ist kein Stapel: der Frachter mit zwei Einheiten zeigt nur das Ladungs-Abzeichen
    expect(screen.queryByLabelText('3 Einheiten')).not.toBeInTheDocument()

    tap({ col: 3, row: 4 }) // zuerst die Einheit mit offenen Befehlen
    expect(onSelectUnit).toHaveBeenLastCalledWith('u99')
    const panel = unitPanel('Einheit Panzerwagen')!
    const field = within(panel).getByRole('list', { name: 'Auf diesem Feld' })
    expect(within(field).getAllByRole('listitem')).toHaveLength(3) // zwei Einheiten, eine Stadt
    await userEvent.click(within(field).getByRole('button', { name: /Grenadiere/ }))
    expect(onSelectUnit).toHaveBeenLastCalledWith('u3')
    expect(unitPanel('Einheit Grenadiere')).toBeInTheDocument()

    await userEvent.click(
      within(unitPanel('Einheit Grenadiere')!).getByRole('button', { name: /Eisenhafen/ }),
    )
    const city = unitPanel('Stadt Eisenhafen')!
    const garrison = within(city).getByRole('list', { name: 'Garnison' })
    expect(within(garrison).getAllByRole('listitem')).toHaveLength(2)
    await userEvent.click(within(garrison).getByRole('button', { name: /Panzerwagen/ }))
    expect(unitPanel('Einheit Panzerwagen')).toBeInTheDocument()
  })

  it('setzt „Nächste Einheit“ hinter der zuletzt gewählten Einheit fort', async () => {
    const { onSelectUnit, props, rerender } = renderBoard()
    await userEvent.click(nextUnitButton())
    await userEvent.click(nextUnitButton())
    expect(onSelectUnit).toHaveBeenLastCalledWith('u5')
    // u5 hat Befehle bekommen: weiter geht es dahinter, nicht wieder bei u1
    const units = props.units.map((u) => (u.id === 'u5' ? { ...u, needsOrders: false } : u))
    rerender(
      <div style={{ width: 1280, height: 744 }}>
        <Spielfeld {...props} units={units} />
      </div>,
    )
    await userEvent.click(nextUnitButton())
    expect(onSelectUnit).toHaveBeenLastCalledWith('u8')
    // Taste N
    fireEvent.keyDown(window, { key: 'n' })
    expect(onSelectUnit).toHaveBeenLastCalledWith('u9')
  })

  it('spielt die Kampfsequenz ab und zeigt den Toast erst danach', () => {
    vi.useFakeTimers()
    try {
      const { rerender, props } = renderBoard({ combatAnimationMs: 1000 })
      rerender(
        <div style={{ width: 1280, height: 744 }}>
          <Spielfeld {...props} combatAnimationMs={1000} lastCombat={{ ...data.lastCombat }} />
        </div>,
      )
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
      expect(nextUnitButton()).toBeDisabled() // gesperrt, solange die Sequenz läuft
      act(() => vi.advanceTimersByTime(250))
      expect(screen.getByTestId('muzzle-fx')).toBeInTheDocument()
      expect(props.onCue).not.toHaveBeenCalledWith({ type: 'hit' })
      act(() => vi.advanceTimersByTime(200))
      expect(screen.getByTestId('combat-fx')).toBeInTheDocument()
      expect(props.onCue).toHaveBeenCalledWith({ type: 'hit' })
      expect(props.onCue).not.toHaveBeenCalledWith({ type: 'unitDestroyed' })
      act(() => vi.advanceTimersByTime(600))
      expect(screen.getByRole('status')).toHaveTextContent('Niederlage')
      expect(props.onCue).toHaveBeenCalledWith({ type: 'unitDestroyed' })
      expect(nextUnitButton()).toBeEnabled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('blitzt je Treffer, höchstens viermal, und lässt den Sieger weiterziehen', () => {
    vi.useFakeTimers()
    try {
      // u2 (Panzerwagen, 2 Züge) hat e2 nach zwei Runden vernichtet und einen Zug übrig
      const combat: CombatResult = {
        attackerUnitId: 'u2',
        defenderUnitId: 'e2',
        targetCityId: null,
        hits: ['defender', 'attacker'],
        attackerDamage: 1,
        defenderDamage: 1,
        attackerDestroyed: false,
        defenderDestroyed: true,
        advanced: false,
        captured: false,
        garrisonUnitId: null,
        message: 'Panzerwagen gegen Grenadiere: Gegner vernichtet.',
      }
      const { rerender, props, onCue } = renderBoard({ combatAnimationMs: 1000 })
      rerender(
        <div style={{ width: 1280, height: 744 }}>
          <Spielfeld {...props} combatAnimationMs={1000} lastCombat={combat} />
        </div>,
      )
      act(() => vi.advanceTimersByTime(1050))
      const hits = onCue.mock.calls.filter((call) => (call[0] as { type: string }).type === 'hit')
      expect(hits).toHaveLength(2)
      expect(props.onCue).toHaveBeenCalledWith({ type: 'unitDestroyed' })
      const toast = screen.getByRole('status')
      expect(toast).toHaveTextContent('Sieg')
      expect(toast).toHaveTextContent('Schaden: eigene −1 · Gegner −1 TP · 2 Runden')
      expect(nextUnitButton()).toBeEnabled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('zeigt im Angriffsdialog Siegchance, Trefferchance und Schaden je Treffer', async () => {
    renderBoard()
    // u4 (Kanonenboot, 2/3 TP) gegen e1 (Panzerkreuzer), Vorschau aus den Beispieldaten
    const u4 = data.units.find((u) => u.id === 'u4')!
    const e1 = data.units.find((u) => u.id === 'e1')!
    tap(u4)
    tap(e1)
    const dialog = screen.getByText('Angriff').closest('div')!
    expect(dialog).toHaveTextContent('Siegchance')
    expect(dialog).toHaveTextContent('18 %')
    expect(dialog).toHaveTextContent('Trefferchance je Runde 18 %')
    expect(dialog).toHaveTextContent('Schaden je Treffer: eigene 1, Gegner 3 TP')
    expect(dialog).toHaveTextContent('Erwarteter eigener Verlust −1.0 TP')
    await userEvent.click(screen.getByRole('button', { name: 'Abbrechen' }))
    expect(screen.queryByText('Angriff')).not.toBeInTheDocument()
  })

  it('warnt beim Stadtangriff, dass die Einheit verbraucht wird', () => {
    renderBoard()
    const u2 = data.units.find((u) => u.id === 'u2')!
    const c4 = data.cities.find((c) => c.id === 'c4')!
    tap(u2)
    tap(c4)
    const dialog = screen.getByText('Angriff').closest('div')!
    expect(dialog).toHaveTextContent('Eroberungschance')
    expect(dialog).toHaveTextContent('86 %')
    expect(dialog).toHaveTextContent(
      'Die Einheit wird dabei verbraucht und hinterlässt bei Erfolg Grenadiere in der Stadt.',
    )
  })

  it('meldet Auswahl, Zugende und Wiedergabe als Ton-Cues', async () => {
    const { onCue } = renderBoard()
    await userEvent.click(nextUnitButton())
    expect(onCue).toHaveBeenCalledWith({ type: 'unitSelected', unitTypeId: 'grenadiere' })
    // Same unit again: no second select cue
    const selects = () => onCue.mock.calls.filter(([c]) => c.type === 'unitSelected').length
    const before = selects()
    await userEvent.click(nextUnitButton())
    expect(selects()).toBe(before + 1) // next unit is another one
    await userEvent.click(endTurnButton())
    await userEvent.click(screen.getByRole('button', { name: 'Trotzdem beenden' }))
    expect(onCue).toHaveBeenCalledWith({ type: 'turnEnded' })

    const replay = renderBoard({ match: { ...data.match, phase: 'replay' } })
    expect(replay.onCue).toHaveBeenCalledWith({
      type: 'replayStep',
      action: data.replay[0]!.action,
      last: data.replay[0]!.path.length === 1,
    })
  })

  it('meldet die Umgebung des Kartenausschnitts', () => {
    vi.useFakeTimers()
    try {
      const { onCue } = renderBoard()
      act(() => vi.advanceTimersByTime(300))
      const cue = onCue.mock.calls.map(([c]) => c).find((c) => c.type === 'ambience')
      expect(cue).toBeDefined()
      const mix = (cue as { mix: Record<string, number> }).mix
      const sum = Object.values(mix).reduce((a, b) => a + b, 0)
      expect(sum).toBeCloseTo(1, 5)
    } finally {
      vi.useRealTimers()
    }
  })

  it('zeigt die Produktionsübersicht im Stadt-Panel', () => {
    renderBoard()
    tap({ col: 6, row: 2 }) // Kesselstadt ohne Einheiten
    const city = unitPanel('Stadt Kesselstadt')!
    expect(city).toHaveTextContent(/Reichsweit 11 Einheiten · 2 im Bau/)
    expect(within(city).getByRole('button', { name: /^Grenadiere/ })).toHaveTextContent(
      /Bestand \d+ · 1 im Bau \(hier\)/,
    )
    expect(within(city).getByRole('button', { name: /Dampfkoloss/ })).toHaveTextContent(
      '1 im Bau (Eisenhafen)',
    )
  })
})

describe('Rundenbericht', () => {
  const report = () => screen.queryByRole('dialog', { name: /Rundenbericht/ })
  const replayOverlay = () => screen.queryByText(/Gegnerzug ·/)

  it('erscheint zu Zugbeginn vor der Wiedergabe und gruppiert die Ereignisse', () => {
    const { onSkipReplay } = renderBoard({
      match: { ...data.match, phase: 'replay' },
      showTurnReport: true,
    })
    const dialog = report()!
    expect(dialog).toHaveTextContent('Rundenbericht · Runde 14')
    expect(
      within(dialog)
        .getAllByRole('heading', { level: 3 })
        .map((h) => h.textContent),
    ).toEqual([
      'Verluste1',
      'Städte1',
      'Gefechte1',
      'Entdeckt2',
      'Gegnerbewegungen4',
      'Eigenes Reich2',
    ])
    expect(dialog).toHaveTextContent('Südwacht wurde von Admiral Kessler erobert.')
    expect(replayOverlay()).not.toBeInTheDocument()
    expect(endTurnButton()).toBeDisabled()
    expect(onSkipReplay).not.toHaveBeenCalled()
  })

  it('startet die Wiedergabe mit „Gegnerzüge ansehen“', async () => {
    const { onSkipReplay } = renderBoard({
      match: { ...data.match, phase: 'replay' },
      showTurnReport: true,
    })
    await userEvent.click(screen.getByRole('button', { name: /Gegnerzüge ansehen/ }))
    expect(report()).not.toBeInTheDocument()
    expect(replayOverlay()).toHaveTextContent('Admiral Kessler')
    expect(onSkipReplay).not.toHaveBeenCalled()
  })

  it('überspringt Bericht und Wiedergabe zusammen', async () => {
    const { onSkipReplay } = renderBoard({
      match: { ...data.match, phase: 'replay' },
      showTurnReport: true,
    })
    await userEvent.click(within(report()!).getByRole('button', { name: /Überspringen/ }))
    expect(report()).not.toBeInTheDocument()
    expect(onSkipReplay).toHaveBeenCalledTimes(1)
  })

  it('bietet ohne automatische Wiedergabe nur „Weiter“ an, das die Wiedergabe überspringt', async () => {
    const { onSkipReplay } = renderBoard({
      match: { ...data.match, phase: 'replay' },
      showTurnReport: true,
      canWatchReplay: false,
    })
    expect(screen.queryByRole('button', { name: /Gegnerzüge ansehen/ })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Weiter' }))
    expect(onSkipReplay).toHaveBeenCalledTimes(1)
    expect(report()).not.toBeInTheDocument()
  })

  it('zeigt im eigenen Zug „Weiter“ und bleibt nach einem Sprung offen', async () => {
    const { onSelectEvent, onSkipReplay } = renderBoard({ showTurnReport: true })
    const dialog = report()!
    await userEvent.click(within(dialog).getByText('Südwacht wurde von Admiral Kessler erobert.'))
    expect(onSelectEvent).toHaveBeenCalledWith('ev1')
    expect(report()).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Weiter' }))
    expect(report()).not.toBeInTheDocument()
    expect(onSkipReplay).not.toHaveBeenCalled()
  })

  it('erscheint nur einmal pro Zug und lässt sich aus dem Protokoll wieder öffnen', async () => {
    const { unmount } = renderBoard({ showTurnReport: true })
    await userEvent.click(screen.getByRole('button', { name: 'Weiter' }))
    unmount()
    renderBoard({ showTurnReport: true })
    expect(report()).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Ereignisse/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Rundenbericht anzeigen' }))
    expect(report()).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Schließen' }))
    expect(report()).not.toBeInTheDocument()
  })

  it('erscheint in einer neuen Runde wieder', async () => {
    const { rerender, props } = renderBoard({ showTurnReport: true })
    await userEvent.click(screen.getByRole('button', { name: 'Weiter' }))
    rerender(
      <div style={{ width: 1280, height: 744 }}>
        <Spielfeld {...props} match={{ ...data.match, phase: 'waiting' }} />
      </div>,
    )
    expect(report()).not.toBeInTheDocument()
    rerender(
      <div style={{ width: 1280, height: 744 }}>
        <Spielfeld {...props} match={{ ...data.match, round: 15, phase: 'yourTurn' }} />
      </div>,
    )
    expect(report()).toHaveTextContent('Runde 15')
  })

  it('bleibt in ruhigen Runden und ohne Einstellung aus', () => {
    renderBoard({ showTurnReport: true, events: [], replay: [] })
    expect(report()).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Rundenbericht anzeigen' })).not.toBeInTheDocument()
  })
})

describe('Flugzeuge: Treibstoffschutz und Erkunden', () => {
  const plane = () => data.units.find((u) => u.id === 'u8')!
  const planeType = () => data.unitTypes.find((t) => t.id === 'doppeldecker')!
  /** Reachable tiles of the Doppeldecker split into safe and unsafe, straight from the shared rules */
  const tiles = (units = data.units) => {
    const idx = buildIndex(data.map, data.cities, units, data.unitTypes, 'p1')
    const unit = units.find((u) => u.id === 'u8')!
    const reach = reachableTiles(unit, idx)
    const unsafe = unsafeTiles(
      unit,
      planeType(),
      reach,
      airBases(data.cities, units, data.unitTypes, 'p1'),
    )
    const all = [...reach.values()]
    return {
      unsafe: all.filter((r) => unsafe.has(hexKey(r.coord))).map((r) => r.coord),
      safe: all.filter((r) => !unsafe.has(hexKey(r.coord)) && r.dist > 0).map((r) => r.coord),
    }
  }
  const dialog = () => screen.queryByRole('alertdialog', { name: 'Kein Rückweg' })

  it('schraffiert Felder ohne Rückweg rot', () => {
    renderBoard()
    tap(plane())
    expect(screen.getByRole('region', { name: 'Einheit Doppeldecker' })).toBeInTheDocument()
    const { unsafe, safe } = tiles()
    expect(unsafe.length).toBeGreaterThan(0)
    expect(safe.length).toBeGreaterThan(0)
    expect(screen.getAllByTestId('unsafe-tile')).toHaveLength(unsafe.length)
  })

  it('fragt vor einem Flug ohne Rückweg nach und fliegt erst nach Bestätigung', async () => {
    const onMoveUnit = vi.fn()
    renderBoard({ onMoveUnit })
    tap(plane())
    const target = tiles().unsafe[0]!
    tap(target)
    expect(dialog()).not.toBeInTheDocument()
    tap(target)
    expect(dialog()).toHaveTextContent(/Nach diesem Zug bleiben \d+ Treibstoff/)
    expect(onMoveUnit).not.toHaveBeenCalled()
    await userEvent.click(within(dialog()!).getByRole('button', { name: 'Abbrechen' }))
    expect(dialog()).not.toBeInTheDocument()
    tap(target)
    tap(target)
    await userEvent.click(within(dialog()!).getByRole('button', { name: /Trotzdem fliegen/ }))
    expect(onMoveUnit).toHaveBeenCalledWith('u8', target)
    expect(dialog()).not.toBeInTheDocument()
  })

  it('fliegt sichere Ziele ohne Nachfrage an', () => {
    const onMoveUnit = vi.fn()
    renderBoard({ onMoveUnit })
    tap(plane())
    const target = tiles().safe[0]!
    tap(target)
    tap(target)
    expect(dialog()).not.toBeInTheDocument()
    expect(onMoveUnit).toHaveBeenCalledWith('u8', target)
  })

  it('bietet „Zur Basis“ und „Erkunden“ nur für Flugzeuge an', async () => {
    const onMoveUnit = vi.fn()
    const onSetExplore = vi.fn()
    renderBoard({ onMoveUnit, onSetExplore })
    tap(plane())
    const panel = screen.getByRole('region', { name: 'Einheit Doppeldecker' })
    await userEvent.click(within(panel).getByRole('button', { name: /Zur Basis/ }))
    // Kesselstadt (6,2) is the nearest base, three tiles away: within this round's reach
    expect(onMoveUnit).toHaveBeenCalledWith('u8', { col: 6, row: 2 })
    await userEvent.click(within(panel).getByRole('button', { name: /Erkunden/ }))
    expect(onSetExplore).toHaveBeenCalledWith('u8')

    await userEvent.click(nextUnitButton())
    const ground = screen.getByRole('region', { name: /^Einheit / })
    expect(ground).not.toHaveAccessibleName('Einheit Doppeldecker')
    expect(within(ground).queryByRole('button', { name: /Erkunden/ })).not.toBeInTheDocument()
    expect(within(ground).queryByRole('button', { name: /Zur Basis/ })).not.toBeInTheDocument()
  })

  it('warnt beim Zugende vor Flugzeugen, die keine Basis mehr erreichen', async () => {
    const units = data.units.map((u) =>
      u.id === 'u8' ? { ...u, fuel: 1, needsOrders: false } : { ...u, needsOrders: false },
    )
    const { onEndTurn, onSelectUnit } = renderBoard({ units })
    await userEvent.click(endTurnButton())
    const warn = screen.getByRole('alertdialog', { name: 'Zug beenden?' })
    expect(warn).toHaveTextContent(
      'Ein Flugzeug erreicht mit dem Treibstoff keine Basis mehr: Doppeldecker bei 8,3 (Treibstoff 1, Basis 3 Felder).',
    )
    expect(onEndTurn).not.toHaveBeenCalled()
    await userEvent.click(within(warn).getByRole('button', { name: 'Zu den Einheiten' }))
    expect(onSelectUnit).toHaveBeenCalledWith('u8')
    expect(screen.getByRole('region', { name: 'Einheit Doppeldecker' })).toHaveTextContent('1/12')
  })
})

describe('Angriffsmarkierungen', () => {
  it('zeichnet je Feld eine Markierung, auch bei einem feindlichen Stapel, und räumt sie wieder weg', async () => {
    // two enemy grenadiers next to the own tank u1 on one tile
    const u1 = data.units.find((u) => u.id === 'u1')!
    const enemyType = 'grenadiere'
    const spot = { col: u1.col + 1, row: u1.row }
    const enemies: Unit[] = ['x1', 'x2'].map((id) => ({
      id,
      unitTypeId: enemyType,
      ownerId: 'p2',
      col: spot.col,
      row: spot.row,
      hp: 1,
      movesLeft: 0,
      fuel: null,
      order: { type: 'none' },
      cargoUnitIds: [],
      carriedBy: null,
      needsOrders: false,
    }))
    const units = data.units
      .map((u) => (u.id === 'u1' ? { ...u, movesLeft: 1 } : u))
      .concat(enemies)
    const { rerender, props } = renderBoard({ units })
    await userEvent.click(nextUnitButton())
    expect(screen.getByRole('region', { name: 'Einheit Grenadiere' })).toBeInTheDocument()
    const markers = screen.getAllByTestId('attack-marker')
    expect(markers.length).toBeGreaterThan(0)
    const keys = markers.map((m) => m.getAttribute('transform'))
    expect(new Set(keys).size).toBe(keys.length)

    // the tank moved on: the stack is out of reach, no marker may linger
    const moved = units.map((u) => (u.id === 'u1' ? { ...u, col: u.col - 3, movesLeft: 0 } : u))
    rerender(
      <div style={{ width: 1280, height: 744 }}>
        <Spielfeld {...props} units={moved} />
      </div>,
    )
    expect(screen.queryAllByTestId('attack-marker')).toHaveLength(0)
  })
})

describe('Partieabschluss', () => {
  const finished = {
    match: { ...data.match, phase: 'waiting' as const, round: 93, turnDeadline: null },
    result: {
      winnerId: 'p1',
      endedAt: '2026-10-31T12:00:00Z',
      placements: { p1: 1, p2: 2, p3: 3, p4: 4 },
    },
  }

  it('zeigt die Ergebniskarte mit Rangliste statt des Warte-Banners', () => {
    renderBoard(finished)
    const dialog = screen.getByRole('dialog', { name: 'Sieg' })
    expect(within(dialog).getByText(/beendet in Runde 93 · Sieger: Björn/)).toBeInTheDocument()
    const rows = within(dialog).getAllByRole('row').slice(1)
    expect(rows.map((r) => within(r).getAllByRole('cell')[0]!.textContent)).toEqual([
      '1',
      '2',
      '3',
      '4',
    ])
    // Own row: marked; counts 3 cities, 11 units → 20 points
    expect(rows[0]).toHaveAttribute('aria-current', 'true')
    expect(within(rows[0]!).getByText('(du)')).toBeInTheDocument()
    const [, name, ...counts] = within(rows[0]!).getAllByRole('cell')
    expect(name).toHaveTextContent('Björn')
    expect(counts.map((c) => c.textContent)).toEqual(['3', '11', '20'])
    // AI chip and the eliminated participant without counts
    expect(within(rows[1]!).getByText('KI')).toBeInTheDocument()
    expect(within(rows[3]!).getByText('ausgeschieden')).toBeInTheDocument()
    expect(
      within(rows[3]!)
        .getAllByRole('cell')
        .slice(2)
        .map((c) => c.textContent),
    ).toEqual(['–', '–', '–'])
    expect(screen.queryByText(/Warte auf/)).toBeNull()
    expect(screen.getByRole('button', { name: 'Partie beendet' })).toBeDisabled()
    expect(nextUnitButton()).toBeDisabled()
  })

  it('lässt die Karte ansehen, öffnet das Ergebnis wieder und führt zur Lobby', async () => {
    const onLeave = vi.fn()
    renderBoard({ ...finished, onLeave })
    await userEvent.click(screen.getByRole('button', { name: 'Karte ansehen' }))
    expect(screen.queryByRole('dialog', { name: 'Sieg' })).toBeNull()
    expect(screen.getByText('Beendet · Sieg')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Ergebnis' }))
    expect(screen.getByRole('dialog', { name: 'Sieg' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Zur Lobby' }))
    expect(onLeave).toHaveBeenCalled()
  })

  it('stempelt Niederlage und Aufgabe', () => {
    const { unmount } = renderBoard({ ...finished, result: { ...finished.result, winnerId: 'p2' } })
    expect(screen.getByRole('dialog', { name: 'Niederlage' })).toBeInTheDocument()
    unmount()
    renderBoard({
      ...finished,
      result: { ...finished.result, winnerId: 'p2' },
      participants: data.participants.map((p) =>
        p.id === 'p1' ? { ...p, isAI: true, name: 'KI für Björn' } : p,
      ),
    })
    expect(screen.getByRole('dialog', { name: 'Aufgegeben' })).toBeInTheDocument()
  })
})

describe('Kamera', () => {
  const viewport = { width: 1280, height: 744 }
  /** Camera from the world group's transform attribute (set outside React by the store) */
  const camera = () => {
    const world = screen
      .getByRole('application', { name: 'Spielkarte' })
      .querySelector(':scope > g[transform]')!
    const m = /translate\((\S+) (\S+)\) scale\((\S+)\)/.exec(world.getAttribute('transform')!)!
    return { x: Number(m[1]), y: Number(m[2]), scale: Number(m[3]) }
  }

  beforeEach(() => {
    // the board measures its container; jsdom's stub never reports a size
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(private cb: ResizeObserverCallback) {}
        observe() {
          this.cb(
            [{ contentRect: viewport } as ResizeObserverEntry],
            this as unknown as ResizeObserver,
          )
        }
        unobserve() {}
        disconnect() {}
      },
    )
    // animations finish within two frames
    let ts = 0
    vi.stubGlobal('requestAnimationFrame', (cb: (t: number) => void) => {
      cb((ts += 1000))
      return ts
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('startet bei der ersten offenen Einheit und bleibt in der Karte', () => {
    renderBoard()
    const cam = camera()
    expect(cam.scale).toBe(1.1)
    expect(clampCamera(cam, viewport, data.map)).toEqual(cam)
  })

  it('zoomt mit + und -, schwenkt mit den Pfeiltasten und passt mit F ein', () => {
    renderBoard()
    const start = camera()
    fireEvent.keyDown(window, { key: '+' })
    expect(camera().scale).toBeCloseTo(start.scale * 1.25)
    fireEvent.keyDown(window, { key: '-' })
    expect(camera().scale).toBeCloseTo(start.scale)

    const before = camera()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(camera()).toEqual(clampCamera({ ...before, x: before.x - 80 }, viewport, data.map))
    fireEvent.keyDown(window, { key: 'ArrowDown', shiftKey: true })
    expect(camera().y).toBeCloseTo(
      clampCamera({ ...camera(), y: before.y - 320 }, viewport, data.map).y,
    )

    fireEvent.keyDown(window, { key: 'f' })
    expect(camera().scale).toBeCloseTo(Math.min(MAX_SCALE, fitScale(viewport, data.map)))
    // the whole map is centred: no zoom beyond the bounds afterwards either
    fireEvent.keyDown(window, { key: '-' })
    expect(camera().scale).toBeGreaterThanOrEqual(0.45 - 1e-9)
  })

  it('bietet „Karte einpassen“ als Knopf an und ignoriert Tasten in Eingabefeldern', async () => {
    renderBoard()
    const start = camera()
    await userEvent.click(screen.getByRole('button', { name: 'Karte einpassen' }))
    expect(camera().scale).toBeCloseTo(Math.min(MAX_SCALE, fitScale(viewport, data.map)))
    expect(camera()).not.toEqual(start)
    const input = document.createElement('input')
    document.body.appendChild(input)
    const fitted = camera()
    fireEvent.keyDown(input, { key: '+' })
    expect(camera()).toEqual(fitted)
    input.remove()
  })
})
