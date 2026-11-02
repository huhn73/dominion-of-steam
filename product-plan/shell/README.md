# Anwendungs-Shell

## Gestaltungsabsicht

Die Shell hat zwei Modi:

- **Menü-Modus** (Lobby, Neue Partie, Fraktionen, Profil, Einstellungen): schlanke Top-Navigation im Dieselpunk-Stil mit Wortmarke „DOMINION OF STEAM“, Messing-Zahnrad, amber hervorgehobenem aktivem Punkt und Benutzermenü. Auf dem Smartphone wandern die Navigationspunkte in eine fixierte Tab-Leiste am unteren Rand.
- **Spiel-Modus** (Spielfeld): minimale Kopfleiste mit Zurück zur Lobby, Partiename und Runde, Zugstatus (z. B. „Dein Zug · Frist So., 19:00“ mit pulsierendem Punkt), Spielmenü-Button und Benutzermenü. Darunter füllt das Spielfeld die gesamte Höhe ohne Scrollen.

## Navigation

- **Lobby:** Startseite, mit Badge für die Anzahl der Partien, in denen man am Zug ist
- **Neue Partie:** Partie-Setup
- **Fraktionen:** Kompendium

Nicht in der Navigation:
- Das **Spielfeld** wird über eine Partie in der Lobby geöffnet und im Spiel-Modus angezeigt.
- **Profil** und **Einstellungen** erreicht man über das Benutzermenü.

## Komponenten

- `AppShell`: Rahmen mit `mode="menu" | "game"`. Props: `navigationItems` (Label, href, isActive, icon, badge), `user`, `gameHeader` (title, status, isYourTurn) sowie die Callbacks `onNavigate`, `onLogout`, `onOpenProfile`, `onOpenSettings`, `onExitGame` und `onOpenGameMenu`.
- `MainNav`: Navigation als `variant="top"` (Desktop) oder `variant="tabbar"` (Smartphone)
- `UserMenu`: Avatar (Bild oder Initialen) mit Dropdown für Profil, Einstellungen und Abmelden. Schließt bei Klick außerhalb und mit Escape.

## Hinweise

- Inhalte unter der mobilen Tab-Leiste brauchen unten Abstand. Die Shell setzt `pb-[calc(4rem+env(safe-area-inset-bottom))]` am Inhaltsbereich. Fixierte Fußleisten der Bereiche (Partie-Setup, Warteraum) sitzen deshalb auf dem Smartphone bei `bottom-[calc(4rem+…)]`.
- Safe-Area-Abstände (`env(safe-area-inset-*)`) sind für Smartphones mit Notch berücksichtigt.

## Visuelle Referenz

`screenshot.png` zeigt den Menü-Modus. Der Spiel-Modus ist auf dem Screenshot des Spielfelds zu sehen (`sections/spielfeld-and-zuge/screenshot.png`).
