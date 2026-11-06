import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import sample from '../../../../../product-plan/sections/spielfeld-and-zuge/sample-data.json'
import type { TutorialView } from '@dos/shared/game'
import { Spielfeld } from './components'
import { packMap } from './components/hex'
import type { CombatResult, SpielfeldUndZuegeProps, Tile } from './types'

const data = {
  ...sample,
  map: packMap(sample.map as { width: number; height: number; seed: string; tiles: Tile[] }),
} as unknown as SpielfeldUndZuegeProps & { lastCombat: CombatResult }

const textStep: TutorialView = {
  step: 0,
  total: 12,
  current: {
    id: 'welcome',
    title: 'Willkommen, Kommandant',
    text: 'Das Ziel …',
    focus: null,
    manual: true,
  },
}
const actionStep: TutorialView = {
  step: 5,
  total: 12,
  current: {
    id: 'endTurn',
    title: 'Zug beenden',
    text: 'Beende deinen Zug.',
    focus: { hex: { col: 3, row: 4 }, ui: 'endTurn' },
    manual: false,
  },
}

function renderBoard(tutorial: TutorialView | null) {
  const callbacks = { onTutorialNext: vi.fn(), onTutorialSkip: vi.fn(), onLeave: vi.fn() }
  const props = { ...data, lastCombat: null, showTurnReport: false, tutorial, ...callbacks }
  const result = render(
    <div style={{ width: 1280, height: 744 }}>
      <Spielfeld {...props} />
    </div>,
  )
  return { ...callbacks, ...result, props }
}

describe('Tutorial im Spielfeld', () => {
  it('zeigt einen Textschritt mit „Weiter“ und beendet auf Wunsch', async () => {
    const { onTutorialNext, onLeave } = renderBoard(textStep)
    const panel = screen.getByRole('region', { name: 'Tutorial' })
    expect(panel).toHaveTextContent('Schritt 1/12')
    expect(panel).toHaveTextContent('Willkommen, Kommandant')
    expect(within(panel).queryByRole('button', { name: /Überspringen/ })).toBeNull()
    await userEvent.click(within(panel).getByRole('button', { name: 'Weiter' }))
    expect(onTutorialNext).toHaveBeenCalledOnce()
    await userEvent.click(within(panel).getByRole('button', { name: /Beenden/ }))
    expect(onLeave).toHaveBeenCalledOnce()
    expect(screen.queryByTestId('tutorial-highlight')).toBeNull()
  })

  it('markiert bei Aktionsschritten Feld und Bedienelement und lässt überspringen', async () => {
    const { onTutorialSkip, onTutorialNext } = renderBoard(actionStep)
    const panel = screen.getByRole('region', { name: 'Tutorial' })
    expect(within(panel).queryByRole('button', { name: 'Weiter' })).toBeNull()
    expect(screen.getByTestId('tutorial-highlight')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Zug beenden/ })).toHaveAttribute(
      'data-tutorial-focus',
    )
    await userEvent.click(within(panel).getByRole('button', { name: /Überspringen/ }))
    expect(onTutorialSkip).toHaveBeenCalledOnce()
    expect(onTutorialNext).not.toHaveBeenCalled()
  })

  it('meldet „Geschafft!“, wenn ein Schritt erfüllt ist, und lässt sich einklappen', async () => {
    const { rerender, props } = renderBoard(actionStep)
    rerender(
      <div style={{ width: 1280, height: 744 }}>
        <Spielfeld
          {...props}
          tutorial={{
            ...actionStep,
            step: 6,
            current: { ...textStep.current!, id: 'report', title: 'Neue Runde' },
          }}
        />
      </div>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Geschafft!')
    await userEvent.click(screen.getByRole('button', { name: 'Tutorial einklappen' }))
    expect(screen.queryByRole('button', { name: 'Weiter' })).toBeNull()
  })

  it('zeigt außerhalb des Tutorials nichts', () => {
    renderBoard(null)
    expect(screen.queryByRole('region', { name: 'Tutorial' })).toBeNull()
  })
})
