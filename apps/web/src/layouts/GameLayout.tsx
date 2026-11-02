import { useState } from 'react'
import { Outlet, useNavigate, useParams } from 'react-router'
import { AppShell, GameMenu } from '../shell'
import { useCurrentUser, useLogout } from '../data/session'
import { gameHeaderFor, useMatchView } from '../data/match'
import { useSurrender } from '../data/lobby'
import { ApiRequestError } from '../data/api'
import { routes } from '../routes'
import { SurrenderSheet } from '../sections/lobby/components'
import type { Match } from '../sections/lobby/types'
import { Toast, useToast } from '../pages/shared/toast'
import { MuteButton } from '../settings/MuteButton'

export function GameLayout() {
  const navigate = useNavigate()
  const { matchId = '' } = useParams()
  const user = useCurrentUser()
  const logout = useLogout()
  const { data: view } = useMatchView(matchId)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmSurrender, setConfirmSurrender] = useState(false)
  const surrender = useSurrender(matchId)
  const toast = useToast()
  const me = view?.participants.find((p) => p.isYou)
  // Only while the match runs and the own faction is still played by the player
  const canSurrender = !!view && !view.result && me?.status === 'active' && !me.isAI

  const exitGame = () => navigate(routes.lobby)

  return (
    <AppShell
      mode="game"
      navigationItems={[]}
      user={user}
      gameHeader={gameHeaderFor(view)}
      onExitGame={exitGame}
      onOpenGameMenu={() => setMenuOpen((open) => !open)}
      onOpenProfile={() => navigate(routes.profile)}
      onOpenSettings={() => navigate(routes.settings)}
      onOpenLegal={() => navigate(routes.imprint)}
      onOpenAdmin={user?.isAdmin ? () => navigate(routes.admin) : undefined}
      onLogout={() => void logout()}
      headerExtra={<MuteButton />}
    >
      <Outlet />
      <GameMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onOpenSettings={() => navigate(routes.settings)}
        onExitGame={exitGame}
        onSurrender={canSurrender ? () => setConfirmSurrender(true) : undefined}
      />
      {confirmSurrender && view && (
        <SurrenderSheet
          // The dialog only needs name and round of the match
          match={{ name: view.match.name, round: view.match.round } as Match}
          onClose={() => setConfirmSurrender(false)}
          onConfirm={() => {
            setConfirmSurrender(false)
            surrender.mutate(undefined, {
              onSuccess: () =>
                void navigate(routes.lobby, {
                  state: { notice: 'Du hast aufgegeben. Eine KI führt deine Fraktion weiter.' },
                }),
              onError: (e) =>
                toast.error(
                  e instanceof ApiRequestError ? e : null,
                  'Aufgeben hat nicht geklappt.',
                ),
            })
          }}
        />
      )}
      {toast.toast && <Toast toast={toast.toast} onClose={toast.close} />}
    </AppShell>
  )
}
