import type { RouteObject } from 'react-router'
import { MenuLayout } from './layouts/MenuLayout'
import { GameLayout } from './layouts/GameLayout'
import { LobbyPage } from './pages/lobby/LobbyPage'
import { WaitingRoomPage } from './pages/lobby/WaitingRoomPage'
import { InvitePage } from './pages/lobby/InvitePage'
import { NotFoundPage } from './pages/pages'
import { ProfilePage } from './pages/profil/ProfilePage'
import { SettingsPage } from './pages/profil/SettingsPage'
import { NewMatchPage } from './pages/partie-setup/NewMatchPage'
import { CompendiumPage } from './pages/kompendium/CompendiumPage'
import { FactionPage } from './pages/kompendium/FactionPage'
import { UnitTypePage } from './pages/kompendium/UnitTypePage'
import { MatchPage } from './pages/MatchPage'
import { routes } from './routes'
import { RequireAuth } from './auth/RequireAuth'
import { LoginPage } from './pages/anmeldung/LoginPage'
import { RegisterPage } from './pages/anmeldung/RegisterPage'
import { ForgotPasswordPage } from './pages/anmeldung/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/anmeldung/ResetPasswordPage'
import { ImpressumPage } from './pages/rechtliches/ImpressumPage'
import { DatenschutzPage } from './pages/rechtliches/DatenschutzPage'
import { LizenzenPage } from './pages/rechtliches/LizenzenPage'

export const routeConfig: RouteObject[] = [
  { path: routes.login, element: <LoginPage /> },
  { path: routes.register, element: <RegisterPage /> },
  { path: routes.forgotPassword, element: <ForgotPasswordPage /> },
  { path: routes.resetPassword, element: <ResetPasswordPage /> },
  // Rechtliches ist auch ohne Anmeldung erreichbar
  { path: routes.imprint, element: <ImpressumPage /> },
  { path: routes.privacy, element: <DatenschutzPage /> },
  { path: routes.licenses, element: <LizenzenPage /> },
  {
    // Alle übrigen Seiten nur mit Anmeldung
    element: <RequireAuth />,
    children: [
      {
        element: <MenuLayout />,
        children: [
          { path: routes.lobby, element: <LobbyPage /> },
          { path: routes.newMatch, element: <NewMatchPage /> },
          { path: routes.waitingRoom(':matchId'), element: <WaitingRoomPage /> },
          { path: routes.invite(':token'), element: <InvitePage /> },
          { path: routes.factions, element: <CompendiumPage /> },
          { path: routes.faction(':factionId'), element: <FactionPage /> },
          { path: '/einheiten/:unitTypeId', element: <UnitTypePage /> },
          { path: routes.profile, element: <ProfilePage /> },
          { path: routes.settings, element: <SettingsPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      {
        element: <GameLayout />,
        children: [{ path: routes.match(':matchId'), element: <MatchPage /> }],
      },
    ],
  },
]
