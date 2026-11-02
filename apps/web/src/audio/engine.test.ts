import { nextBarTime, pickVariant, volumeGain, WebAudioEngine } from './engine'
import type { AudioManifest } from './ids'

// ---------------------------------------------------------------------------
// Minimal AudioContext stub: records gain automation and started sources
// ---------------------------------------------------------------------------

interface Automation {
  kind: 'set' | 'ramp' | 'target' | 'cancel'
  value?: number
  time: number
}

class FakeParam {
  value = 1
  readonly log: Automation[] = []
  setValueAtTime(value: number, time: number) {
    this.value = value
    this.log.push({ kind: 'set', value, time })
  }
  linearRampToValueAtTime(value: number, time: number) {
    this.value = value
    this.log.push({ kind: 'ramp', value, time })
  }
  setTargetAtTime(value: number, time: number) {
    this.value = value
    this.log.push({ kind: 'target', value, time })
  }
  cancelScheduledValues(time: number) {
    this.log.push({ kind: 'cancel', time })
  }
}

class FakeNode {
  readonly gain = new FakeParam()
  readonly connections: FakeNode[] = []
  connect(n: FakeNode) {
    this.connections.push(n)
  }
}

class FakeSource extends FakeNode {
  buffer: unknown = null
  loop = false
  started: number | null = null
  stopped: number | null = null
  onended: (() => void) | null = null
  start(at = 0) {
    this.started = at
  }
  stop(at = 0) {
    this.stopped = at
  }
}

class FakeContext {
  currentTime = 0
  state = 'suspended'
  readonly destination = new FakeNode()
  readonly sources: FakeSource[] = []
  createGain() {
    return new FakeNode()
  }
  createBufferSource() {
    const s = new FakeSource()
    this.sources.push(s)
    return s
  }
  decodeAudioData(data: ArrayBuffer) {
    return Promise.resolve({ duration: data.byteLength / 1000 })
  }
  resume() {
    this.state = 'running'
    return Promise.resolve()
  }
  close() {
    return Promise.resolve()
  }
}

const manifest: AudioManifest = {
  music: {
    'menu-lobby': '/audio/music/menu-lobby.ogg',
    'menu-setup': '/audio/music/menu-setup.ogg',
    'field-explore': '/audio/music/field-explore.ogg',
    'field-tension': '/audio/music/field-tension.ogg',
    'field-combat': '/audio/music/field-combat.ogg',
    'eisenbund-victory': '/audio/music/eisenbund-victory.ogg',
  } as AudioManifest['music'],
  ambience: { 'amb-sea': '/audio/ambience/amb-sea.ogg' } as AudioManifest['ambience'],
  sfx: {
    'ui-click': ['/a1.ogg', '/a2.ogg', '/a3.ogg'],
    'ui-error': ['/e.ogg'],
  } as AudioManifest['sfx'],
  // 28 bars of exactly 2 s
  playback: { adaptive_field: { frames: 56 * 48000, sample_rate_hz: 48000, crossfade_bars: 2 } },
}

function setup() {
  const ctx = new FakeContext()
  const fetchFn = vi.fn(async (url: string) =>
    url.endsWith('manifest.json')
      ? new Response(JSON.stringify(manifest), { status: 200 })
      : new Response(new ArrayBuffer(3000), { status: 200 }),
  ) as unknown as typeof fetch
  const engine = new WebAudioEngine({
    createContext: () => ctx as unknown as AudioContext,
    fetchFn,
    log: () => undefined,
  })
  return { ctx, engine, fetchFn }
}

const flush = () => new Promise((r) => setTimeout(r, 0))
/** The gain node a source plays through */
const gainOf = (s: FakeSource) => (s.connections[0] as FakeNode).gain

describe('Audio-Hilfsfunktionen', () => {
  it('wählt nie zweimal dieselbe Variante hintereinander', () => {
    for (let i = 0; i < 20; i++) expect(pickVariant(3, 1)).not.toBe(1)
    expect(pickVariant(1, 0)).toBe(0)
    expect(pickVariant(2, null, () => 0.99)).toBe(1)
  })

  it('findet die nächste Taktgrenze', () => {
    expect(nextBarTime(10, 2, 10)).toBe(12)
    expect(nextBarTime(10, 2, 13.5)).toBe(14)
    expect(nextBarTime(10, 2, 13.99)).toBe(16)
  })

  it('macht aus dem Reglerwert eine quadratische Verstärkung', () => {
    expect(volumeGain(0)).toBe(0)
    expect(volumeGain(50)).toBeCloseTo(0.25)
    expect(volumeGain(100)).toBe(1)
  })
})

describe('WebAudioEngine', () => {
  it('ist ohne AudioContext ein No-op', async () => {
    const engine = new WebAudioEngine({ createContext: () => null, log: () => undefined })
    await engine.unlock()
    expect(engine.unlocked).toBe(false)
    engine.playSfx('ui-click')
    engine.playMusic('menu-lobby')
    engine.setVolumes({ muted: false, master: 80, effects: 70, music: 40, ambience: 55 })
  })

  it('versucht resume erneut, wenn der Browser den Kontext erst später freigibt', async () => {
    const { ctx, engine } = setup()
    let allowed = false
    ctx.resume = () => {
      if (allowed) ctx.state = 'running'
      return Promise.resolve()
    }
    engine.playMusic('menu-lobby')
    await engine.unlock()
    expect(engine.unlocked).toBe(true)
    expect(engine.running).toBe(false)
    await flush()
    await flush()
    // Source already scheduled: it starts as soon as the context runs
    expect(ctx.sources).toHaveLength(1)
    allowed = true
    await engine.unlock()
    expect(engine.running).toBe(true)
    expect(ctx.sources).toHaveLength(1)
  })

  it('verdrahtet die Busse und wendet die Lautstärken an', async () => {
    const { ctx, engine } = setup()
    engine.setVolumes({ muted: false, master: 100, effects: 50, music: 100, ambience: 0 })
    await engine.unlock()
    expect(engine.unlocked).toBe(true)
    expect(ctx.state).toBe('running')
    // master → out → destination
    const out = ctx.destination
    expect(out).toBeDefined()
    engine.setVolumes({ muted: true, master: 100, effects: 50, music: 100, ambience: 0 })
    // muted pulls the master bus to 0 (last target value)
    const master = (engine as unknown as { master: FakeNode }).master
    expect(master.gain.log.at(-1)).toMatchObject({ kind: 'target', value: 0 })
    const sfxBus = (engine as unknown as { sfxBus: FakeNode }).sfxBus
    expect(sfxBus.gain.value).toBeCloseTo(0.25)
  })

  it('spielt geladene Effekte und wechselt die Variante', async () => {
    const { ctx, engine } = setup()
    await engine.unlock()
    engine.preload(['ui-click'])
    await flush()
    await flush()
    engine.playSfx('ui-click')
    engine.playSfx('ui-click')
    await flush()
    expect(ctx.sources).toHaveLength(2)
    const [a, b] = ctx.sources
    expect(a!.started).not.toBeNull()
    expect(a!.buffer).not.toBe(b!.buffer)
  })

  it('merkt sich Vorladen und Einzelstück bis zur ersten Geste', async () => {
    const { ctx, engine, fetchFn } = setup()
    engine.preload(['ui-error'])
    void engine.playStinger('eisenbund-victory')
    expect(fetchFn).not.toHaveBeenCalled()
    await engine.unlock()
    await flush()
    await flush()
    const urls = (fetchFn as unknown as { mock: { calls: [string][] } }).mock.calls.map((c) => c[0])
    expect(urls).toContain('/e.ogg')
    expect(urls).toContain('/audio/music/eisenbund-victory.ogg')
    expect(ctx.sources.some((s) => !s.loop)).toBe(true)
  })

  it('holt einen Effekt nach, dessen Datei kurz nach dem Aufruf eintrifft', async () => {
    const { ctx, engine } = setup()
    await engine.unlock()
    engine.playSfx('ui-error')
    await flush()
    await flush()
    expect(ctx.sources).toHaveLength(1)
    engine.playSfx('ui-error')
    await flush()
    expect(ctx.sources).toHaveLength(2)
  })

  it('blendet Musik-Decks über und merkt sich Wünsche vor dem Entsperren', async () => {
    const { ctx, engine } = setup()
    engine.playMusic('menu-lobby')
    expect(ctx.sources).toHaveLength(0)
    await engine.unlock()
    await flush()
    await flush()
    expect(ctx.sources).toHaveLength(1)
    expect(ctx.sources[0]!.loop).toBe(true)
    expect(gainOf(ctx.sources[0]!).log.at(-1)).toMatchObject({ kind: 'ramp', value: 1 })
    // Same id: nothing happens
    engine.playMusic('menu-lobby')
    await flush()
    expect(ctx.sources).toHaveLength(1)
    engine.playMusic('menu-setup', { fadeMs: 1000 })
    await flush()
    await flush()
    expect(ctx.sources).toHaveLength(2)
    expect(gainOf(ctx.sources[0]!).log.at(-1)).toMatchObject({ kind: 'ramp', value: 0, time: 1 })
    expect(ctx.sources[0]!.stopped).toBeGreaterThan(1)
  })

  it('blendet ein laufendes Einzelstück aus, wenn Musik startet', async () => {
    const { ctx, engine } = setup()
    await engine.unlock()
    let ended = false
    const piece = engine.playStinger('eisenbund-victory').then(() => (ended = true))
    await flush()
    await flush()
    expect(ctx.sources).toHaveLength(1)
    expect(ctx.sources[0]!.loop).toBe(false)
    engine.playMusic('menu-lobby', { fadeMs: 1000 })
    await flush()
    await flush()
    expect(ctx.sources).toHaveLength(2)
    expect(gainOf(ctx.sources[0]!).log.at(-1)).toMatchObject({ kind: 'ramp', value: 0, time: 1 })
    expect(ctx.sources[0]!.stopped).toBeGreaterThan(1)
    await piece
    expect(ended).toBe(true)
    // The deck plays alone; stopping it again is a no-op for the piece
    engine.stopMusic()
    expect(ctx.sources[1]!.stopped).not.toBeNull()
  })

  it('blendet das Einzelstück auch aus, wenn die Musik schon vor seinem Start angefordert wurde', async () => {
    const { ctx, engine } = setup()
    await engine.unlock()
    void engine.playStinger('eisenbund-victory')
    engine.playMusic('menu-lobby')
    await flush()
    await flush()
    await flush()
    expect(ctx.sources).toHaveLength(2)
    const piece = ctx.sources.find((s) => !s.loop)!
    expect(piece.stopped).not.toBeNull()
  })

  it('verwirft ein Einzelstück, das beim Stoppen noch lädt', async () => {
    const { ctx, engine } = setup()
    await engine.unlock()
    const piece = engine.playStinger('eisenbund-victory')
    engine.stopStinger()
    await piece
    await flush()
    expect(ctx.sources).toHaveLength(0)
  })

  it('räumt beim Abbau Deck, Einzelstück und Schichten ab', async () => {
    const { ctx, engine } = setup()
    const close = vi.spyOn(ctx, 'close')
    await engine.unlock()
    engine.playMusic('menu-lobby')
    void engine.playStinger('eisenbund-victory')
    engine.startLayers('field-explore')
    await flush()
    await flush()
    expect(ctx.sources.length).toBeGreaterThanOrEqual(5)
    engine.dispose()
    expect(ctx.sources.every((s) => s.stopped !== null)).toBe(true)
    expect(close).toHaveBeenCalled()
    expect(engine.unlocked).toBe(false)
  })

  it('startet die Schichten gemeinsam und blendet auf der Taktgrenze um', async () => {
    const { ctx, engine } = setup()
    await engine.unlock()
    engine.startLayers('field-explore')
    await flush()
    await flush()
    expect(ctx.sources).toHaveLength(3)
    const [explore, tension, combat] = ctx.sources
    expect(explore!.started).toBe(tension!.started)
    expect(gainOf(explore!).value).toBe(1)
    expect(gainOf(tension!).value).toBe(0)
    expect(gainOf(combat!).value).toBe(0)
    // 2 s per bar; 3.5 s after the start the next bar line is at +4 s, the fade takes 2 bars
    const start = explore!.started!
    ctx.currentTime = start + 3.5
    engine.setLayer('field-tension')
    expect(gainOf(tension!).log.at(-1)).toMatchObject({ kind: 'ramp', value: 1, time: start + 8 })
    expect(gainOf(tension!).log.at(-2)).toMatchObject({ kind: 'set', time: start + 4 })
    expect(gainOf(explore!).log.at(-1)).toMatchObject({ kind: 'ramp', value: 0, time: start + 8 })
    engine.stopLayers(0)
    expect(explore!.stopped).not.toBeNull()
  })

  it('mischt Ambiente-Schleifen nach Gewicht und blendet fehlende aus', async () => {
    const { ctx, engine } = setup()
    await engine.unlock()
    engine.setAmbience({ 'amb-sea': 0.6 })
    await flush()
    await flush()
    expect(ctx.sources).toHaveLength(1)
    expect(ctx.sources[0]!.loop).toBe(true)
    expect(gainOf(ctx.sources[0]!).log.at(-1)).toMatchObject({ kind: 'ramp', value: 0.6 })
    engine.setAmbience({})
    expect(gainOf(ctx.sources[0]!).log.at(-1)).toMatchObject({ kind: 'ramp', value: 0 })
  })

  it('schaltet im Hintergrund stumm', async () => {
    const { engine } = setup()
    await engine.unlock()
    engine.setSuspended(true)
    const out = (engine as unknown as { out: FakeNode }).out
    expect(out.gain.log.at(-1)).toMatchObject({ kind: 'target', value: 0 })
    engine.setSuspended(false)
    expect(out.gain.log.at(-1)).toMatchObject({ kind: 'target', value: 1 })
  })
})
