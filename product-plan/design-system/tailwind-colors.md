# Tailwind-Farbkonfiguration

Die Komponenten nutzen die eingebauten Tailwind-Paletten direkt (z. B. `bg-amber-500`). Eine eigene Farbkonfiguration ist nicht nötig. Die Komponenten sind mit Tailwind CSS v4 gebaut. Der dunkle Modus nutzt `dark:`-Varianten über eine Klasse `.dark` an einem übergeordneten Element.

## Farbwahl

- **Primär:** `amber` (Messing). Hauptbuttons wie „Weiterspielen“, „Zug beenden“, „Partie erstellen“, aktive Navigation, Auswahl
- **Sekundär:** `teal` (Patina). Hover, Fokusrahmen, Hinweise, Spielweise-Tags, „Bereit“-Status, Sieg-Stempel
- **Neutral:** `stone` (Ruß und Stahl). Hintergründe, Text, Rahmen
- **Warnung und Gefahr:** `rose`. Frist-Warnungen, Angriffsziele, Niederlage, Aufgeben, Konto löschen

## Fraktionsfarben

Fraktionen haben je eine Tailwind-Farbe (`amber`, `rose`, `sky`, `lime`). Die Komponenten setzen sie als Hex-Werte per `style` ein, siehe `FACTION_HEX` bzw. `PARTICIPANT_HEX` in den Bereichskomponenten.

## Verwendungsbeispiele

- Hauptbutton: `bg-gradient-to-b from-amber-400 to-amber-600 text-stone-950`
- Sekundärer Button: `bg-teal-600 hover:bg-teal-500 text-white`
- Tag: `bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-300`
- Neutraler Text: `text-stone-600 dark:text-stone-400`
- Rahmen im Formularstil: `border-b-4 border-double border-stone-300 dark:border-stone-700`

## Benötigte Erweiterungen

- `tw-animate-css` für `animate-in`, `fade-in`, `slide-in-from-*` (Ein-Animationen von Karten, Dialogen und Toasts)
