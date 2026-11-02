import {
  type AmbienceId,
  type AudioId,
  type AudioManifest,
  barSecondsOf,
  type FieldLayer,
  MANIFEST_URL,
  type MusicId,
  type SfxId,
} from './ids'

export interface SoundVolumes {
  muted: boolean
  master: number
  effects: number
  music: number
  ambience: number
}

export type AmbienceMix = Partial<Record<AmbienceId, number>>

/**
 * What the app needs from the audio system. `WebAudioEngine` implements it on the Web Audio
 * API; tests use `FakeEngine`. Everything is safe to call before `unlock()`: music, layers and
 * ambience are remembered and started once the browser lets audio through, effects before
 * that are dropped.
 */
export interface AudioEngine {
  readonly unlocked: boolean
  /** The context is actually producing sound (browsers may keep it suspended until a gesture counts) */
  readonly running: boolean
  /** User gesture: create the context and load the manifest; called again, resumes a suspended context */
  unlock(): Promise<void>
  setVolumes(v: SoundVolumes): void
  preload(ids: readonly AudioId[]): void
  /** One-shot effect; picks a variant that differs from the previous one */
  playSfx(id: SfxId, opts?: { gain?: number }): void
  /** Music deck with crossfade; the same id keeps playing */
  playMusic(id: MusicId, opts?: { loop?: boolean; fadeMs?: number }): void
  stopMusic(fadeMs?: number): void
  /** Field layers: all loops start together, only `active` is audible */
  startLayers(active: FieldLayer): void
  /** Crossfade to another layer on the next bar line */
  setLayer(id: FieldLayer, opts?: { bars?: number }): void
  stopLayers(fadeMs?: number): void
  /** One-shot piece over ducked layers (faction theme, victory, defeat); resolves when it ends */
  playStinger(id: MusicId, opts?: { duckTo?: number; resumeLayers?: boolean }): Promise<void>
  /** Fade out a running piece (also called by playMusic/stopMusic: only one piece of music at a time) */
  stopStinger(fadeMs?: number): void
  /** Weights 0..1 per loop; loops not in the mix fade out */
  setAmbience(mix: AmbienceMix, fadeMs?: number): void
  stopAmbience(fadeMs?: number): void
  /** Tab hidden: everything fades to silence until resumed */
  setSuspended(suspended: boolean): void
  /** Logout: music, pieces, layers and ambience fade out; the context stays unlocked */
  stopAll(fadeMs?: number): void
  dispose(): void
}

/** Slider value 0..100 → gain; squared, so the slider feels linear */
export const volumeGain = (v: number) => {
  const x = Math.min(100, Math.max(0, v)) / 100
  return x * x
}

/** Pick a variant index, avoiding the previous one when there is a choice */
export function pickVariant(count: number, previous: number | null, random = Math.random) {
  if (count <= 1) return 0
  if (previous === null || previous >= count)
    return Math.min(Math.floor(random() * count), count - 1)
  let i = Math.floor(random() * (count - 1))
  if (i >= previous) i++
  return Math.min(i, count - 1)
}

/** Next bar line at or after `now` (plus a small lead so the ramp can be scheduled) */
export function nextBarTime(start: number, barSeconds: number, now: number, leadSeconds = 0.05) {
  const elapsed = Math.max(0, now + leadSeconds - start)
  return start + Math.ceil(elapsed / barSeconds) * barSeconds
}

const DEFAULT_FADE_MS = 1500
const MAX_SFX = 8
/** An effect whose file is still loading plays late if the file arrives within this time */
const SFX_LATE_MS = 1500

interface Deck {
  id: MusicId
  source: AudioBufferSourceNode
  gain: GainNode
}

interface Loop {
  source: AudioBufferSourceNode
  gain: GainNode
}

export interface WebAudioEngineOptions {
  manifestUrl?: string
  createContext?: () => AudioContext | null
  fetchFn?: typeof fetch
  log?: (msg: string, err?: unknown) => void
}

const defaultCreateContext = () => {
  const Ctor =
    typeof AudioContext !== 'undefined'
      ? AudioContext
      : (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  return Ctor ? new Ctor() : null
}

export class WebAudioEngine implements AudioEngine {
  unlocked = false
  private ctx: AudioContext | null = null
  private manifest: AudioManifest | null = null
  private manifestPromise: Promise<AudioManifest | null> | null = null
  private ready: Promise<void> | null = null
  private readonly buffers = new Map<string, Promise<AudioBuffer | null>>()
  private readonly failed = new Set<string>()
  // Buses: master → out; music, sfx, ambience → master; layers → layerBus → music
  private out!: GainNode
  private master!: GainNode
  private musicBus!: GainNode
  private sfxBus!: GainNode
  private ambienceBus!: GainNode
  private layerBus!: GainNode
  private volumes: SoundVolumes = { muted: false, master: 80, effects: 70, music: 40, ambience: 55 }
  private suspended = false
  // Music deck
  private deck: Deck | null = null
  private desiredMusic: { id: MusicId; loop: boolean; fadeMs: number } | null = null
  private musicToken = 0
  // One-shot piece (faction theme, victory, defeat) on the music bus
  private stinger: { loop: Loop; done: () => void } | null = null
  private stingerToken = 0
  // Asked for before the first gesture (e.g. a page reload inside a match): done after unlock
  private pendingPreload: AudioId[] = []
  private pendingStinger: {
    id: MusicId
    opts: { duckTo?: number; resumeLayers?: boolean }
  } | null = null
  // Field layers
  private layers = new Map<FieldLayer, Loop>()
  private layerStart: number | null = null
  private barSeconds = 2.728
  private activeLayer: FieldLayer | null = null
  private desiredLayer: FieldLayer | null = null
  private layersWanted = false
  private layersToken = 0
  // Ambience
  private ambience = new Map<AmbienceId, Loop>()
  private desiredAmbience: AmbienceMix = {}
  private ambienceWanted = false
  // Effects
  private lastVariant = new Map<SfxId, number>()
  private playing: AudioBufferSourceNode[] = []

  private readonly manifestUrl: string
  private readonly createContext: () => AudioContext | null
  private readonly fetchFn: typeof fetch
  private readonly log: (msg: string, err?: unknown) => void

  constructor(opts: WebAudioEngineOptions = {}) {
    this.manifestUrl = opts.manifestUrl ?? MANIFEST_URL
    this.createContext = opts.createContext ?? defaultCreateContext
    this.fetchFn = opts.fetchFn ?? ((...args) => fetch(...args))
    this.log = opts.log ?? ((msg, err) => console.warn(msg, err))
  }

  // ---------------------------------------------------------------------------
  // Setup
  // ---------------------------------------------------------------------------

  get running() {
    return this.ctx?.state === 'running'
  }

  async unlock() {
    if (this.ready) {
      // Blocked by the autoplay policy at the first gesture: try again on this one
      if (this.ctx && this.ctx.state !== 'running') this.resume(this.ctx)
      return this.ready
    }
    this.ready = this.setup()
    return this.ready
  }

  private resume(ctx: AudioContext) {
    // Not awaited: Chrome keeps the promise pending until a gesture counts
    ctx.resume().catch((err: unknown) => this.log('Audio konnte nicht gestartet werden', err))
  }

  private async setup() {
    const ctx = this.createContext()
    if (!ctx) return
    this.ctx = ctx
    this.out = ctx.createGain()
    this.master = ctx.createGain()
    this.musicBus = ctx.createGain()
    this.sfxBus = ctx.createGain()
    this.ambienceBus = ctx.createGain()
    this.layerBus = ctx.createGain()
    this.out.connect(ctx.destination)
    this.master.connect(this.out)
    this.musicBus.connect(this.master)
    this.sfxBus.connect(this.master)
    this.ambienceBus.connect(this.master)
    this.layerBus.connect(this.musicBus)
    this.applyVolumes(true)
    if (ctx.state !== 'running') this.resume(ctx)
    const manifest = await this.loadManifest()
    if (!manifest) return
    this.unlocked = true
    this.barSeconds = barSecondsOf(manifest)
    // Apply what the app asked for while locked
    if (this.desiredMusic) this.playMusic(this.desiredMusic.id, this.desiredMusic)
    if (this.layersWanted && this.desiredLayer) this.startLayers(this.desiredLayer)
    if (this.ambienceWanted) this.setAmbience(this.desiredAmbience)
    if (this.pendingPreload.length) {
      const ids = this.pendingPreload
      this.pendingPreload = []
      this.preload(ids)
    }
    if (this.pendingStinger) {
      const { id, opts } = this.pendingStinger
      this.pendingStinger = null
      void this.playStinger(id, opts)
    }
  }

  private loadManifest() {
    this.manifestPromise ??= this.fetchFn(this.manifestUrl)
      .then((r) => (r.ok ? (r.json() as Promise<AudioManifest>) : null))
      .then((m) => (this.manifest = m))
      .catch((err: unknown) => {
        this.log('Audio-Manifest konnte nicht geladen werden', err)
        return null
      })
    return this.manifestPromise
  }

  private pathsOf(id: AudioId): string[] {
    const m = this.manifest
    if (!m) return []
    if (id in m.sfx) return m.sfx[id as SfxId]
    if (id in m.music) return [m.music[id as MusicId]]
    if (id in m.ambience) return [m.ambience[id as AmbienceId]]
    return []
  }

  private load(path: string): Promise<AudioBuffer | null> {
    const ctx = this.ctx
    if (!ctx || this.failed.has(path)) return Promise.resolve(null)
    let p = this.buffers.get(path)
    if (!p) {
      p = this.fetchFn(path)
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`)
          return r.arrayBuffer()
        })
        .then((data) => ctx.decodeAudioData(data))
        .catch((err: unknown) => {
          this.failed.add(path)
          this.log(`Audiodatei ${path} konnte nicht geladen werden`, err)
          return null
        })
      this.buffers.set(path, p)
    }
    return p
  }

  preload(ids: readonly AudioId[]) {
    if (!this.unlocked) {
      this.pendingPreload.push(...ids)
      return
    }
    for (const id of ids) for (const path of this.pathsOf(id)) void this.load(path)
  }

  // ---------------------------------------------------------------------------
  // Volumes
  // ---------------------------------------------------------------------------

  setVolumes(v: SoundVolumes) {
    this.volumes = v
    if (this.ctx) this.applyVolumes()
  }

  setSuspended(suspended: boolean) {
    this.suspended = suspended
    if (this.ctx) this.applyVolumes()
  }

  private applyVolumes(immediate = false) {
    const v = this.volumes
    const set = (node: GainNode, value: number) => this.ramp(node, value, immediate ? 0 : 0.05)
    set(this.out, this.suspended ? 0 : 1)
    set(this.master, v.muted ? 0 : volumeGain(v.master))
    set(this.musicBus, volumeGain(v.music))
    set(this.sfxBus, volumeGain(v.effects))
    set(this.ambienceBus, volumeGain(v.ambience))
  }

  /** Smooth change of a gain (time constant in seconds; 0 sets at once) */
  private ramp(node: GainNode, value: number, seconds: number) {
    const now = this.ctx!.currentTime
    node.gain.cancelScheduledValues(now)
    if (seconds <= 0) node.gain.setValueAtTime(value, now)
    else node.gain.setTargetAtTime(value, now, seconds)
  }

  /** Linear fade starting at `at` (default now) */
  private fade(node: GainNode, to: number, seconds: number, at?: number) {
    const ctx = this.ctx!
    const start = at ?? ctx.currentTime
    node.gain.cancelScheduledValues(start)
    node.gain.setValueAtTime(node.gain.value, start)
    node.gain.linearRampToValueAtTime(to, start + Math.max(0.01, seconds))
  }

  private newLoop(buffer: AudioBuffer, into: GainNode, gain: number): Loop {
    const ctx = this.ctx!
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true
    const g = ctx.createGain()
    g.gain.value = gain
    source.connect(g)
    g.connect(into)
    return { source, gain: g }
  }

  private stopLoop(loop: Loop, fadeSeconds: number) {
    const ctx = this.ctx!
    this.fade(loop.gain, 0, fadeSeconds)
    const stopAt = ctx.currentTime + fadeSeconds + 0.05
    try {
      loop.source.stop(stopAt)
    } catch {
      // never started
    }
  }

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  playSfx(id: SfxId, opts: { gain?: number } = {}) {
    const ctx = this.ctx
    if (!ctx || !this.unlocked) return
    const paths = this.pathsOf(id)
    if (paths.length === 0) return
    const variant = pickVariant(paths.length, this.lastVariant.get(id) ?? null)
    this.lastVariant.set(id, variant)
    const path = paths[variant]!
    const cached = this.buffers.get(path)
    // Not loaded yet: load it and still play it, unless that takes noticeably long
    const requested = Date.now()
    void (cached ?? this.load(path)).then((buffer) => {
      if (!buffer || !this.ctx) return
      if (!cached && Date.now() - requested > SFX_LATE_MS) return
      const source = ctx.createBufferSource()
      source.buffer = buffer
      const g = ctx.createGain()
      g.gain.value = opts.gain ?? 1
      source.connect(g)
      g.connect(this.sfxBus)
      if (this.playing.length >= MAX_SFX) {
        const oldest = this.playing.shift()
        try {
          oldest?.stop()
        } catch {
          // already ended
        }
      }
      this.playing.push(source)
      source.onended = () => {
        this.playing = this.playing.filter((s) => s !== source)
      }
      source.start()
    })
  }

  // ---------------------------------------------------------------------------
  // Music decks
  // ---------------------------------------------------------------------------

  playMusic(id: MusicId, opts: { loop?: boolean; fadeMs?: number } = {}) {
    const loop = opts.loop ?? true
    const fadeMs = opts.fadeMs ?? DEFAULT_FADE_MS
    this.desiredMusic = { id, loop, fadeMs }
    if (!this.ctx || !this.unlocked) return
    if (this.deck?.id === id) return
    const token = ++this.musicToken
    const path = this.pathsOf(id)[0]
    if (!path) return
    // Pieces requested up to now give way to the deck; a later request wins over it
    const stingersBefore = this.stingerToken
    void this.load(path).then((buffer) => {
      if (!buffer || token !== this.musicToken || !this.ctx) return
      const seconds = fadeMs / 1000
      if (this.stingerToken === stingersBefore) this.stopStinger(fadeMs)
      if (this.deck) this.stopLoop(this.deck, seconds)
      const next = this.newLoop(buffer, this.musicBus, 0)
      next.source.loop = loop
      next.source.start()
      this.fade(next.gain, 1, seconds)
      this.deck = { id, ...next }
      if (!loop) next.source.onended = () => this.deck?.id === id && (this.deck = null)
    })
  }

  stopMusic(fadeMs = DEFAULT_FADE_MS) {
    this.desiredMusic = null
    this.musicToken++
    this.stopStinger(fadeMs)
    if (!this.ctx || !this.deck) return
    this.stopLoop(this.deck, fadeMs / 1000)
    this.deck = null
  }

  // ---------------------------------------------------------------------------
  // Field layers
  // ---------------------------------------------------------------------------

  startLayers(active: FieldLayer) {
    this.layersWanted = true
    this.desiredLayer = active
    if (!this.ctx || !this.unlocked || !this.manifest) return
    if (this.layerStart !== null) {
      this.setLayer(active)
      return
    }
    const token = ++this.layersToken
    const ids = ['field-explore', 'field-tension', 'field-combat'] as const
    void Promise.all(ids.map((id) => this.load(this.pathsOf(id)[0]!))).then((buffers) => {
      if (token !== this.layersToken || !this.layersWanted || !this.ctx) return
      if (buffers.some((b) => !b)) return
      const start = this.ctx.currentTime + 0.1
      const current = this.desiredLayer ?? active
      ids.forEach((id, i) => {
        const loop = this.newLoop(buffers[i]!, this.layerBus, id === current ? 1 : 0)
        loop.source.start(start)
        this.layers.set(id, loop)
      })
      this.layerStart = start
      this.activeLayer = current
      this.fade(this.layerBus, 1, 0.5)
    })
  }

  setLayer(id: FieldLayer, opts: { bars?: number } = {}) {
    this.desiredLayer = id
    if (!this.ctx || this.layerStart === null || this.activeLayer === id) return
    const bars = opts.bars ?? this.manifest?.playback.adaptive_field.crossfade_bars ?? 2
    const at = nextBarTime(this.layerStart, this.barSeconds, this.ctx.currentTime)
    const seconds = bars * this.barSeconds
    const from = this.layers.get(this.activeLayer!)
    const to = this.layers.get(id)
    if (from) this.fade(from.gain, 0, seconds, at)
    if (to) this.fade(to.gain, 1, seconds, at)
    this.activeLayer = id
  }

  stopLayers(fadeMs = DEFAULT_FADE_MS) {
    this.layersWanted = false
    this.layersToken++
    if (!this.ctx) return
    for (const loop of this.layers.values()) this.stopLoop(loop, fadeMs / 1000)
    this.layers.clear()
    this.layerStart = null
    this.activeLayer = null
  }

  async playStinger(id: MusicId, opts: { duckTo?: number; resumeLayers?: boolean } = {}) {
    if (!this.ctx || !this.unlocked) {
      // Plays once the first gesture unlocks the context (a reload inside a match)
      this.pendingStinger = { id, opts }
      return
    }
    const path = this.pathsOf(id)[0]
    if (!path) return
    const token = ++this.stingerToken
    const buffer = await this.load(path)
    // Stopped or replaced while loading
    if (!buffer || !this.ctx || token !== this.stingerToken) return
    const ctx = this.ctx
    // A piece that is still running gives way at once
    this.fadeOutStinger(0)
    const duckTo = opts.duckTo ?? 0.2
    this.fade(this.layerBus, duckTo, 0.4)
    const loop = this.newLoop(buffer, this.musicBus, 1)
    loop.source.loop = false
    let stopped = false
    await new Promise<void>((resolve) => {
      const done = () => {
        if (this.stinger?.loop === loop) this.stinger = null
        resolve()
      }
      this.stinger = {
        loop,
        done: () => {
          stopped = true
          done()
        },
      }
      loop.source.onended = done
      loop.source.start()
      // Safety net in case `ended` never fires
      setTimeout(done, buffer.duration * 1000 + 500)
    })
    // Faded out by stopStinger: whoever stopped it owns the layers now
    if (!this.ctx || stopped) return
    if (opts.resumeLayers === false) this.stopLayers(800)
    else if (this.layerStart !== null) this.fade(this.layerBus, 1, 1.0, ctx.currentTime)
  }

  stopStinger(fadeMs = DEFAULT_FADE_MS) {
    // Also drops a piece that is still loading or waiting for the unlock
    this.pendingStinger = null
    this.stingerToken++
    this.fadeOutStinger(fadeMs)
  }

  private fadeOutStinger(fadeMs: number) {
    const current = this.stinger
    if (!current || !this.ctx) return
    this.stinger = null
    this.stopLoop(current.loop, fadeMs / 1000)
    // Layers that are still running come back up from the duck
    if (this.layerStart !== null) this.fade(this.layerBus, 1, Math.max(0.01, fadeMs / 1000))
    current.done()
  }

  // ---------------------------------------------------------------------------
  // Ambience
  // ---------------------------------------------------------------------------

  setAmbience(mix: AmbienceMix, fadeMs = 800) {
    this.ambienceWanted = true
    this.desiredAmbience = mix
    if (!this.ctx || !this.unlocked) return
    const seconds = fadeMs / 1000
    for (const [key, weight] of Object.entries(mix) as [AmbienceId, number][]) {
      if (!weight || weight <= 0) continue
      const loop = this.ambience.get(key)
      if (loop) {
        this.fade(loop.gain, weight, seconds)
        continue
      }
      const path = this.pathsOf(key)[0]
      if (!path) continue
      void this.load(path).then((buffer) => {
        if (!buffer || !this.ctx || !this.ambienceWanted || this.ambience.has(key)) return
        const target = this.desiredAmbience[key] ?? 0
        if (target <= 0) return
        const l = this.newLoop(buffer, this.ambienceBus, 0)
        l.source.start()
        this.fade(l.gain, target, seconds)
        this.ambience.set(key, l)
      })
    }
    for (const [key, loop] of this.ambience) {
      if (!(mix[key] && mix[key] > 0)) this.fade(loop.gain, 0, seconds)
    }
  }

  stopAmbience(fadeMs = 800) {
    this.ambienceWanted = false
    this.desiredAmbience = {}
    if (!this.ctx) return
    for (const loop of this.ambience.values()) this.stopLoop(loop, fadeMs / 1000)
    this.ambience.clear()
  }

  stopAll(fadeMs = DEFAULT_FADE_MS) {
    this.stopMusic(fadeMs)
    this.stopLayers(fadeMs)
    this.stopAmbience(fadeMs)
  }

  dispose() {
    this.stopAll(0)
    void this.ctx?.close().catch(() => undefined)
    this.ctx = null
    this.unlocked = false
    this.ready = null
  }
}
