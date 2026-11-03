import { act, render, renderHook, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { COMPENDIUM_FACTIONS, COMPENDIUM_UNIT_TYPES } from '@dos/shared/compendium'
import { withBonus } from '@dos/shared/game/bonus'
import { FACTIONS, UNIT_TYPES } from '@dos/shared/game'
import { bonusEffect } from '../../sections/fraktionen/components/theme'
import { UnitRow } from '../../sections/fraktionen/components/UnitRow'
import {
  VARIANT_CYCLE_MS,
  useVariantCycle,
} from '../../sections/fraktionen/components/useImageLoaded'
import { REDUCE_MOTION_CLASS } from '../../settings/motion'
import { renderApp } from '../../test/renderApp'
import { mockApi } from '../../test/mockApi'

const compendium = { factions: COMPENDIUM_FACTIONS, unitTypes: COMPENDIUM_UNIT_TYPES }
const withData = () => mockApi({ 'GET /compendium': () => ({ json: compendium }) })

afterEach(() => vi.unstubAllGlobals())

describe('Bonusregel', () => {
  it('rechnet im Kompendium genauso wie im Spiel', () => {
    const stats = ['movement', 'range', 'productionTurns', 'strength', 'defense'] as const
    for (const f of COMPENDIUM_FACTIONS) {
      for (const u of COMPENDIUM_UNIT_TYPES) {
        const effect = bonusEffect(u, f)
        const gameFaction = FACTIONS.find((x) => x.id === f.id)!
        const gameType = UNIT_TYPES.find((x) => x.id === u.id)!
        for (const stat of stats) {
          const expected = effect?.stat === stat ? effect.value : u[stat]
          expect(withBonus(gameType, gameFaction, stat), `${f.id}/${u.id}/${stat}`).toBe(expected)
        }
      }
    }
  })
})

describe('Kompendium', () => {
  it('zeigt einen Ladezustand und ist unter „Fraktionen“ aktiv', async () => {
    withData()
    renderApp('/fraktionen')
    expect(screen.getByText('Lade Fraktionen und Einheiten …')).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: /Fraktionen & Einheiten/ }),
    ).toBeInTheDocument()
    const nav = screen.getAllByRole('navigation', { name: 'Hauptnavigation' })[0]!
    expect(within(nav).getByRole('button', { name: 'Fraktionen' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('meldet Ladefehler mit erneutem Versuch', async () => {
    mockApi({
      'GET /compendium': () => ({
        status: 500,
        json: { error: { code: 'X', message: 'Server kaputt' } },
      }),
    })
    renderApp('/fraktionen')
    expect(await screen.findByText('Server kaputt')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Erneut versuchen' })).toBeInTheDocument()
  })

  it('Ablauf 1: öffnet eine Fraktion und kehrt zurück', async () => {
    withData()
    const { router } = renderApp('/fraktionen')
    await userEvent.click(await screen.findByRole('button', { name: /Aurelische Republik/ }))
    expect(router.state.location.pathname).toBe('/fraktionen/aurelia')
    expect(screen.getByRole('heading', { name: 'Geschichte' })).toBeInTheDocument()
    expect(screen.getAllByText(/Seemacht/).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Blitzkorvette').length).toBeGreaterThan(0)
    await userEvent.click(screen.getByRole('button', { name: /Zurück/ }))
    expect(router.state.location.pathname).toBe('/fraktionen')
  })

  it('Ablauf 2: filtert Einheiten und setzt die Filter zurück', async () => {
    withData()
    renderApp('/fraktionen')
    await userEvent.click(await screen.findByRole('radio', { name: /Luft/ }))
    expect(screen.getByText('3 von 12 Typen')).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Herkunft' }), 'eisenbund')
    expect(screen.getByText('Keine Einheiten gefunden')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Filter zurücksetzen/ }))
    expect(screen.getByText('12 von 12 Typen')).toBeInTheDocument()
  })

  it('Ablauf 3: öffnet eine Einheit aus der Fraktion mit Ausführung und Bonus', async () => {
    withData()
    const { router } = renderApp('/fraktionen/eisenbund')
    // Panzerwagen: der Schwerindustrie-Bonus gilt erst ab fünf Runden Bauzeit, Grenadiere zeigen ihn nicht
    await userEvent.click((await screen.findAllByRole('button', { name: /Panzerwagen/ }))[0]!)
    expect(router.state.location.pathname + router.state.location.search).toBe(
      '/einheiten/panzerwagen?ausfuehrung=eisenbund',
    )
    expect(screen.getByRole('tab', { name: /Eisenbund/ })).toHaveAttribute('aria-selected', 'true')
    expect(
      screen.getByText(/Hervorgehoben: durch „Schwerindustrie“ \(Eisenbund\) veränderter Wert/),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('tab', { name: /Nordmark/ }))
    expect(screen.queryByText(/Hervorgehoben/)).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Zurück/ }))
    expect(router.state.location.pathname).toBe('/fraktionen/eisenbund')
  })

  it('erklärt die Gefechtsregeln je Einheit', async () => {
    withData()
    renderApp('/einheiten/tauchboot')
    const combat = await screen.findByRole('region', { name: 'Gefecht' })
    expect(combat).toHaveTextContent('Nur Schiffe')
    expect(combat).toHaveTextContent('Kein Geländebonus · Stadt +1')
  })

  it('zeigt Landeinheiten die Geländeboni', async () => {
    withData()
    renderApp('/einheiten/grenadiere')
    const combat = await screen.findByRole('region', { name: 'Gefecht' })
    expect(combat).toHaveTextContent(
      'Land, Schiffe auf Nachbarfeldern (Küste, Hafen) und Flugzeuge über Land',
    )
    expect(combat).toHaveTextContent('Wald +1 · Hügel +1 · Gebirge +2 · Stadt +1')
  })

  it('Ablauf 4: führt von der Sondereinheit zur Fraktion', async () => {
    withData()
    const { router } = renderApp('/einheiten/wolkenkreuzer')
    expect(await screen.findByText('Sondereinheit von')).toBeInTheDocument()
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    await userEvent.click(screen.getByText('Sondereinheit von').closest('button')!)
    expect(router.state.location.pathname).toBe('/fraktionen/nordmark')
  })

  it('führt bei Direktaufruf mit „Zurück“ zu einem sinnvollen Ziel', async () => {
    withData()
    const { router } = renderApp('/einheiten/panzerkreuzer?ausfuehrung=aurelia')
    await userEvent.click(await screen.findByRole('button', { name: /Zurück/ }))
    expect(router.state.location.pathname).toBe('/fraktionen/aurelia')
  })

  it('zeigt bei unbekannten IDs eine Nicht-gefunden-Ansicht', async () => {
    withData()
    renderApp('/fraktionen/xyz')
    expect(await screen.findByText(/Diese Fraktion gibt es nicht/)).toBeInTheDocument()
  })
})

/** jsdom loads no images: every image "loads" right away */
function stubImages() {
  vi.stubGlobal(
    'Image',
    class {
      onload: (() => void) | null = null
      set src(_: string) {
        queueMicrotask(() => this.onload?.())
      }
    },
  )
}

describe('Einheitenbilder', () => {
  afterEach(() => {
    vi.useRealTimers()
    document.documentElement.classList.remove(REDUCE_MOTION_CLASS)
  })

  it('wechselt die Ausführung alle sechs Sekunden, bei reduzierten Animationen nicht', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useVariantCycle(4))
    expect(result.current).toBe(0)
    act(() => vi.advanceTimersByTime(VARIANT_CYCLE_MS))
    expect(result.current).toBe(1)
    act(() => vi.advanceTimersByTime(3 * VARIANT_CYCLE_MS))
    expect(result.current).toBe(0)

    document.documentElement.classList.add(REDUCE_MOTION_CLASS)
    act(() => vi.advanceTimersByTime(2 * VARIANT_CYCLE_MS))
    expect(result.current).toBe(0)
  })

  it('blendet in der Zeile zur aktiven Ausführung über, der Rahmen folgt der Fraktion', async () => {
    stubImages()
    const unit = COMPENDIUM_UNIT_TYPES.find((u) => u.id === 'grenadiere')!
    const variants = [
      { url: '/a.webp', color: 'rgb(245, 158, 11)' },
      { url: '/b.webp', color: 'rgb(244, 63, 94)' },
    ]
    const { rerender } = render(<UnitRow unit={unit} variants={variants} activeVariant={0} />)
    const frame = await screen.findByTestId('unit-variants')
    const opaque = () =>
      [...frame.querySelectorAll('img')]
        .filter((img) => img.classList.contains('opacity-100'))
        .map((img) => img.getAttribute('src'))
    expect(opaque()).toEqual(['/a.webp'])
    expect(frame).toHaveStyle({ borderColor: 'rgb(245, 158, 11)' })

    rerender(<UnitRow unit={unit} variants={variants} activeVariant={1} />)
    expect(opaque()).toEqual(['/b.webp'])
    expect(frame).toHaveStyle({ borderColor: 'rgb(244, 63, 94)' })
  })

  it('zeigt allgemeinen Einheiten der Liste die Vorschaubilder der Fraktionen', async () => {
    stubImages()
    withData()
    renderApp('/fraktionen')
    const row = (await screen.findAllByRole('button', { name: /Grenadiere/ }))[0]!
    const frame = await within(row).findByTestId('unit-variants')
    expect([...frame.querySelectorAll('img')].map((img) => img.getAttribute('src'))).toEqual(
      COMPENDIUM_FACTIONS.map((f) => `/art/units/thumbs/${f.id}/grenadiere.webp`),
    )
  })

  it('zeigt auf der Fraktionsseite das Bild der Sondereinheit', async () => {
    stubImages()
    withData()
    renderApp('/fraktionen/eisenbund')
    const card = (await screen.findAllByRole('button', { name: /Dampfkoloss/ }))[0]!
    await vi.waitFor(() =>
      expect(card.querySelector('img')).toHaveAttribute(
        'src',
        '/art/units/thumbs/dampfkoloss.webp',
      ),
    )
  })
})
