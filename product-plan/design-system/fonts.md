# Schriften

## Google-Fonts-Import

Im `<head>` der Anwendung:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Big+Shoulders+Display:wght@700;800;900&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet">
```

## Verwendung

- **Überschriften, Navigation, Buttons:** Big Shoulders Display (700–900, meist Großbuchstaben mit weiter Laufweite)
- **Fließtext und Oberfläche:** Barlow (400–700)
- **Zahlen, Werte, Codes, Rundenzähler:** IBM Plex Mono (400, 600)

Die Komponenten setzen die Schriften über Tailwind-Klassen wie `font-['Big_Shoulders_Display']`. Wer stattdessen Theme-Variablen definiert (z. B. `--font-heading`), kann diese Klassen später zentral ersetzen.
