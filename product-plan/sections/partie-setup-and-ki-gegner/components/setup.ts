import type {
  AiPersonality,
  FactionColor,
  MatchDraft,
  MapSizeOption,
  Seat,
} from '../types'

// Typography: Big Shoulders Display (headings), Barlow (body), IBM Plex Mono (codes, numbers)

export const STEPS = ['Modus & Regeln', 'Deine Fraktion', 'Gegner & Mitspieler', 'Karte', 'Übersicht'] as const

/** Step indices, so the order lives in one place */
export const STEP = { rules: 0, faction: 1, players: 2, map: 3, summary: 4 } as const

export const FACTION_HEX: Record<FactionColor, { base: string; deep: string }> = {
  amber: { base: '#f59e0b', deep: '#78350f' },
  rose: { base: '#f43f5e', deep: '#881337' },
  sky: { base: '#0ea5e9', deep: '#0c4a6e' },
  lime: { base: '#84cc16', deep: '#365314' },
  violet: { base: '#8b5cf6', deep: '#4c1d95' },
  orange: { base: '#f97316', deep: '#7c2d12' },
}

export const DIFFICULTY_LABEL = { easy: 'Leicht', normal: 'Normal', hard: 'Schwer' } as const

export const MIN_SEATS = 2
export const MAX_SEATS = 6

export function resizeSeats(seats: Seat[], count: number): Seat[] {
  if (count < seats.length) return seats.slice(0, count)
  return [...seats, ...Array.from({ length: count - seats.length }, () => ({ kind: 'empty' }) as Seat)]
}

/** Factions taken by AI seats, keyed by faction id */
export function aiFactions(seats: Seat[], personalities: AiPersonality[]) {
  const taken = new Map<string, AiPersonality>()
  for (const s of seats) {
    if (s.kind !== 'ai') continue
    const p = personalities.find((x) => x.id === s.personalityId)
    if (p) taken.set(p.factionId, p)
  }
  return taken
}

/** Why the player can't leave a step yet, or null */
export function stepBlocker(step: number, draft: MatchDraft, personalities: AiPersonality[]): string | null {
  if (step === STEP.rules && !draft.name.trim()) return 'Gib der Partie einen Namen.'
  if (step === STEP.faction && !draft.factionId) return 'Wähle deine Fraktion.'
  if (step === STEP.map && !draft.map.seed.trim()) return 'Gib einen Kartencode ein oder würfle einen neuen.'
  if (step === STEP.players) {
    if (!draft.fillEmptyWithAI && draft.seats.some((s) => s.kind === 'empty'))
      return 'Lege für jeden Platz fest, wer ihn besetzt, oder lass freie Plätze mit KI auffüllen.'
    if (!draft.allowDuplicateFactions) {
      const factions = draft.seats.flatMap((s) =>
        s.kind === 'ai' ? [personalities.find((p) => p.id === s.personalityId)?.factionId] : [],
      )
      if (new Set(factions).size !== factions.length) return 'Zwei KI-Gegner führen dieselbe Fraktion. Doppelte Fraktionen sind nicht erlaubt.'
      if (draft.factionId && factions.includes(draft.factionId))
        return 'Ein KI-Gegner führt deine Fraktion. Wähle eine andere KI-Persönlichkeit oder erlaube doppelte Fraktionen.'
    }
  }
  return null
}

export function summaryWarnings(draft: MatchDraft, size: MapSizeOption | undefined): string[] {
  const warnings: string[] = []
  const [, maxPlayers] = size?.recommendedPlayers ?? [2, 6]
  if (size && draft.seats.length > maxPlayers)
    warnings.push(`${draft.seats.length} Spieler sind viel für die Kartengröße „${size.label}“ (empfohlen bis ${maxPlayers}).`)
  const pending = draft.seats.filter((s) => s.kind === 'invite' || s.kind === 'open' || s.kind === 'friend').length
  if (pending > 0 && !draft.fillEmptyWithAI)
    warnings.push('Die Partie wartet in der Lobby, bis alle eingeladenen und offenen Plätze besetzt sind.')
  if (draft.mode === 'live' && pending > 0)
    warnings.push('Live-Partien starten erst, wenn alle Mitspieler beigetreten sind.')
  if (draft.seats.every((s) => s.kind === 'you' || s.kind === 'ai' || (s.kind === 'empty' && draft.fillEmptyWithAI)) && draft.seats.length > 1)
    warnings.push('Nur KI-Gegner: Die Partie startet sofort als Solo-Partie.')
  return warnings
}

export function randomSeed() {
  const words = ['KOHLE', 'NIETE', 'KESSEL', 'DAMPF', 'ZECHE', 'HAFEN', 'SCHLOT', 'MESSING']
  return `${words[Math.floor(Math.random() * words.length)]}-${Math.floor(1000 + Math.random() * 9000)}`
}
