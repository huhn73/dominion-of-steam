import { useRef, useState } from 'react'
import { ChevronDown, Pencil, Trash2, Upload } from 'lucide-react'
import type { MatchResult, ProfilProps, Profile } from '../types'
import { FACTION_HEX, RESULT_STAMP, formatDate, percent } from './format'
import { Avatar, FactionEmblem, Segmented, Sheet, TextInput } from './ui'
import { AvatarCropper } from './AvatarCropper'
import type { Crop } from './cropMath'
import { AVATAR_MAX_BYTES } from '@dos/shared/profile'

const NAME_MIN = 3
const NAME_MAX = 24

function EditProfileSheet({
  profile,
  onSave,
  onUploadAvatar,
  onRemoveAvatar,
  onClose,
}: {
  profile: Profile
  onSave: (name: string) => void
  onUploadAvatar?: (file: File, crop?: Crop) => void
  onRemoveAvatar?: () => void
  onClose: () => void
}) {
  const [name, setName] = useState(profile.displayName)
  // A chosen file waits in the cropper; the edit sheet keeps the typed name meanwhile
  const [pending, setPending] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const trimmed = name.trim()
  const valid = trimmed.length >= NAME_MIN && trimmed.length <= NAME_MAX

  if (pending)
    return (
      <AvatarCropper
        file={pending}
        onCancel={() => setPending(null)}
        onApply={(crop) => {
          onUploadAvatar?.(pending, crop)
          setPending(null)
        }}
      />
    )

  return (
    <Sheet
      title="Profil bearbeiten"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="min-h-11 rounded-lg border-2 border-stone-300 px-4 font-semibold dark:border-stone-700">
            Abbrechen
          </button>
          <button
            type="button"
            disabled={!valid}
            onClick={() => onSave(trimmed)}
            className="min-h-11 rounded-lg bg-amber-500 px-5 font-semibold text-stone-950 hover:bg-amber-400 disabled:opacity-40"
          >
            Speichern
          </button>
        </div>
      }
    >
      <div className="mb-6 flex items-center gap-4">
        <Avatar name={trimmed || profile.displayName} url={profile.avatarUrl} className="size-20 text-2xl" />
        <div className="flex flex-col gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              // Reset, so that the same file can be chosen again after cancelling
              e.target.value = ''
              if (!file) return
              // Too large: straight to the upload, which reports it without sending the file
              if (file.size > AVATAR_MAX_BYTES) onUploadAvatar?.(file)
              else setPending(file)
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex min-h-11 items-center gap-2 rounded-lg bg-stone-900 px-4 font-semibold text-amber-300 hover:bg-stone-800 dark:bg-stone-800"
          >
            <Upload className="size-4" /> Bild hochladen
          </button>
          {profile.avatarUrl && (
            <button type="button" onClick={onRemoveAvatar} className="flex min-h-10 items-center gap-2 px-1 text-sm font-semibold text-rose-600 hover:underline">
              <Trash2 className="size-4" /> Bild entfernen
            </button>
          )}
          {!profile.avatarUrl && <p className="text-xs text-stone-500">Ohne Bild werden deine Initialen gezeigt.</p>}
        </div>
      </div>
      <TextInput
        label="Anzeigename"
        value={name}
        maxLength={NAME_MAX}
        onChange={(e) => setName(e.target.value)}
        hint={valid ? `${trimmed.length}/${NAME_MAX} Zeichen` : `${NAME_MIN} bis ${NAME_MAX} Zeichen`}
      />
    </Sheet>
  )
}

export function Profil({
  profile,
  stats,
  factionStats,
  history,
  hasMoreHistory,
  factions,
  onLoadMoreHistory,
  onUpdateDisplayName,
  onUploadAvatar,
  onRemoveAvatar,
}: ProfilProps) {
  const [editing, setEditing] = useState(false)
  const [resultFilter, setResultFilter] = useState<'all' | MatchResult>('all')
  const [factionFilter, setFactionFilter] = useState('all')

  const factionOf = (id: string | null) => factions.find((f) => f.id === id)
  const favorite = factionOf(profile.favoriteFactionId)
  const accent = favorite ? FACTION_HEX[favorite.color] : { base: '#78716c', deep: '#292524' }
  const maxGames = Math.max(1, ...factionStats.map((f) => f.gamesPlayed))
  const shown = history.filter(
    (h) => (resultFilter === 'all' || h.result === resultFilter) && (factionFilter === 'all' || h.factionId === factionFilter),
  )

  const tiles = [
    { label: 'Partien', value: stats.gamesPlayed },
    { label: 'Siege', value: stats.wins },
    { label: 'Siegquote', value: `${percent(stats.wins, stats.gamesPlayed)} %`, bar: percent(stats.wins, stats.gamesPlayed) },
    { label: 'Städte erobert', value: stats.citiesCaptured },
    { label: 'Einheiten gebaut', value: stats.unitsBuilt },
    { label: 'Längste Partie', value: stats.longestGameRounds, unit: 'Runden' },
  ]

  return (
    <div className="font-['Barlow'] text-stone-900 dark:text-stone-100">
      {/* Dossier header in the favourite faction's colours */}
      <header className="relative overflow-hidden text-white" style={{ background: `linear-gradient(115deg, ${accent.deep} 0%, #1c1917 70%)` }}>
        <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'repeating-linear-gradient(-45deg, #fff 0 1px, transparent 1px 12px)' }} />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-end sm:px-6 sm:py-14">
          <Avatar name={profile.displayName} url={profile.avatarUrl} className="size-28 text-4xl shadow-2xl sm:size-32" ring={accent.base} />
          <div className="min-w-0 flex-1">
            <p className="mb-1 font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.3em] text-white/60">Dienstakte</p>
            <h1 className="truncate pt-2 font-['Big_Shoulders_Display'] text-5xl font-black uppercase leading-none tracking-wide sm:text-7xl">{profile.displayName}</h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/75">
              <span>Mitglied seit {formatDate(profile.memberSince, { month: 'long', year: 'numeric' })}</span>
              {favorite && (
                <span className="flex items-center gap-1.5">
                  <FactionEmblem faction={favorite} className="size-5" /> Lieblingsfraktion: <strong className="text-white">{favorite.name}</strong>
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex min-h-11 items-center gap-2 self-start rounded-lg border-2 border-white/30 px-4 font-semibold hover:border-white hover:bg-white/10 sm:self-auto"
          >
            <Pencil className="size-4" /> Profil bearbeiten
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6">
        {/* Stats */}
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="mb-4 border-b-4 border-double border-stone-300 pb-2 font-['Big_Shoulders_Display'] text-3xl font-black uppercase tracking-wide dark:border-stone-700">
            Bilanz
          </h2>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {tiles.map((t) => (
              <div key={t.label} className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                <dt className="text-[11px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">{t.label}</dt>
                <dd>
                  <span className="font-['IBM_Plex_Mono'] text-3xl font-semibold">{t.value}</span>
                  {t.unit && <span className="ml-1 text-xs text-stone-500">{t.unit}</span>}
                  {t.bar != null && (
                    <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                      <span className="block h-full rounded-full bg-gradient-to-r from-teal-600 to-teal-400" style={{ width: `${t.bar}%` }} />
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Per faction */}
        <section aria-labelledby="faction-heading">
          <h2 id="faction-heading" className="mb-4 border-b-4 border-double border-stone-300 pb-2 font-['Big_Shoulders_Display'] text-3xl font-black uppercase tracking-wide dark:border-stone-700">
            Nach Fraktion
          </h2>
          <ul className="space-y-3">
            {factionStats.map((fs) => {
              const f = factionOf(fs.factionId)
              if (!f) return null
              const c = FACTION_HEX[f.color]
              const played = fs.gamesPlayed > 0
              return (
                <li key={fs.factionId} className="grid grid-cols-[2.5rem_1fr] items-center gap-x-3 gap-y-1 sm:grid-cols-[2.5rem_12rem_1fr_auto]">
                  <FactionEmblem faction={f} className="row-span-2 size-10 sm:row-span-1" />
                  <span className="font-semibold">{f.name}</span>
                  <div className="col-start-2 h-6 overflow-hidden rounded-md bg-stone-100 sm:col-start-auto dark:bg-stone-800/60">
                    {played ? (
                      <div className="relative h-full rounded-md" style={{ width: `${(fs.gamesPlayed / maxGames) * 100}%`, background: `${c.base}55` }}>
                        <div className="h-full rounded-md" style={{ width: `${percent(fs.wins, fs.gamesPlayed)}%`, background: c.base }} />
                      </div>
                    ) : (
                      <div className="flex h-full items-center rounded-md border-2 border-dashed border-stone-300 px-2 text-xs text-stone-500 dark:border-stone-700">
                        Noch nicht gespielt
                      </div>
                    )}
                  </div>
                  <span className="col-start-2 whitespace-nowrap font-['IBM_Plex_Mono'] text-sm text-stone-600 sm:col-start-auto sm:text-right dark:text-stone-300">
                    {played ? `${fs.gamesPlayed} Partien · ${percent(fs.wins, fs.gamesPlayed)} % Siege` : '–'}
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="mt-3 flex items-center gap-2 text-xs text-stone-500">
            <span className="inline-block h-2.5 w-5 rounded-sm bg-stone-500" /> Siege
            <span className="ml-3 inline-block h-2.5 w-5 rounded-sm bg-stone-500/35" /> Partien gesamt
          </p>
        </section>

        {/* History */}
        <section aria-labelledby="history-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b-4 border-double border-stone-300 pb-2 dark:border-stone-700">
            <h2 id="history-heading" className="font-['Big_Shoulders_Display'] text-3xl font-black uppercase tracking-wide">
              Partieverlauf
            </h2>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <Segmented
                label="Nach Ergebnis filtern"
                value={resultFilter}
                onChange={setResultFilter}
                options={[
                  { value: 'all', label: 'Alle' },
                  { value: 'victory', label: 'Siege' },
                  { value: 'defeat', label: 'Niederlagen' },
                  { value: 'surrendered', label: 'Aufgegeben' },
                ]}
              />
              <label className="relative flex flex-1 items-center sm:flex-none">
                <span className="sr-only">Nach Fraktion filtern</span>
                <select
                  value={factionFilter}
                  onChange={(e) => setFactionFilter(e.target.value)}
                  className="h-12 w-full appearance-none rounded-lg border border-stone-300 bg-white pl-3 pr-9 text-sm font-semibold sm:w-48 dark:border-stone-700 dark:bg-stone-900"
                >
                  <option value="all">Alle Fraktionen</option>
                  {factions.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 size-4 text-stone-500" />
              </label>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-stone-300 px-6 py-10 text-center dark:border-stone-700">
              <p className="font-['Big_Shoulders_Display'] text-2xl font-black uppercase tracking-wide">Noch keine Partie beendet</p>
              <p className="mt-1 text-sm text-stone-500">Sobald du deine erste Partie abgeschlossen hast, erscheint sie hier mit Ergebnis und Platzierung.</p>
            </div>
          ) : shown.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-stone-300 px-6 py-10 text-center dark:border-stone-700">
              <p className="font-['Big_Shoulders_Display'] text-2xl font-black uppercase tracking-wide">Keine Partien gefunden</p>
              <p className="mt-1 text-sm text-stone-500">Für diesen Filter gibt es in deinem Verlauf keine Partie.</p>
              <button
                type="button"
                onClick={() => {
                  setResultFilter('all')
                  setFactionFilter('all')
                }}
                className="mt-4 min-h-11 rounded-lg bg-amber-500 px-4 font-semibold text-stone-950 hover:bg-amber-400"
              >
                Filter zurücksetzen
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900">
              {shown.map((h) => {
                const f = factionOf(h.factionId)
                const stamp = RESULT_STAMP[h.result]
                return (
                  <li key={h.id} className="flex items-center gap-4 p-4">
                    {f && <FactionEmblem faction={f} className="size-9 shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-['Big_Shoulders_Display'] text-xl font-black uppercase tracking-wide">{h.name}</p>
                      <p className="text-sm text-stone-500">
                        Platz {h.placement} von {h.playerCount} · {h.rounds} Runden · {formatDate(h.endedAt)}
                      </p>
                      <p className="truncate text-xs text-stone-500">gegen {h.opponents.join(', ')}</p>
                    </div>
                    <span className={`shrink-0 rotate-[-6deg] rounded border-[3px] border-double px-2 py-1 font-['Big_Shoulders_Display'] text-sm font-black uppercase tracking-[0.2em] ${stamp.className}`}>
                      {stamp.label}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
          {hasMoreHistory && shown.length > 0 && (
            <button
              type="button"
              onClick={onLoadMoreHistory}
              className="mx-auto mt-4 flex min-h-11 items-center gap-2 rounded-lg border-2 border-stone-300 px-5 font-semibold hover:border-teal-500 dark:border-stone-700"
            >
              Mehr anzeigen
            </button>
          )}
        </section>
      </div>

      {editing && (
        <EditProfileSheet
          profile={profile}
          onClose={() => setEditing(false)}
          onUploadAvatar={onUploadAvatar}
          onRemoveAvatar={onRemoveAvatar}
          onSave={(name) => {
            if (name !== profile.displayName) onUpdateDisplayName?.(name)
            setEditing(false)
          }}
        />
      )}
    </div>
  )
}
