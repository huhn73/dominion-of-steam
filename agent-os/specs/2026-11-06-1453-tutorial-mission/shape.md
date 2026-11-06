# Tutorial-Mission „Erste Schritte“: Shaping-Notizen

## Umfang

Geführte Mini-Partie auf einer handgebauten, immer gleichen Karte gegen einen passiven Gegner. Sie erklärt die Bedienung (Auswählen, Bewegen, Kamera, Nächste Einheit, Zugende, Rundenbericht, Produktion, Frachter, Flugzeuge, Angriff) und das Ziel (Hauptstadt des Gegners erobern bzw. alle Gegner ausschalten). Jeder Schritt prüft, ob die Aktion ausgeführt wurde. Start über eine Karte in der Lobby; neue Konten bekommen das Tutorial beim ersten Login angeboten.

## Entscheidungen

- **Form:** geführte Mini-Partie statt Coachmarks in einer echten Partie. Verworfen: Overlay in der ersten Partie; beides.
- **Führung:** Schritte mit Zielprüfung, freies Handeln bleibt möglich, „Überspringen“ und „Tutorial beenden“ jederzeit. Verworfen: harte Sperre; reine Texttafeln.
- **Karte:** handgebaut (Muster `engine/demo.ts`), etwa 16×12, Heimatinsel, neutrale Stadt, Feindinsel. Verworfen: Generator mit festem Seed (Felder nicht gezielt gestaltbar).
- **Inhalte:** Grundbedienung, Städte & Produktion, See & Luft, Kampf & Siegziel.
- **Gegner:** passive KI (zieht nicht, produziert nicht, kapituliert nicht), damit das Tutorial nicht scheitert. Verworfen: KI „leicht“.
- **Einstieg:** Lobby-Karte (starten/fortsetzen/nochmal) und einmaliges Erstangebot für Konten ohne Partien. Nicht im Partie-Setup.
- **Statistik:** Tutorial-Partien zählen nirgends (Profil, Verlauf, Admin, Benachrichtigungen); nur `tutorial.completed` in den Spieler-Einstellungen.
- **Fortschritt:** serverseitig in `GameState.tutorial.step`, monoton, von der Engine nach jedem Command geprüft.

## Kontext

- **Visuals:** keine.
- **Referenzen:** siehe `references.md`.
- **Produktbezug:** `mission.md` – Zielgruppe Strategie-Veteranen, also kurz und zügig; Bedienung mit Maus und Touch, also Panel einklappbar und mobil tauglich. Roadmap Phase 2.

## Angewandte Standards

Keine definierten Standards in `agent-os/standards/`; Repo-Konventionen, siehe `standards.md`.
