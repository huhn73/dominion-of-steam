import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FACTIONS, UNIT_TYPES } from '@dos/shared/game'
import type { City, Participant, Unit } from '../types'
import { CityPanel } from './CityPanel'

const owner: Participant = {
  id: 'p1',
  name: 'Björn',
  factionId: 'eisenbund',
  color: 'amber',
  isYou: true,
  isAI: false,
  status: 'active',
} as Participant
const eisenbund = FACTIONS.find((f) => f.id === 'eisenbund')!
const buildable = UNIT_TYPES.filter((t) => t.domain === 'land' && !t.factionId)
const cityOf = (damage: number): City => ({
  id: 'c1',
  name: 'Eisenhafen',
  col: 3,
  row: 4,
  ownerId: 'p1',
  isCapital: true,
  production: { unitTypeId: 'grenadiere', progress: 1, turnsRemaining: 2 + damage },
  damage,
})

describe('CityPanel', () => {
  it('zeigt ohne Schaden nur den Fraktionsbonus auf die Bauzeit', () => {
    render(<CityPanel city={cityOf(0)} owner={owner} isYours buildable={buildable} faction={eisenbund} />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    // Schwerindustrie wirkt erst ab fünf Runden Bauzeit: Grenadiere 4, Panzerwagen 7 durchgestrichen, 6
    expect(screen.getByRole('button', { name: /Grenadiere/ })).toHaveTextContent('4Runden')
    expect(screen.getByRole('button', { name: /Panzerwagen/ })).toHaveTextContent('76Runden')
  })

  it('zeigt Schaden und verlängerte Bauzeiten', () => {
    render(<CityPanel city={cityOf(2)} owner={owner} isYours buildable={buildable} faction={eisenbund} />)
    expect(screen.getByRole('status')).toHaveTextContent('Beschädigt 2/3 · Bauzeiten +2 Runden')
    expect(screen.getByRole('button', { name: /Grenadiere/ })).toHaveTextContent('6Runden')
    expect(screen.getByText(/noch 4 Runden/)).toBeInTheDocument()
  })

  it('listet die Garnison und meldet die angetippte Einheit', async () => {
    const onSelectUnit = vi.fn()
    const unit: Unit = {
      id: 'g1',
      unitTypeId: 'grenadiere',
      ownerId: 'p1',
      col: 3,
      row: 4,
      hp: 1,
      movesLeft: 1,
      fuel: null,
      order: { type: 'sentry' },
      cargoUnitIds: [],
      carriedBy: null,
      needsOrders: false,
    }
    render(
      <CityPanel
        city={cityOf(0)}
        owner={owner}
        isYours
        buildable={buildable}
        faction={eisenbund}
        garrison={[{ unit, type: UNIT_TYPES.find((t) => t.id === 'grenadiere') }]}
        onSelectUnit={onSelectUnit}
      />,
    )
    const list = screen.getByRole('list', { name: 'Garnison' })
    const row = within(list).getByRole('button', { name: /Grenadiere/ })
    expect(row).toHaveTextContent('Wache')
    expect(row).toHaveTextContent('1/1')
    await userEvent.click(row)
    expect(onSelectUnit).toHaveBeenCalledWith('g1')
  })

  it('zeigt Bestand und Bauaufträge je Typ mit gekürzter Städteliste', () => {
    const overview = {
      byType: new Map([['grenadiere', { owned: 4, building: ['hier', 'Kesselstadt', 'Rußbrück', 'Ventil'] }]]),
      owned: 7,
      building: 4,
    }
    render(<CityPanel city={cityOf(0)} owner={owner} isYours buildable={buildable} faction={eisenbund} overview={overview} />)
    expect(screen.getByText(/Reichsweit 7 Einheiten · 4 im Bau/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Grenadiere/ })).toHaveTextContent('Bestand 4 · 4 im Bau (hier, Kesselstadt, +2)')
    expect(screen.getByRole('button', { name: /Panzerwagen/ })).toHaveTextContent('Bestand 0 · 0 im Bau')
  })
})
