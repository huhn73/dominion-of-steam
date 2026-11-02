import type { AmbienceMix, AudioEngine, SoundVolumes } from './engine'
import type { AudioId, FieldLayer, MusicId, SfxId } from './ids'

export interface EngineCall {
  method: keyof AudioEngine
  args: unknown[]
}

/** Records every call for tests; `unlock()` succeeds at once */
export class FakeEngine implements AudioEngine {
  unlocked = false
  running = false
  readonly calls: EngineCall[] = []
  private note(method: keyof AudioEngine, ...args: unknown[]) {
    this.calls.push({ method, args })
  }
  /** Effect ids in the order they were played */
  get sfx(): SfxId[] {
    return this.calls.filter((c) => c.method === 'playSfx').map((c) => c.args[0] as SfxId)
  }
  /** Last `setVolumes` argument */
  get volumes(): SoundVolumes | undefined {
    return this.calls.filter((c) => c.method === 'setVolumes').at(-1)?.args[0] as
      SoundVolumes | undefined
  }
  get music(): MusicId[] {
    return this.calls.filter((c) => c.method === 'playMusic').map((c) => c.args[0] as MusicId)
  }
  get layers(): FieldLayer[] {
    return this.calls
      .filter((c) => c.method === 'startLayers' || c.method === 'setLayer')
      .map((c) => c.args[0] as FieldLayer)
  }
  get stingers(): MusicId[] {
    return this.calls.filter((c) => c.method === 'playStinger').map((c) => c.args[0] as MusicId)
  }
  get ambience(): AmbienceMix[] {
    return this.calls.filter((c) => c.method === 'setAmbience').map((c) => c.args[0] as AmbienceMix)
  }
  reset() {
    this.calls.length = 0
  }

  unlock() {
    this.unlocked = true
    this.running = true
    this.note('unlock')
    return Promise.resolve()
  }
  setVolumes(v: SoundVolumes) {
    this.note('setVolumes', v)
  }
  preload(ids: readonly AudioId[]) {
    this.note('preload', ids)
  }
  playSfx(id: SfxId, opts?: { gain?: number }) {
    this.note('playSfx', id, opts)
  }
  playMusic(id: MusicId, opts?: { loop?: boolean; fadeMs?: number }) {
    this.note('playMusic', id, opts)
  }
  stopMusic(fadeMs?: number) {
    this.note('stopMusic', fadeMs)
  }
  startLayers(active: FieldLayer) {
    this.note('startLayers', active)
  }
  setLayer(id: FieldLayer, opts?: { bars?: number }) {
    this.note('setLayer', id, opts)
  }
  stopLayers(fadeMs?: number) {
    this.note('stopLayers', fadeMs)
  }
  playStinger(id: MusicId, opts?: { duckTo?: number; resumeLayers?: boolean }) {
    this.note('playStinger', id, opts)
    return Promise.resolve()
  }
  stopStinger(fadeMs?: number) {
    this.note('stopStinger', fadeMs)
  }
  setAmbience(mix: AmbienceMix, fadeMs?: number) {
    this.note('setAmbience', mix, fadeMs)
  }
  stopAmbience(fadeMs?: number) {
    this.note('stopAmbience', fadeMs)
  }
  setSuspended(suspended: boolean) {
    this.note('setSuspended', suspended)
  }
  stopAll(fadeMs?: number) {
    this.note('stopAll', fadeMs)
  }
  dispose() {
    this.note('dispose')
  }
}
