import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router'
import { DEFAULT_SETTINGS } from '@dos/shared/profile'
import { useSettings } from '../data/profile'
import { routes } from '../routes'
import { type AudioEngine, WebAudioEngine } from './engine'
import { FakeEngine } from './fakeEngine'
import type { MusicId, SfxId } from './ids'

interface AudioContextValue {
  engine: AudioEngine
  sfx: (id: SfxId) => void
}

// Outside the provider (tests of single components) audio is a silent recorder
const fallback = new FakeEngine()
const AudioCtx = createContext<AudioContextValue>({
  engine: fallback,
  sfx: (id) => fallback.playSfx(id),
})

export const useAudio = () => useContext(AudioCtx)

/** Effects loaded right after the first interaction (everything else loads on first use) */
const UI_SFX: SfxId[] = [
  'ui-click',
  'ui-toggle',
  'ui-panel-open',
  'ui-panel-close',
  'ui-error',
  'ui-saved',
  'notify-your-turn',
  'notify-invite',
  'notify-deadline',
]

/**
 * Menu music by route (audio brief); null in the match, where the field layers play. Public
 * routes (login, legal pages) never get here: the provider lives inside `RequireAuth`.
 */
export function musicForPath(pathname: string): MusicId | null {
  if (pathname.startsWith('/partie/')) return null
  if (
    pathname === routes.newMatch ||
    pathname.startsWith('/warteraum/') ||
    pathname.startsWith('/einladung/')
  )
    return 'menu-setup'
  return 'menu-lobby'
}

const MODIFIER_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta', 'AltGraph', 'CapsLock'])

/**
 * Whether an input event is a gesture the browser accepts for starting audio. A held modifier
 * key (Ctrl+F5 keeps repeating `keydown` on the reloaded page) is not, and where the browser
 * reports its activation state, that decides.
 */
export function gestureCounts(e: Event, nav: Navigator = navigator) {
  if (e instanceof KeyboardEvent && MODIFIER_KEYS.has(e.key)) return false
  const activation = (nav as Navigator & { userActivation?: { hasBeenActive: boolean } })
    .userActivation
  return activation ? activation.hasBeenActive : true
}

/** Which interface sound a click on `target` makes; null for none */
export function uiSoundFor(target: EventTarget | null): SfxId | null {
  if (!(target instanceof Element)) return null
  const el = target.closest<HTMLElement>(
    'button, [role="button"], a[href], [role="menuitem"], [role="tab"], [role="switch"], [role="radio"], input[type="checkbox"], input[type="radio"]',
  )
  if (!el || el.closest('[data-sound="none"]')) return null
  if (
    el.hasAttribute('disabled') ||
    el.getAttribute('aria-disabled') === 'true' ||
    el.closest('[aria-disabled="true"]')
  )
    return 'ui-error'
  const role = el.getAttribute('role')
  const type = el.getAttribute('type')
  if (
    role === 'switch' ||
    role === 'radio' ||
    type === 'checkbox' ||
    type === 'radio' ||
    el.hasAttribute('aria-pressed') ||
    el.hasAttribute('aria-checked') ||
    el.closest('[role="radiogroup"]')
  )
    return 'ui-toggle'
  return 'ui-click'
}

/**
 * Owns the audio engine for the whole app (mounted above the router, so typing or clicking
 * on the login page already unlocks it and the music starts right after signing in) and
 * silences it in background tabs. Everything that depends on the player (settings, menu
 * music, interface sounds) lives in `SignedInAudio` inside `RequireAuth`.
 */
export function AudioProvider({
  children,
  engine: given,
}: {
  children: ReactNode
  engine?: AudioEngine
}) {
  const engineRef = useRef<AudioEngine | null>(given ?? null)
  engineRef.current ??= new WebAudioEngine()
  return <OwnedAudio engine={engineRef.current}>{children}</OwnedAudio>
}

function OwnedAudio({ children, engine }: { children: ReactNode; engine: AudioEngine }) {
  const sfx = useCallback((id: SfxId) => engine.playSfx(id), [engine])

  // Gestures unlock the browser's audio. Which gesture counts differs by browser and input
  // (touch counts at pointerup, not pointerdown), so keep listening until the context runs.
  useEffect(() => {
    if (engine.running) return
    let preloaded = false
    const unlock = (e: Event) => {
      if (!gestureCounts(e)) return
      void engine.unlock().then(() => {
        if (!preloaded) {
          preloaded = true
          engine.preload([...UI_SFX, 'menu-lobby'])
        }
        if (engine.running) remove()
      })
    }
    const events = ['pointerdown', 'pointerup', 'keydown'] as const
    const remove = () => events.forEach((e) => window.removeEventListener(e, unlock, true))
    events.forEach((e) => window.addEventListener(e, unlock, true))
    return remove
  }, [engine])

  // Background tab: silence
  useEffect(() => {
    const onVisibility = () => engine.setSuspended(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [engine])

  const value = useMemo(() => ({ engine, sfx }), [engine, sfx])
  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>
}

/**
 * Sound of the signed-in area, mounted inside `RequireAuth` so it is created fresh after every
 * login: the session clears the query cache on login and logout, and subscriptions made before
 * that (as the provider above the router would make them) never see data again. Mirrors the
 * sound settings into the buses, plays the menu music by route (the match stops it and plays
 * its layers) and the interface sounds for clicks, toggles and dialogs; leaving the area
 * (logout) fades everything out, so the public pages stay silent.
 */
export function SignedInAudio() {
  const { engine } = useAudio()
  const { pathname } = useLocation()

  // Volumes from the settings (defaults while they load)
  const { data, isError } = useSettings()
  const sound = data?.settings.sound ?? DEFAULT_SETTINGS.sound
  useEffect(() => {
    engine.setVolumes(sound)
  }, [engine, sound])

  // Menu music by route, once the settings are there: after a login the cache is empty, and
  // starting with the default volumes would let a muted player hear the music for a moment
  const music = musicForPath(pathname)
  // (a failed request plays with the defaults rather than not at all)
  const loaded = data !== undefined || isError
  useEffect(() => {
    if (!loaded) return
    if (music) engine.playMusic(music)
    else engine.stopMusic()
  }, [engine, music, loaded])

  // Interface sounds: one listener for all buttons, switches and links
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const id = uiSoundFor(e.target)
      if (id) engine.playSfx(id)
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [engine])

  // Dialogs and sheets opening and closing
  useEffect(() => {
    if (typeof MutationObserver === 'undefined') return
    const isDialog = (n: Node) =>
      n instanceof Element &&
      (n.matches('[role="dialog"], [role="alertdialog"]') ||
        n.querySelector('[role="dialog"], [role="alertdialog"]') !== null)
    let opened = 0
    let closed = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    const flush = () => {
      timer = undefined
      if (opened > 0) engine.playSfx('ui-panel-open')
      else if (closed > 0) engine.playSfx('ui-panel-close')
      opened = closed = 0
    }
    const observer = new MutationObserver((records) => {
      for (const r of records) {
        r.addedNodes.forEach((n) => isDialog(n) && opened++)
        r.removedNodes.forEach((n) => isDialog(n) && closed++)
      }
      if ((opened || closed) && !timer) timer = setTimeout(flush, 80)
    })
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      if (timer) clearTimeout(timer)
    }
  }, [engine])

  // Leaving the signed-in area (logout, legal pages): fade out. The volumes stay as they are,
  // resetting them here would unmute the fade; the next mount sets them from the settings.
  useEffect(() => () => engine.stopAll(), [engine])
  return null
}
