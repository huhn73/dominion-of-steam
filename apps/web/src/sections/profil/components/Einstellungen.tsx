import { useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, ArrowLeft, Bell, BellOff, Check, ChevronRight, LogOut, Monitor, MousePointer2, User, Volume2 } from 'lucide-react'
import type { EinstellungenProps, NotificationEvent, Settings } from '../types'
import { Segmented, SettingRow, Sheet, Slider, Switch, TextInput } from './ui'
import { LOCALES } from '@dos/shared/i18n'
import { useT } from '../../../i18n'

type Rubric = 'notifications' | 'display' | 'sound' | 'controls' | 'account'

const RUBRICS: { id: Rubric; label: string; hint: string; icon: typeof Bell }[] = [
  { id: 'notifications', label: 'Benachrichtigungen', hint: 'Push und E-Mail', icon: Bell },
  { id: 'display', label: 'Darstellung', hint: 'Farbschema, Animationen', icon: Monitor },
  { id: 'sound', label: 'Ton', hint: 'Lautstärke, Musik, Umgebung', icon: Volume2 },
  { id: 'controls', label: 'Steuerung', hint: 'Maus, Ziehen, Zoom', icon: MousePointer2 },
  { id: 'account', label: 'Konto', hint: 'E-Mail, Passwort, Abmelden', icon: User },
]

const EVENTS: { id: NotificationEvent; label: string; description: string }[] = [
  { id: 'yourTurn', label: 'Du bist am Zug', description: 'Sobald eine Partie auf deinen Befehl wartet' },
  { id: 'deadlineSoon', label: 'Frist läuft bald ab', description: 'Wenn weniger als 3 Stunden bleiben' },
  { id: 'invitation', label: 'Einladung erhalten', description: 'Jemand lädt dich zu einer Partie ein' },
  { id: 'matchEnded', label: 'Partie beendet', description: 'Mit Ergebnis und Platzierung' },
]

function RubricTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-2 font-['Big_Shoulders_Display'] text-3xl font-black uppercase tracking-wide">{children}</h2>
}

function SheetFooter({ onCancel, confirmLabel, disabled, onConfirm, danger }: { onCancel: () => void; confirmLabel: string; disabled?: boolean; onConfirm: () => void; danger?: boolean }) {
  return (
    <div className="flex justify-end gap-2">
      <button type="button" onClick={onCancel} className="min-h-11 rounded-lg border-2 border-stone-300 px-4 font-semibold dark:border-stone-700">
        Abbrechen
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onConfirm}
        className={`min-h-11 rounded-lg px-5 font-semibold disabled:opacity-40 ${danger ? 'bg-rose-600 text-white hover:bg-rose-500' : 'bg-amber-500 text-stone-950 hover:bg-amber-400'}`}
      >
        {confirmLabel}
      </button>
    </div>
  )
}

export function Einstellungen({
  settings: initialSettings,
  locale,
  onChangeLocale,
  account,
  displayName,
  pushPermission,
  onChangeSettings,
  onEnablePush,
  onResendVerification,
  onChangeEmail,
  onChangePassword,
  onLogout,
  onLogoutEverywhere,
  onDeleteAccount,
}: EinstellungenProps) {
  const t = useT()
  const [settings, setSettings] = useState<Settings>(initialSettings)
  // null = overview list on phones; desktop shows the first rubric
  const [rubric, setRubric] = useState<Rubric | null>(null)
  const [saved, setSaved] = useState(0)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [dialog, setDialog] = useState<null | 'email' | 'password' | 'delete1' | 'delete2'>(null)
  const [form, setForm] = useState({ email: '', current: '', next: '', repeat: '', confirmName: '', deletePassword: '' })

  const active = rubric ?? 'notifications'

  const update = <K extends keyof Settings>(group: K, patch: Partial<Settings[K]>) => {
    const next = { ...settings, [group]: { ...settings[group], ...patch } }
    setSettings(next)
    onChangeSettings?.(next)
    setSaved((n) => n + 1)
    clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSaved(0), 1600)
  }

  const openDialog = (d: typeof dialog) => {
    setForm({ email: '', current: '', next: '', repeat: '', confirmName: '', deletePassword: '' })
    setDialog(d)
  }

  const { notifications: n, display: d, sound: s, controls: c } = settings
  const emailValid = /^\S+@\S+\.\S+$/.test(form.email) && form.current.length > 0
  const passwordValid = form.current.length > 0 && form.next.length >= 8 && form.next === form.repeat

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 font-['Barlow'] text-stone-900 sm:px-6 sm:py-12 dark:text-stone-100">
      <header className="mb-8">
        <p className="mb-2 flex items-center gap-3 font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.3em] text-teal-700 dark:text-teal-400">
          <span className="h-px w-8 bg-current" /> Maschinenraum
        </p>
        <h1 className="font-['Big_Shoulders_Display'] text-5xl font-black uppercase leading-[0.9] tracking-wide sm:text-6xl">Einstellungen</h1>
      </header>

      <div className="grid gap-8 md:grid-cols-[15rem_1fr]">
        {/* Rubric navigation: always on desktop, as a list on phones until a rubric is chosen */}
        <nav aria-label="Rubriken" className={rubric ? 'hidden md:block' : ''}>
          <ul className="overflow-hidden rounded-xl border border-stone-200 bg-white md:space-y-1 md:rounded-none md:border-0 md:bg-transparent dark:border-stone-800 dark:bg-stone-900 md:dark:bg-transparent">
            {RUBRICS.map(({ id, label, hint, icon: Icon }) => {
              const current = id === active
              return (
                <li key={id} className="border-b border-stone-200 last:border-0 md:border-0 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => setRubric(id)}
                    aria-current={current ? 'page' : undefined}
                    className={`group flex min-h-14 w-full items-center gap-3 px-4 text-left transition-colors md:min-h-12 md:rounded-lg md:border-l-4 ${
                      current
                        ? 'md:border-amber-500 md:bg-white md:shadow-sm md:dark:bg-stone-900'
                        : 'md:border-transparent md:hover:bg-stone-100 md:dark:hover:bg-stone-900'
                    }`}
                  >
                    <Icon className={`size-5 ${current ? 'md:text-amber-600' : 'text-stone-500'}`} />
                    <span className="flex-1">
                      <span className="block font-semibold">{label}</span>
                      <span className="block text-xs text-stone-500 md:hidden">{hint}</span>
                    </span>
                    <ChevronRight className="size-5 text-stone-400 md:hidden" />
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <section className={rubric ? '' : 'hidden md:block'} aria-live="polite">
          <button
            type="button"
            onClick={() => setRubric(null)}
            className="mb-4 flex min-h-11 items-center gap-2 text-sm font-semibold uppercase tracking-widest text-stone-500 hover:text-teal-700 md:hidden"
          >
            <ArrowLeft className="size-4" /> Alle Rubriken
          </button>

          <div className="rounded-xl border border-stone-200 bg-white px-5 py-5 sm:px-6 dark:border-stone-800 dark:bg-stone-900">
            {active === 'notifications' && (
              <>
                <RubricTitle>Benachrichtigungen</RubricTitle>
                {pushPermission !== 'granted' && (
                  <div className="my-4 flex flex-wrap items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/40">
                    {pushPermission === 'denied' ? <BellOff className="size-5 text-stone-500" /> : <Bell className="size-5 text-amber-600" />}
                    <p className="flex-1">
                      {pushPermission === 'denied'
                        ? 'Push ist im Browser blockiert. Erlaube Benachrichtigungen über das Schloss-Symbol in der Adressleiste.'
                        : 'Push-Benachrichtigungen sind in diesem Browser noch nicht erlaubt.'}
                    </p>
                    {pushPermission === 'default' && (
                      <button type="button" onClick={onEnablePush} className="min-h-10 rounded-lg bg-amber-500 px-4 font-semibold text-stone-950 hover:bg-amber-400">
                        Erlauben
                      </button>
                    )}
                  </div>
                )}
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[11px] font-bold uppercase tracking-widest text-stone-500">
                      <th className="py-2 font-bold">Anlass</th>
                      <th className="w-16 py-2 text-center font-bold sm:w-24">Push</th>
                      <th className="w-16 py-2 text-center font-bold sm:w-24">E-Mail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {EVENTS.map((e) => (
                      <tr key={e.id} className="border-t border-stone-200 dark:border-stone-800">
                        <td className="py-3 pr-2">
                          <span className="block font-semibold">{e.label}</span>
                          <span className="block text-sm text-stone-500">{e.description}</span>
                        </td>
                        <td className="text-center">
                          <span className="inline-flex">
                            <Switch label={`${e.label} per Push`} checked={n[e.id].push} onChange={(v) => update('notifications', { [e.id]: { ...n[e.id], push: v } })} />
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="inline-flex">
                            <Switch label={`${e.label} per E-Mail`} checked={n[e.id].email} onChange={(v) => update('notifications', { [e.id]: { ...n[e.id], email: v } })} />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-2 border-t border-stone-200 pt-4 dark:border-stone-800">
                  <SettingRow title="E-Mail senden, wenn ich offline bin seit" description="Bist du online, bekommst du nur Push-Benachrichtigungen.">
                    <Segmented
                      label="E-Mail-Verzögerung"
                      value={n.emailDelayHours}
                      onChange={(v) => update('notifications', { emailDelayHours: v })}
                      options={[
                        { value: 0, label: 'Sofort' },
                        { value: 1, label: '1 Std.' },
                        { value: 6, label: '6 Std.' },
                        { value: 24, label: '24 Std.' },
                      ]}
                    />
                  </SettingRow>
                </div>
              </>
            )}

            {active === 'display' && (
              <>
                <RubricTitle>Darstellung</RubricTitle>
                {onChangeLocale && locale && (
                  <SettingRow title={t('common.language.label')} description={t('common.language.hint')}>
                    <Segmented
                      label={t('common.language.label')}
                      value={locale}
                      onChange={onChangeLocale}
                      options={LOCALES.map((l) => ({ value: l, label: t(`common.language.${l}`) }))}
                    />
                  </SettingRow>
                )}
                <SettingRow title="Farbschema">
                  <Segmented
                    label="Farbschema"
                    value={d.theme}
                    onChange={(v) => update('display', { theme: v })}
                    options={[
                      { value: 'light', label: 'Hell' },
                      { value: 'dark', label: 'Dunkel' },
                      { value: 'system', label: 'System' },
                    ]}
                  />
                </SettingRow>
                <SettingRow title="Animationen reduzieren" description="Weniger Bewegung bei Kamera, Übergängen und Hervorhebungen.">
                  <Switch label="Animationen reduzieren" checked={d.reduceMotion} onChange={(v) => update('display', { reduceMotion: v })} />
                </SettingRow>
                <SettingRow title="Kampfanimationen" description="Explosion und Mündungsfeuer auf dem Kampffeld. Ohne sie erscheint nur das Ergebnis.">
                  <Switch label="Kampfanimationen" checked={d.combatAnimations} onChange={(v) => update('display', { combatAnimations: v })} />
                </SettingRow>
                <SettingRow title="Gegnerzüge automatisch abspielen" description="Zu Beginn deines Zugs die sichtbaren Aktionen der Gegner als Wiederholung zeigen.">
                  <Switch label="Gegnerzüge automatisch abspielen" checked={d.autoplayReplay} onChange={(v) => update('display', { autoplayReplay: v })} />
                </SettingRow>
                <SettingRow title="Rundenbericht zu Zugbeginn" description="Zu Beginn deines Zugs eine Zusammenfassung: Verluste, Gefechte, Städte, Entdeckungen und gesehene Gegnerzüge.">
                  <Switch label="Rundenbericht zu Zugbeginn" checked={d.turnReport} onChange={(v) => update('display', { turnReport: v })} />
                </SettingRow>
              </>
            )}

            {active === 'sound' && (
              <>
                <RubricTitle>Ton</RubricTitle>
                <SettingRow title="Stumm" description="Schaltet alle Geräusche und die Musik aus.">
                  <Switch label="Stumm" checked={s.muted} onChange={(v) => update('sound', { muted: v })} />
                </SettingRow>
                <SettingRow title="Gesamtlautstärke">
                  <Slider label="Gesamtlautstärke" value={s.master} disabled={s.muted} onChange={(v) => update('sound', { master: v })} />
                </SettingRow>
                <SettingRow title="Effekte" description="Kanonen, Dampfpfeifen, Kettenrasseln">
                  <Slider label="Effekte" value={s.effects} disabled={s.muted} onChange={(v) => update('sound', { effects: v })} />
                </SettingRow>
                <SettingRow title="Musik">
                  <Slider label="Musik" value={s.music} disabled={s.muted} onChange={(v) => update('sound', { music: v })} />
                </SettingRow>
                <SettingRow title="Umgebung" description="Brandung, Wind, Fabriklärm, je nach Kartenausschnitt">
                  <Slider label="Umgebung" value={s.ambience} disabled={s.muted} onChange={(v) => update('sound', { ambience: v })} />
                </SettingRow>
              </>
            )}

            {active === 'controls' && (
              <>
                <RubricTitle>Steuerung</RubricTitle>
                <SettingRow title="Rechte Maustaste" description="„Abbrechen“ nimmt auf dem Spielfeld schrittweise Auswahl und Vorschau zurück.">
                  <Segmented
                    label="Rechte Maustaste"
                    value={c.rightClick}
                    onChange={(v) => update('controls', { rightClick: v })}
                    options={[
                      { value: 'cancel', label: 'Abbrechen' },
                      { value: 'contextMenu', label: 'Kontextmenü' },
                    ]}
                  />
                </SettingRow>
                <SettingRow title="Nachfrage beim Zugende" description="Fragen, wenn noch Einheiten ohne Befehl sind. Flugzeuge ohne Rückweg werden immer gemeldet.">
                  <Switch label="Nachfrage beim Zugende" checked={c.confirmEndTurn} onChange={(v) => update('controls', { confirmEndTurn: v })} />
                </SettingRow>
                <SettingRow title="Einheiten ziehen" description="Einheiten mit Maus oder Finger auf ein Ziel ziehen. Ohne Ziehen bleibt Antippen.">
                  <Switch label="Einheiten ziehen" checked={c.dragUnits} onChange={(v) => update('controls', { dragUnits: v })} />
                </SettingRow>
                <SettingRow title="Zoom-Empfindlichkeit" description="Für Mausrad und Zwei-Finger-Geste">
                  <Slider label="Zoom-Empfindlichkeit" value={c.zoomSensitivity} onChange={(v) => update('controls', { zoomSensitivity: v })} />
                </SettingRow>
              </>
            )}

            {active === 'account' && (
              <>
                <RubricTitle>Konto</RubricTitle>
                <SettingRow
                  title="E-Mail-Adresse"
                  description={account.email}
                  badge={
                    account.emailVerified ? (
                      <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-800 dark:bg-teal-900/60 dark:text-teal-200">bestätigt</span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">nicht bestätigt</span>
                    )
                  }
                >
                  <div className="flex flex-wrap gap-2">
                    {!account.emailVerified && (
                      <button type="button" onClick={onResendVerification} className="min-h-11 rounded-lg bg-amber-500 px-4 font-semibold text-stone-950 hover:bg-amber-400">
                        Bestätigung senden
                      </button>
                    )}
                    <button type="button" onClick={() => openDialog('email')} className="min-h-11 rounded-lg border-2 border-stone-300 px-4 font-semibold hover:border-teal-500 dark:border-stone-700">
                      Ändern
                    </button>
                  </div>
                </SettingRow>
                <SettingRow title="Passwort" description="••••••••••">
                  <button type="button" onClick={() => openDialog('password')} className="min-h-11 rounded-lg border-2 border-stone-300 px-4 font-semibold hover:border-teal-500 dark:border-stone-700">
                    Ändern
                  </button>
                </SettingRow>
                <SettingRow title="Angemeldete Geräte" description={`Du bist auf ${account.activeSessions} ${account.activeSessions === 1 ? 'Gerät' : 'Geräten'} angemeldet.`}>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={onLogout} className="flex min-h-11 items-center gap-2 rounded-lg border-2 border-stone-300 px-4 font-semibold hover:border-teal-500 dark:border-stone-700">
                      <LogOut className="size-4" /> Abmelden
                    </button>
                    <button type="button" onClick={onLogoutEverywhere} className="min-h-11 rounded-lg px-4 font-semibold text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800">
                      Auf allen Geräten abmelden
                    </button>
                  </div>
                </SettingRow>

                <div className="mt-6 rounded-lg border-2 border-rose-300 bg-rose-50/60 p-4 dark:border-rose-900 dark:bg-rose-950/30">
                  <p className="flex items-center gap-2 font-['Big_Shoulders_Display'] text-lg font-black uppercase tracking-widest text-rose-700 dark:text-rose-400">
                    <AlertTriangle className="size-5" /> Gefahrenzone
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                    <p className="max-w-md text-sm text-stone-700 dark:text-stone-300">
                      Löscht dein Konto endgültig. Deine laufenden Partien übernimmt eine KI, Statistiken und Verlauf gehen verloren.
                    </p>
                    <button type="button" onClick={() => openDialog('delete1')} className="min-h-11 rounded-lg bg-rose-600 px-4 font-semibold text-white hover:bg-rose-500">
                      Konto löschen
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/* Saved confirmation */}
      {saved > 0 && (
        <div key={saved} role="status" className="fixed bottom-24 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-teal-300 shadow-xl animate-in fade-in slide-in-from-bottom-2 md:bottom-6 dark:bg-stone-800">
          <Check className="size-4" /> Gespeichert
        </div>
      )}

      {dialog === 'email' && (
        <Sheet
          title="E-Mail ändern"
          onClose={() => setDialog(null)}
          footer={
            <SheetFooter
              onCancel={() => setDialog(null)}
              confirmLabel="Speichern"
              disabled={!emailValid}
              onConfirm={() => {
                onChangeEmail?.(form.email, form.current)
                setDialog(null)
              }}
            />
          }
        >
          <div className="space-y-4">
            <TextInput label="Neue E-Mail-Adresse" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} hint="Wir schicken dir einen Bestätigungslink an die neue Adresse." />
            <TextInput label="Aktuelles Passwort" type="password" autoComplete="current-password" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} />
          </div>
        </Sheet>
      )}

      {dialog === 'password' && (
        <Sheet
          title="Passwort ändern"
          onClose={() => setDialog(null)}
          footer={
            <SheetFooter
              onCancel={() => setDialog(null)}
              confirmLabel="Speichern"
              disabled={!passwordValid}
              onConfirm={() => {
                onChangePassword?.(form.current, form.next)
                setDialog(null)
              }}
            />
          }
        >
          <div className="space-y-4">
            <TextInput label="Aktuelles Passwort" type="password" autoComplete="current-password" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} />
            <TextInput label="Neues Passwort" type="password" autoComplete="new-password" value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} hint="Mindestens 8 Zeichen" />
            <TextInput
              label="Neues Passwort wiederholen"
              type="password"
              autoComplete="new-password"
              value={form.repeat}
              onChange={(e) => setForm({ ...form, repeat: e.target.value })}
              hint={form.repeat && form.repeat !== form.next ? 'Die Passwörter stimmen nicht überein.' : undefined}
            />
          </div>
        </Sheet>
      )}

      {dialog === 'delete1' && (
        <Sheet title="Konto löschen?" onClose={() => setDialog(null)} footer={<SheetFooter onCancel={() => setDialog(null)} confirmLabel="Weiter" danger onConfirm={() => setDialog('delete2')} />}>
          <ul className="list-disc space-y-2 pl-5 text-stone-700 dark:text-stone-300">
            <li>Deine laufenden Partien übernimmt eine KI auf Stufe „Normal“.</li>
            <li>Deine Statistiken und dein Partieverlauf werden gelöscht.</li>
            <li>Das Löschen kann nicht rückgängig gemacht werden.</li>
          </ul>
        </Sheet>
      )}

      {dialog === 'delete2' && (
        <Sheet
          title="Endgültig löschen"
          onClose={() => setDialog(null)}
          footer={
            <SheetFooter
              onCancel={() => setDialog(null)}
              confirmLabel="Konto löschen"
              danger
              disabled={form.confirmName !== displayName || form.deletePassword.length === 0}
              onConfirm={() => {
                onDeleteAccount?.(form.deletePassword)
                setDialog(null)
              }}
            />
          }
        >
          <div className="space-y-4">
            <TextInput
              label={`Gib zur Bestätigung deinen Anzeigenamen „${displayName}“ ein`}
              value={form.confirmName}
              onChange={(e) => setForm({ ...form, confirmName: e.target.value })}
              autoComplete="off"
            />
            <TextInput label="Aktuelles Passwort" type="password" autoComplete="current-password" value={form.deletePassword} onChange={(e) => setForm({ ...form, deletePassword: e.target.value })} />
          </div>
        </Sheet>
      )}
    </div>
  )
}
