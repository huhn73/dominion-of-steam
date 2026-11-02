import { useEffect, useRef } from 'react'
import type { LobbyData } from '@dos/shared/lobby'
import { useAudio } from './AudioProvider'

const HOUR = 3600_000

interface Snapshot {
  invitations: Set<string>
  yourTurn: Set<string>
  deadlineSoon: Set<string>
}

/** Matches on your move whose deadline is closer than the warning threshold */
function deadlineSoonIds(data: LobbyData) {
  const now = Date.parse(data.now)
  return data.matches
    .filter(
      (m) =>
        m.status === 'yourTurn' &&
        m.turnDeadline &&
        Date.parse(m.turnDeadline) - now < data.deadlineWarningHours * HOUR,
    )
    .map((m) => m.id)
}

const snapshotOf = (data: LobbyData): Snapshot => ({
  invitations: new Set(data.invitations.map((i) => i.id)),
  yourTurn: new Set(data.matches.filter((m) => m.status === 'yourTurn').map((m) => m.id)),
  deadlineSoon: new Set(deadlineSoonIds(data)),
})

/** What is new in `next` compared with `prev` */
export function lobbyChanges(prev: LobbyData, next: LobbyData) {
  const a = snapshotOf(prev)
  const b = snapshotOf(next)
  const added = (x: Set<string>, y: Set<string>) => [...y].filter((id) => !x.has(id))
  return {
    invitations: added(a.invitations, b.invitations),
    yourTurn: added(a.yourTurn, b.yourTurn),
    deadlineSoon: added(a.deadlineSoon, b.deadlineSoon),
  }
}

/**
 * Notification sounds from the lobby polling: a new invitation, a match that became your
 * turn, a deadline that got close. The first answer after loading plays nothing.
 */
export function useLobbySounds(data: LobbyData | undefined) {
  const { sfx } = useAudio()
  const prev = useRef<LobbyData | null>(null)
  useEffect(() => {
    if (!data) return
    const before = prev.current
    prev.current = data
    if (!before || before === data) return
    const diff = lobbyChanges(before, data)
    if (diff.invitations.length) sfx('notify-invite')
    else if (diff.yourTurn.length) sfx('notify-your-turn')
    else if (diff.deadlineSoon.length) sfx('notify-deadline')
  }, [data, sfx])
}
