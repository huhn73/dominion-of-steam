# Echtzeit per SSE — Shaping-Notizen

## Umfang

Der Server meldet Änderungen an Lobby, Warteraum und Partie sofort; Polling bleibt als Rückfall.

## Entscheidungen

- SSE statt WebSockets: Nur der Weg Server → Client ist nötig, Befehle laufen weiter per POST. Das funktioniert ohne Zusatzpaket durch Caddy und den Vite-Proxy.
- Der Server schickt nur Themen, keine Daten. Der Client lädt über die bestehenden Endpunkte nach, so bleibt der Kriegsnebel allein in `projectView`.
- Postgres LISTEN/NOTIFY statt eines Busses im Prozess: Zustellung erst beim Commit (kein Signal für verworfene Änderungen), und es funktioniert auch mit mehreren Server-Prozessen.
- Der Handelnde bekommt für seinen eigenen Befehl kein `match`-Signal, die neue Sicht steht schon in der Antwort (auch wegen der zurückgehaltenen Sicht während der Kampfsequenz).
- Mit Stream fragt nur die Lobby noch alle 2 Minuten nach, als Sicherheitsnetz.

## Kontext

- **Visuals:** keine
- **Referenzen:** siehe `references.md`
- **Produktausrichtung:** Live-Partien laut Tech-Stack; Mehrspieler soll sich ohne Verzögerung anfühlen

## Angewandte Standards

Keine (`agent-os/standards/` existiert nicht).
