import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { demoView, mockApi } from '../test/mockApi'
import { matchKey, useMatchCommand } from './match'

afterEach(() => vi.unstubAllGlobals())

function setup(holdViewMs: number) {
  const queryClient = new QueryClient()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const onCombat = vi.fn()
  const hook = renderHook(
    () => useMatchCommand('demo', { onCombat, holdViewMs: () => holdViewMs }),
    {
      wrapper,
    },
  )
  return { queryClient, onCombat, ...hook }
}

describe('Befehle mit Kampf', () => {
  it('hält die neue Sicht für die Kampfsequenz zurück', async () => {
    const after = demoView()
    const combat = {
      attackerUnitId: 'u1',
      defenderUnitId: 'e2',
      targetCityId: null,
      hits: ['attacker'],
      attackerDamage: 0,
      defenderDamage: 1,
      attackerDestroyed: false,
      defenderDestroyed: true,
      advanced: true,
      captured: false,
      garrisonUnitId: null,
      message: 'Sieg',
    }
    mockApi({ 'POST /matches/demo/commands': () => ({ json: { view: after, combat } }) })
    const { result, queryClient, onCombat } = setup(60)
    act(() => result.current.mutate({ type: 'attack', unitId: 'u1', target: { unitId: 'e2' } }))
    await waitFor(() => expect(onCombat).toHaveBeenCalledWith(combat))
    expect(queryClient.getQueryData(matchKey('demo'))).toBeUndefined()
    await waitFor(() => expect(queryClient.getQueryData(matchKey('demo'))).toEqual(after))
  })

  it('übernimmt die Sicht sofort, wenn keine Sequenz läuft', async () => {
    const after = demoView()
    const combat = {
      attackerUnitId: 'u1',
      defenderUnitId: 'e2',
      targetCityId: null,
      hits: ['defender', 'defender'],
      attackerDamage: 2,
      defenderDamage: 0,
      attackerDestroyed: true,
      defenderDestroyed: false,
      advanced: false,
      captured: false,
      garrisonUnitId: null,
      message: 'Niederlage',
    }
    mockApi({ 'POST /matches/demo/commands': () => ({ json: { view: after, combat } }) })
    const { result, queryClient } = setup(0)
    act(() => result.current.mutate({ type: 'attack', unitId: 'u1', target: { unitId: 'e2' } }))
    await waitFor(() => expect(queryClient.getQueryData(matchKey('demo'))).toEqual(after))
  })
})
