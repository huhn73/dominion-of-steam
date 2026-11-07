import type { LobbyData, Match, WaitingRoomData } from '@dos/shared/lobby'

/** Lobby test data after product-plan/sections/lobby-and-multiplayer/tests.md (now fixed) */
export const NOW = '2026-10-30T13:00:00Z'

const factions: LobbyData['factions'] = [
  {
    id: 'eisenbund',
    name: 'Eisenbund von Valdrin',
    shortName: 'Eisenbund',
    color: 'amber',
    emblemUrl: null,
  },
  {
    id: 'nordmark',
    name: 'Nordmark-Kollektiv',
    shortName: 'Nordmark',
    color: 'sky',
    emblemUrl: null,
  },
  {
    id: 'aurelia',
    name: 'Aurelische Republik',
    shortName: 'Aurelia',
    color: 'rose',
    emblemUrl: null,
  },
]

const you = (cityCount = 5) => ({
  id: 'p1',
  name: 'Björn',
  avatarUrl: null,
  isYou: true,
  isAI: false,
  aiDifficulty: null,
  factionId: 'eisenbund',
  status: 'active' as const,
  cityCount,
})

export const urgentMatch: Match = {
  id: 'm-salz',
  name: 'Salz und Schwefel',
  status: 'yourTurn',
  round: 31,
  turnDeadline: '2026-10-30T14:40:00Z',
  currentParticipantId: 'p1',
  remindedAt: null,
  isHost: false,
  participants: [
    you(),
    {
      id: 'lena',
      name: 'Lena Hartmann',
      avatarUrl: null,
      isYou: false,
      isAI: false,
      aiDifficulty: null,
      factionId: 'aurelia',
      status: 'active',
      cityCount: 4,
    },
  ],
  rules: {
    mode: 'async',
    turnLimitLabel: { key: 'setup.hours', params: { count: 12 } },
    victoryCondition: { key: 'setup.victory.elimination.label' },
    allowDuplicateFactions: false,
  },
  map: {
    sizeLabel: { key: 'setup.size.small' },
    width: 14,
    height: 10,
    landShare: 50,
    seed: 'SALZ-0031',
  },
  miniMap: ['~~~~~~', '~00.1~', '~0011~', '~~~~~~'],
}

export const othersTurnMatch: Match = {
  ...urgentMatch,
  id: 'm-nordwind',
  name: 'Nordwind',
  status: 'othersTurn',
  round: 9,
  turnDeadline: '2026-10-31T20:15:00Z',
  currentParticipantId: 'lena',
  remindedAt: null,
}

export const waitingMatch: Match = {
  ...urgentMatch,
  id: 'm-kohle2',
  name: 'Die Kohleinseln II',
  status: 'waitingForPlayers',
  round: 0,
  turnDeadline: null,
  currentParticipantId: null,
  isHost: true,
  participants: [you(0)],
  miniMap: [],
  waitingFor: 2,
}

export function lobbyData(patch: Partial<LobbyData> = {}): LobbyData {
  return {
    tutorial: {
      matchId: null,
      status: null,
      step: 0,
      total: 12,
      completed: true,
      dismissed: false,
    },
    now: NOW,
    you: { id: 'p1', name: 'Björn', avatarUrl: null },
    deadlineWarningHours: 3,
    factions,
    matches: [othersTurnMatch, urgentMatch, waitingMatch],
    invitations: [
      {
        id: 'inv-1',
        matchName: 'Inselhüpfen',
        from: { id: 'jonas', name: 'Jonas Vogt', avatarUrl: null },
        mode: 'live',
        turnLimitLabel: { key: 'setup.minutes', params: { count: 2 } },
        mapSizeLabel: { key: 'setup.size.small' },
        seatsTaken: 2,
        seatsTotal: 3,
        sentAt: '2026-10-30T12:41:00Z',
        message: 'Kurze Runde heute Abend?',
      },
    ],
    openMatches: [
      {
        id: 'open-1',
        name: 'Anfänger willkommen',
        host: 'Kalle Rauch',
        mode: 'async',
        turnLimitLabel: { key: 'setup.hours', params: { count: 24 } },
        mapSizeLabel: { key: 'setup.size.medium' },
        victoryCondition: { key: 'setup.victory.capitals.label' },
        seatsTaken: 2,
        seatsTotal: 4,
        availableFactionIds: ['nordmark'],
      },
    ],
    finishedMatches: [
      {
        id: 'fin-1',
        name: 'Rußige Pfade',
        endedAt: '2026-10-27T21:10:00Z',
        result: 'victory',
        placement: 1,
        playerCount: 3,
        rounds: 48,
        winner: 'Björn',
        factionId: 'eisenbund',
      },
    ],
    ...patch,
  }
}

export const emptyLobby = () =>
  lobbyData({ matches: [], invitations: [], openMatches: [], finishedMatches: [] })

export function roomData(patch: Partial<WaitingRoomData['room']> = {}): WaitingRoomData {
  return {
    status: 'waiting',
    factions,
    room: {
      matchId: 'm-kohle2',
      matchName: 'Die Kohleinseln II',
      isHost: true,
      inviteLink: 'http://localhost/einladung/K7Q-2XM-H9P',
      rules: {
        mode: 'async',
        turnLimitLabel: { key: 'setup.hours', params: { count: 24 } },
        victoryCondition: { key: 'setup.victory.capitals.label' },
        allowDuplicateFactions: false,
      },
      map: {
        sizeLabel: { key: 'setup.size.medium' },
        width: 18,
        height: 12,
        landShare: 45,
        seed: 'KOHLE-5530',
      },
      fillEmptyWithAI: true,
      seats: [
        {
          kind: 'player',
          status: 'ready',
          name: 'Björn',
          avatarUrl: null,
          isYou: true,
          isHost: true,
          factionId: 'eisenbund',
        },
        {
          kind: 'player',
          status: 'joined',
          name: 'Jonas Vogt',
          avatarUrl: null,
          isYou: false,
          isHost: false,
          factionId: 'nordmark',
        },
        {
          kind: 'open',
          status: 'pending',
          name: null,
          avatarUrl: null,
          isYou: false,
          isHost: false,
          factionId: null,
        },
      ],
      ...patch,
    },
  }
}
