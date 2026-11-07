import { useRef, useState } from 'react'
import { ChevronDown, Pencil, Trash2, Upload, UserCheck, UserPlus } from 'lucide-react'
import type { MatchResult, ProfilProps, Profile } from '../types'
import { FACTION_HEX, RESULT_STAMP, formatDate, percent } from './format'
import { Avatar, FactionEmblem, Segmented, Sheet, TextInput } from './ui'
import { AvatarCropper } from './AvatarCropper'
import { Abzeichen } from './Abzeichen'
import type { Crop } from './cropMath'
import { AVATAR_MAX_BYTES } from '@dos/shared/profile'
import { Rich, useLocale, useT } from '../../../i18n'

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
  const t = useT()
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
      title={t('profile.edit')}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="min-h-11 rounded-lg border-2 border-stone-300 px-4 font-semibold dark:border-stone-700">
            {t('profile.cancel')}
          </button>
          <button
            type="button"
            disabled={!valid}
            onClick={() => onSave(trimmed)}
            className="min-h-11 rounded-lg bg-amber-500 px-5 font-semibold text-stone-950 hover:bg-amber-400 disabled:opacity-40"
          >
            {t('profile.save')}
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
            <Upload className="size-4" /> {t('profile.uploadImage')}
          </button>
          {profile.avatarUrl && (
            <button type="button" onClick={onRemoveAvatar} className="flex min-h-10 items-center gap-2 px-1 text-sm font-semibold text-rose-600 hover:underline">
              <Trash2 className="size-4" /> {t('profile.removeImage')}
            </button>
          )}
          {!profile.avatarUrl && <p className="text-xs text-stone-500">{t('profile.noImage')}</p>}
        </div>
      </div>
      <TextInput
        label={t('profile.displayName')}
        value={name}
        maxLength={NAME_MAX}
        onChange={(e) => setName(e.target.value)}
        hint={valid ? t('profile.nameCount', { length: trimmed.length, max: NAME_MAX }) : t('profile.nameRange', { min: NAME_MIN, max: NAME_MAX })}
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
  badges = [],
  isOwn = true,
  friendship = null,
  resultFilter = 'all',
  factionFilter = 'all',
  onFilterChange,
  onOpenPlayer,
  onAddFriend,
  onLoadMoreHistory,
  onUpdateDisplayName,
  onUploadAvatar,
  onRemoveAvatar,
}: ProfilProps) {
  const t = useT()
  const { locale } = useLocale()
  const [editing, setEditing] = useState(false)
  const setResultFilter = (result: 'all' | MatchResult) => onFilterChange?.({ result, faction: factionFilter })
  const setFactionFilter = (faction: string) => onFilterChange?.({ result: resultFilter, faction })

  const factionOf = (id: string | null) => factions.find((f) => f.id === id)
  const favorite = factionOf(profile.favoriteFactionId)
  const accent = favorite ? FACTION_HEX[favorite.color] : { base: '#78716c', deep: '#292524' }
  const maxGames = Math.max(1, ...factionStats.map((f) => f.gamesPlayed))
  // The server filters; the list holds only matching matches
  const shown = history

  const tiles = [
    { label: t('profile.tile.games'), value: stats.gamesPlayed },
    { label: t('profile.tile.wins'), value: stats.wins },
    { label: t('profile.tile.winRate'), value: `${percent(stats.wins, stats.gamesPlayed)} %`, bar: percent(stats.wins, stats.gamesPlayed) },
    { label: t('profile.tile.cities'), value: stats.citiesCaptured },
    { label: t('profile.tile.units'), value: stats.unitsBuilt },
    { label: t('profile.tile.longest'), value: stats.longestGameRounds, unit: t('profile.tile.rounds') },
  ]

  return (
    <div className="font-['Barlow'] text-stone-900 dark:text-stone-100">
      {/* Dossier header in the favourite faction's colours */}
      <header className="relative overflow-hidden text-white" style={{ background: `linear-gradient(115deg, ${accent.deep} 0%, #1c1917 70%)` }}>
        <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'repeating-linear-gradient(-45deg, #fff 0 1px, transparent 1px 12px)' }} />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-end sm:px-6 sm:py-14">
          <Avatar name={profile.displayName} url={profile.avatarUrl} className="size-28 text-4xl shadow-2xl sm:size-32" ring={accent.base} />
          <div className="min-w-0 flex-1">
            <p className="mb-1 font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.3em] text-white/60">{t('profile.dossier')}</p>
            <h1 className="truncate pt-2 font-['Big_Shoulders_Display'] text-5xl font-black uppercase leading-none tracking-wide sm:text-7xl">{profile.displayName}</h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/75">
              <span>{t('profile.memberSince', { date: formatDate(locale, profile.memberSince, { month: 'long', year: 'numeric' }) })}</span>
              {favorite && (
                <span className="flex items-center gap-1.5">
                  <FactionEmblem faction={favorite} className="size-5" />{' '}
                  <Rich text={t('profile.favorite')} name={<strong className="text-white">{favorite.name}</strong>} />
                </span>
              )}
            </p>
          </div>
          {isOwn ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex min-h-11 items-center gap-2 self-start rounded-lg border-2 border-white/30 px-4 font-semibold hover:border-white hover:bg-white/10 sm:self-auto"
            >
              <Pencil className="size-4" /> {t('profile.edit')}
            </button>
          ) : friendship === 'friends' || friendship === 'outgoing' ? (
            <span className="flex min-h-11 items-center gap-2 self-start rounded-lg border-2 border-white/30 px-4 font-semibold text-white/80 sm:self-auto">
              <UserCheck className="size-4" /> {friendship === 'friends' ? t('profile.isFriend') : t('profile.requestSent')}
            </span>
          ) : (
            onAddFriend && (
              <button
                type="button"
                onClick={onAddFriend}
                className="flex min-h-11 items-center gap-2 self-start rounded-lg bg-amber-500 px-4 font-semibold text-stone-950 hover:bg-amber-400 sm:self-auto"
              >
                <UserPlus className="size-4" /> {friendship === 'incoming' ? t('profile.acceptRequest') : t('profile.addFriend')}
              </button>
            )
          )}
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6">
        {/* Stats */}
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="mb-4 border-b-4 border-double border-stone-300 pb-2 font-['Big_Shoulders_Display'] text-3xl font-black uppercase tracking-wide dark:border-stone-700">
            {t('profile.stats')}
          </h2>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {tiles.map((tile) => (
              <div key={tile.label} className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                <dt className="text-[11px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">{tile.label}</dt>
                <dd>
                  <span className="font-['IBM_Plex_Mono'] text-3xl font-semibold">{tile.value}</span>
                  {tile.unit && <span className="ml-1 text-xs text-stone-500">{tile.unit}</span>}
                  {tile.bar != null && (
                    <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                      <span className="block h-full rounded-full bg-gradient-to-r from-teal-600 to-teal-400" style={{ width: `${tile.bar}%` }} />
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {badges.length > 0 && <Abzeichen badges={badges} />}

        {/* Per faction */}
        <section aria-labelledby="faction-heading">
          <h2 id="faction-heading" className="mb-4 border-b-4 border-double border-stone-300 pb-2 font-['Big_Shoulders_Display'] text-3xl font-black uppercase tracking-wide dark:border-stone-700">
            {t('profile.byFaction')}
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
                        {t('profile.notPlayed')}
                      </div>
                    )}
                  </div>
                  <span className="col-start-2 whitespace-nowrap font-['IBM_Plex_Mono'] text-sm text-stone-600 sm:col-start-auto sm:text-right dark:text-stone-300">
                    {played ? t('profile.factionLine', { games: fs.gamesPlayed, rate: percent(fs.wins, fs.gamesPlayed) }) : '–'}
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="mt-3 flex items-center gap-2 text-xs text-stone-500">
            <span className="inline-block h-2.5 w-5 rounded-sm bg-stone-500" /> {t('profile.legendWins')}
            <span className="ml-3 inline-block h-2.5 w-5 rounded-sm bg-stone-500/35" /> {t('profile.legendGames')}
          </p>
        </section>

        {/* History */}
        <section aria-labelledby="history-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b-4 border-double border-stone-300 pb-2 dark:border-stone-700">
            <h2 id="history-heading" className="font-['Big_Shoulders_Display'] text-3xl font-black uppercase tracking-wide">
              {t('profile.history')}
            </h2>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <Segmented
                label={t('profile.filterResult')}
                value={resultFilter}
                onChange={setResultFilter}
                options={[
                  { value: 'all', label: t('profile.filterAll') },
                  { value: 'victory', label: t('profile.filterWins') },
                  { value: 'defeat', label: t('profile.filterDefeats') },
                  { value: 'surrendered', label: t('profile.filterSurrendered') },
                ]}
              />
              <label className="relative flex flex-1 items-center sm:flex-none">
                <span className="sr-only">{t('profile.filterFaction')}</span>
                <select
                  value={factionFilter}
                  onChange={(e) => setFactionFilter(e.target.value)}
                  className="h-12 w-full appearance-none rounded-lg border border-stone-300 bg-white pl-3 pr-9 text-sm font-semibold sm:w-48 dark:border-stone-700 dark:bg-stone-900"
                >
                  <option value="all">{t('profile.allFactions')}</option>
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

          {stats.gamesPlayed === 0 ? (
            <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-stone-300 px-6 py-10 text-center dark:border-stone-700">
              <p className="font-['Big_Shoulders_Display'] text-2xl font-black uppercase tracking-wide">{t('profile.noneFinished')}</p>
              <p className="mt-1 text-sm text-stone-500">{t('profile.noneFinishedHint')}</p>
            </div>
          ) : shown.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-stone-300 px-6 py-10 text-center dark:border-stone-700">
              <p className="font-['Big_Shoulders_Display'] text-2xl font-black uppercase tracking-wide">{t('profile.noneFound')}</p>
              <p className="mt-1 text-sm text-stone-500">{t('profile.noneFoundHint')}</p>
              <button
                type="button"
                onClick={() => {
                  setResultFilter('all')
                  setFactionFilter('all')
                }}
                className="mt-4 min-h-11 rounded-lg bg-amber-500 px-4 font-semibold text-stone-950 hover:bg-amber-400"
              >
                {t('profile.resetFilter')}
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
                        {t('profile.historyLine', {
                          placement: h.placement,
                          players: h.playerCount,
                          rounds: h.rounds,
                          date: formatDate(locale, h.endedAt),
                        })}
                      </p>
                      <p className="truncate text-xs text-stone-500"><Rich
                          text={t('profile.opponents')}
                          names={h.opponents.map((o, i) => (
                            <span key={i}>
                              {i > 0 && ', '}
                              {o.id && onOpenPlayer ? (
                                <button
                                  type="button"
                                  onClick={() => onOpenPlayer(o.id!)}
                                  aria-label={t('profile.openProfile', { name: o.name })}
                                  className="font-semibold text-teal-700 underline-offset-2 hover:underline dark:text-teal-400"
                                >
                                  {o.name}
                                </button>
                              ) : o.isAI ? (
                                t('lobby.card.aiName', { name: o.name })
                              ) : (
                                o.name
                              )}
                            </span>
                          ))}
                        /></p>
                    </div>
                    <span className={`shrink-0 rotate-[-6deg] rounded border-[3px] border-double px-2 py-1 font-['Big_Shoulders_Display'] text-sm font-black uppercase tracking-[0.2em] ${stamp.className}`}>
                      {t(stamp.label)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
          {hasMoreHistory && (
            <button
              type="button"
              onClick={onLoadMoreHistory}
              className="mx-auto mt-4 flex min-h-11 items-center gap-2 rounded-lg border-2 border-stone-300 px-5 font-semibold hover:border-teal-500 dark:border-stone-700"
            >
              {t('profile.more')}
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
