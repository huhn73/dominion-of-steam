import type { MessageKey } from '@dos/shared/i18n'
import { Bot, Copy, DoorOpen, Link2, Minus, Plus, RotateCcw, Share2, UserPlus } from 'lucide-react'
import type {
  AiPersonality,
  Difficulty,
  Faction,
  Friend,
  MatchDraft,
  Player,
  Seat,
} from '../types'
import { DIFFICULTY_LABEL, FACTION_HEX, MAX_SEATS, MIN_SEATS, resizeSeats } from './setup'
import { Avatar, FactionEmblem, Field, Segmented, Toggle } from './ui'
import { useT } from '../../../i18n'

interface StepPlayersProps {
  draft: MatchDraft
  you: Player
  factions: Faction[]
  friends: Friend[]
  aiPersonalities: AiPersonality[]
  inviteLink: string
  onChange: (patch: Partial<MatchDraft>) => void
  onPickFriend: (seatIndex: number) => void
  onPickAi: (seatIndex: number) => void
  onCopyInviteLink?: (link: string) => void
  onShareInviteLink?: (link: string) => void
}

const SEAT_KIND_LABEL = {
  you: 'partieSetup.seat.you',
  friend: 'partieSetup.seat.friend',
  invite: 'partieSetup.seat.invite',
  open: 'partieSetup.seat.open',
  ai: 'partieSetup.seat.ai',
  empty: 'partieSetup.seat.empty',
} as const satisfies Record<Seat['kind'], MessageKey>

export function StepPlayers({
  draft,
  you,
  factions,
  friends,
  aiPersonalities,
  inviteLink,
  onChange,
  onPickFriend,
  onPickAi,
  onCopyInviteLink,
  onShareInviteLink,
}: StepPlayersProps) {
  const t = useT()
  const setSeat = (i: number, seat: Seat) => onChange({ seats: draft.seats.map((s, j) => (j === i ? seat : s)) })
  const factionById = (id: string | null | undefined) => factions.find((f) => f.id === id)

  return (
    <div className="space-y-6">
      <Field label={t('partieSetup.seatCount')} hint={t('partieSetup.seatCountHint', { min: MIN_SEATS, max: MAX_SEATS })}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={t('partieSetup.removeSeat')}
            disabled={draft.seats.length <= MIN_SEATS}
            onClick={() => onChange({ seats: resizeSeats(draft.seats, draft.seats.length - 1) })}
            className="flex size-12 items-center justify-center rounded-lg border-2 border-stone-300 bg-white hover:border-teal-500 disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900"
          >
            <Minus className="size-5" />
          </button>
          <span className="w-12 text-center font-['IBM_Plex_Mono'] text-3xl font-semibold" aria-live="polite">
            {draft.seats.length}
          </span>
          <button
            type="button"
            aria-label={t('partieSetup.addSeat')}
            disabled={draft.seats.length >= MAX_SEATS}
            onClick={() => onChange({ seats: resizeSeats(draft.seats, draft.seats.length + 1) })}
            className="flex size-12 items-center justify-center rounded-lg border-2 border-stone-300 bg-white hover:border-teal-500 disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900"
          >
            <Plus className="size-5" />
          </button>
        </div>
      </Field>

      <Field label={t('partieSetup.seats')}>
        <ol className="grid gap-3 md:grid-cols-2">
          {draft.seats.map((seat, i) => {
            const personality = seat.kind === 'ai' ? aiPersonalities.find((p) => p.id === seat.personalityId) : undefined
            const friend = seat.kind === 'friend' ? friends.find((f) => f.id === seat.friendId) : undefined
            const faction =
              seat.kind === 'you' ? factionById(draft.factionId) : personality ? factionById(personality.factionId) : undefined
            const color = faction ? FACTION_HEX[faction.color].base : undefined

            return (
              <li
                key={i}
                className={`relative rounded-xl border-2 bg-white p-4 dark:bg-stone-900 ${
                  seat.kind === 'empty' ? 'border-dashed border-stone-300 dark:border-stone-700' : 'border-stone-200 dark:border-stone-800'
                }`}
              >
                <span className="absolute -left-2 -top-2 flex size-7 items-center justify-center rounded-full bg-stone-900 font-['IBM_Plex_Mono'] text-xs font-semibold text-amber-300 dark:bg-amber-500 dark:text-stone-950">
                  {i + 1}
                </span>

                {seat.kind === 'empty' ? (
                  <>
                    <p className="mb-3 pl-3 text-sm font-semibold text-stone-500">{t('partieSetup.whoTakes')}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { icon: UserPlus, label: t('partieSetup.pick.friend'), onClick: () => onPickFriend(i) },
                        { icon: Link2, label: t('partieSetup.pick.invite'), onClick: () => setSeat(i, { kind: 'invite' }) },
                        { icon: DoorOpen, label: t('partieSetup.pick.open'), onClick: () => setSeat(i, { kind: 'open' }) },
                        { icon: Bot, label: t('partieSetup.pick.ai'), onClick: () => onPickAi(i) },
                      ].map(({ icon: Icon, label, onClick }) => (
                        <button
                          key={label}
                          type="button"
                          onClick={onClick}
                          className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-stone-300 text-sm font-semibold transition hover:border-teal-500 hover:bg-teal-50 hover:text-teal-800 dark:border-stone-700 dark:hover:bg-teal-950 dark:hover:text-teal-200"
                        >
                          <Icon className="size-4" /> {label}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-start gap-3 pl-2">
                    {seat.kind === 'you' && <Avatar name={you.name} url={you.avatarUrl} color={color} />}
                    {friend && <Avatar name={friend.name} url={friend.avatarUrl} />}
                    {personality && <Avatar name={personality.name} url={personality.portraitUrl} color={color} />}
                    {(seat.kind === 'invite' || seat.kind === 'open') && (
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-teal-500 text-teal-600">
                        {seat.kind === 'invite' ? <Link2 className="size-5" /> : <DoorOpen className="size-5" />}
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
                        {t(SEAT_KIND_LABEL[seat.kind])}
                      </p>
                      <p className="truncate font-['Big_Shoulders_Display'] text-xl font-extrabold uppercase tracking-wide">
                        {seat.kind === 'you' && you.name}
                        {friend?.name}
                        {personality?.name}
                        {seat.kind === 'invite' && t('partieSetup.linkHolder')}
                        {seat.kind === 'open' && t('partieSetup.anyPlayer')}
                      </p>
                      {faction ? (
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-stone-600 dark:text-stone-300">
                          <FactionEmblem faction={faction} className="size-5" />
                          {faction.shortName}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-sm text-stone-500">
                          {seat.kind === 'you' ? t('partieSetup.noFaction') : t('partieSetup.choosesOwn')}
                        </p>
                      )}
                      {seat.kind === 'ai' && (
                        <div className="mt-3">
                          <Segmented<Difficulty>
                            label={t('partieSetup.difficultyOf', { name: personality?.name ?? '' })}
                            value={seat.difficulty}
                            options={(['easy', 'normal', 'hard'] as const).map((d) => ({ value: d, label: t(DIFFICULTY_LABEL[d]) }))}
                            onChange={(d) => setSeat(i, { ...seat, difficulty: d })}
                          />
                        </div>
                      )}
                    </div>

                    {seat.kind !== 'you' && (
                      <button
                        type="button"
                        onClick={() => setSeat(i, { kind: 'empty' })}
                        className="flex min-h-10 items-center gap-1 rounded-md px-2 text-xs font-semibold uppercase tracking-wide text-stone-500 hover:bg-stone-100 hover:text-teal-700 dark:hover:bg-stone-800 dark:hover:text-teal-300"
                      >
                        <RotateCcw className="size-3.5" /> {t('partieSetup.change')}
                      </button>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      </Field>

      <Field label={t('partieSetup.inviteLink')} hint={t('partieSetup.inviteLinkHint')}>
        <div className="flex flex-col gap-2 sm:flex-row">
          <code className="flex min-h-12 flex-1 items-center truncate rounded-lg border-2 border-dashed border-stone-300 bg-stone-100 px-4 font-['IBM_Plex_Mono'] text-sm dark:border-stone-700 dark:bg-stone-950">
            {inviteLink}
          </code>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(inviteLink).catch(() => {})
                onCopyInviteLink?.(inviteLink)
              }}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg border-2 border-stone-300 px-4 font-semibold hover:border-teal-500 sm:flex-none dark:border-stone-700"
            >
              <Copy className="size-4" /> {t('partieSetup.copy')}
            </button>
            <button
              type="button"
              onClick={() => onShareInviteLink?.(inviteLink)}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 font-semibold text-white hover:bg-teal-500 sm:flex-none"
            >
              <Share2 className="size-4" /> {t('partieSetup.share')}
            </button>
          </div>
        </div>
      </Field>

      <Field label={t('partieSetup.freeSeats')}>
        <Toggle
          checked={draft.fillEmptyWithAI}
          onChange={(v) => onChange({ fillEmptyWithAI: v })}
          label={t('partieSetup.fill')}
          description={t('partieSetup.fillHint')}
        />
      </Field>
    </div>
  )
}
