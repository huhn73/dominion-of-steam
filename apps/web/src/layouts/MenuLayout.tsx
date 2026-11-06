import { Outlet, useLocation, useNavigate } from 'react-router'
import { Castle, Flag, Swords } from 'lucide-react'
import { AppShell, type NavigationItem } from '../shell'
import { useCurrentUser, useLogout, useYourTurnCount } from '../data/session'
import { useLobby } from '../data/lobby'
import { useLobbySounds } from '../audio/useLobbySounds'
import { MuteButton } from '../settings/MuteButton'
import { MenuFooter } from '../shell/MenuFooter'
import { NewsDialog } from '../shell/NewsDialog'
import { routes } from '../routes'

function isActive(pathname: string, href: string) {
  if (href === routes.lobby) return pathname === href
  // Einheiten gehören zum Kompendium „Fraktionen“
  if (href === routes.factions && pathname.startsWith('/einheiten/')) return true
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function MenuLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const user = useCurrentUser()
  const logout = useLogout()
  const yourTurnCount = useYourTurnCount()
  // Notification sounds for new invitations and turns (the lobby polls on every menu page)
  useLobbySounds(useLobby().data)

  const navigationItems: NavigationItem[] = [
    { label: 'Lobby', href: routes.lobby, icon: Castle, badge: yourTurnCount },
    { label: 'Neue Partie', href: routes.newMatch, icon: Swords },
    { label: 'Fraktionen', href: routes.factions, icon: Flag },
  ].map((item) => ({ ...item, isActive: isActive(pathname, item.href) }))

  return (
    <AppShell
      navigationItems={navigationItems}
      user={user}
      onNavigate={(href) => navigate(href)}
      onOpenProfile={() => navigate(routes.profile)}
      onOpenSettings={() => navigate(routes.settings)}
      onOpenLegal={() => navigate(routes.imprint)}
      onOpenAdmin={user?.isAdmin ? () => navigate(routes.admin) : undefined}
      onLogout={() => void logout()}
      headerExtra={<MuteButton />}
      footer={<MenuFooter />}
    >
      <Outlet />
      <NewsDialog />
    </AppShell>
  )
}
