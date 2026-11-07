import { act, render, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { RECONNECT_MS, ServerEvents, useServerEventsConnected } from './events'
import { lobbyKey, roomKey } from './lobby'
import { matchKey } from './match'

/** Minimal EventSource: the test plays the server */
class FakeEventSource {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSED = 2
  static instances: FakeEventSource[] = []
  readyState = FakeEventSource.CONNECTING
  onmessage: ((e: MessageEvent<string>) => void) | null = null
  onerror: (() => void) | null = null
  closed = false
  constructor(readonly url: string) {
    FakeEventSource.instances.push(this)
  }
  emit(topics: string[]) {
    this.readyState = FakeEventSource.OPEN
    act(() => this.onmessage?.({ data: JSON.stringify({ topics }) } as MessageEvent<string>))
  }
  fail(state: number) {
    this.readyState = state
    act(() => this.onerror?.())
  }
  close() {
    this.closed = true
    this.readyState = FakeEventSource.CLOSED
  }
}

const last = () => FakeEventSource.instances.at(-1)!

beforeEach(() => {
  FakeEventSource.instances = []
  vi.stubGlobal('EventSource', FakeEventSource)
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function setup() {
  const queryClient = new QueryClient()
  const spy = vi.spyOn(queryClient, 'invalidateQueries')
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const status = renderHook(() => useServerEventsConnected(), { wrapper })
  const view = render(<ServerEvents />, { wrapper })
  const keys = () => spy.mock.calls.map(([f]) => f?.queryKey)
  return { spy, keys, status, view }
}

describe('Server-Sent Events', () => {
  it('macht je Signal die passenden Abfragen ungültig', () => {
    const { keys, status } = setup()
    expect(last().url).toBe('/api/events')
    expect(status.result.current).toBe(false)

    last().emit(['ready'])
    expect(status.result.current).toBe(true)
    expect(keys()).toEqual([])

    last().emit(['match:m1', 'lobby'])
    last().emit(['room:w7'])
    expect(keys()).toEqual([matchKey('m1'), lobbyKey, roomKey('w7')])
  })

  it('fällt bei Trennung aufs Polling zurück und lädt nach dem Wiederverbinden alles neu', () => {
    const { keys, status } = setup()
    last().emit(['ready'])
    last().fail(FakeEventSource.CONNECTING)
    expect(status.result.current).toBe(false)

    last().emit(['ready'])
    expect(status.result.current).toBe(true)
    expect(keys()).toEqual([['lobby'], ['room'], ['match'], ['friends']])
  })

  it('verbindet sich neu, wenn der Browser aufgibt, und schließt beim Abmelden', () => {
    vi.useFakeTimers()
    const { view } = setup()
    const first = last()
    first.fail(FakeEventSource.CLOSED)
    expect(first.closed).toBe(true)
    expect(FakeEventSource.instances).toHaveLength(1)
    act(() => vi.advanceTimersByTime(RECONNECT_MS))
    expect(FakeEventSource.instances).toHaveLength(2)

    view.unmount()
    expect(last().closed).toBe(true)
  })
})
