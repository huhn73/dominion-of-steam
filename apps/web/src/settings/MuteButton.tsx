import { Volume2, VolumeX } from 'lucide-react'
import { DEFAULT_SETTINGS } from '@dos/shared/profile'
import { useAudio } from '../audio/AudioProvider'
import { useSettings, useSettingsActions } from '../data/profile'

/**
 * Quick mute in the header: flips `sound.muted` (saved like the settings page does). The
 * sliders stay in Profil & Einstellungen.
 */
export function MuteButton({ className = '' }: { className?: string }) {
  const { data } = useSettings()
  const { setLocal, save, reload } = useSettingsActions()
  const { sfx } = useAudio()
  const settings = data?.settings
  const muted = settings?.sound.muted ?? DEFAULT_SETTINGS.sound.muted

  const toggle = () => {
    if (!settings) return
    const next = { ...settings, sound: { ...settings.sound, muted: !muted } }
    setLocal(next)
    // Audible only when switching on (the engine applies the new volume first)
    if (muted) setTimeout(() => sfx('ui-toggle'), 60)
    save(next).catch(() => reload().catch(() => undefined))
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!settings}
      aria-label={muted ? 'Ton an' : 'Ton aus'}
      aria-pressed={muted}
      title={muted ? 'Ton an' : 'Ton aus (Lautstärke in den Einstellungen)'}
      data-sound="none"
      className={`flex size-9 items-center justify-center rounded-md text-stone-600 transition-colors hover:bg-teal-50 hover:text-teal-700 focus-visible:outline-2 focus-visible:outline-teal-500 disabled:opacity-40 dark:text-stone-300 dark:hover:bg-teal-950 dark:hover:text-teal-300 ${className}`}
    >
      {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
    </button>
  )
}
