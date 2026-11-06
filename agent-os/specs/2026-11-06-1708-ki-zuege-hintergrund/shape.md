# KI-Züge als Hintergrundjob — Shaping-Notizen

## Umfang

KI-Züge laufen nicht mehr synchron in der gesperrten Transaktion des menschlichen Befehls, sondern danach in einem Worker-Thread. Das Zugende kommt sofort zurück, nach jedem KI-Zug geht ein SSE-Signal an alle Teilnehmer, die Kopfzeile zeigt „‹Name› (KI) zieht …“.

## Entscheidungen

- Worker-Thread statt Haupt-Thread: Eine rechnende KI (bis 10 s je Zug) blockiert sonst den ganzen Server, auch andere Partien und die SSE-Herzschläge.
- Optimistisch speichern: KI rechnet ohne Sperre, gespeichert wird unter `lockMatch` nur, wenn `matches.version` unverändert ist; sonst verwerfen und neu einplanen.
- Ein KI-Zug je Schritt und Signal: Der Client sieht, welche KI gerade zieht.
- Spalte `ai_pending` als dauerhafte Warteschlange: `recover()` beim Start und in jedem Sweep, kein eigener Auftragstisch.
- Tutorial und Dev-Helfer „Für andere weiterspielen“ bleiben synchron.
- Anzeige: Name der KI am Zug in der Kopfzeile; Rundenbericht und Wiedergabe wie bisher.

## Nachträge aus der Umsetzung

- „Du bist dran“ nach den KI-Zügen nur, wenn der Mensch keinen offenen Event-Stream hat (`hub.isConnected`). Bisher bekam der Handelnde keine Nachricht, weil er in der App war; ohne diese Regel käme sie jetzt bei jedem Solo-Zug.
- Beim Herunterfahren (`close()`) verwirft ein laufender Schritt sein Ergebnis, statt einen leeren KI-Zug zu speichern; `recover()` spielt ihn nach dem Neustart.
- Ein Worker, der nach 60 s nicht antwortet, wird beendet; die KI beendet dann ihren Zug.
- Testoption `play` ersetzt die Rechnung (Versionskonflikt, KI-Fehler).
- Der Profil-Test las Plätze ohne Sortierung; mit parallelen Hintergrundschreibern wurde die Reihenfolge zufällig, jetzt nach Platz sortiert.
- Messung lokal (riesige Karte, 4 KIs „schwer“, 12 Runden): Zugende 10–20 ms statt Wartezeit auf alle KIs, `/api/health` währenddessen unter 1 ms.

## Kontext

- **Bilder:** keine
- **Vorlagen:** Worker-Pool in `packages/sim`, Sweeper, Signale, Notifier mit `kick`
- **Produkt:** Roadmap Phase 2, Folge der Echtzeit-Spec (`2026-11-06-1640-echtzeit-sse`); Idee aus der Kartengrößen-Spec (KI-Arbeitsbudget ≤ 10 s je Zug)

## Standards

Keine (`agent-os/standards/` existiert nicht).
