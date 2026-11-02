# Audio-Brief: Dominion of Steam

Dieser Brief beschreibt Musik, Umgebungsgeräusche und Soundeffekte. Jeder Eintrag hat einen englischen Prompt für Musik- bzw. Sound-Generatoren. Einheiten-Stimmen gibt es bewusst nicht. Die Einheiten „sprechen“ durch Maschinengeräusche.

## Klangwelt

- **Grundidee:** Die Welt klingt nach Kohle, Dampf und Stahl. Maschinen sind das Schlagzeug, Blech ist die Stimme.
- **Je Situation ein eigener Stil:**
  - **Menüs (Lobby, Setup, Kompendium, Profil):** Swing und Marsch der 1920er-Jahre wie von einem Grammophon, mit leichtem Knistern, gedämpft und einladend
  - **Spielfeld, Planen und Erkunden:** ruhige Industrial-Ambient-Flächen, tiefe Drones, entfernte Maschinen, sparsame Melodiefragmente
  - **Spielfeld, Kampf, Sieg und Niederlage:** Industrie-Orchester mit Blechbläsern, Pauken, Ambossschlägen und Dampfzischen als Percussion
- **Fraktionsthemen:** Jede Fraktion hat ein Leitmotiv, das in ihrer Kampfmusik und in ihren Sieg- und Niederlage-Stücken erklingt.
- **Adaptiv:** Auf dem Spielfeld wechselt die Musik fließend zwischen Ruhe, Anspannung und Kampf (siehe unten).
- **Nicht gewünscht:** Gesang mit verständlichem Text, moderne elektronische Beats oder Dubstep, Fantasy-Chöre, erkennbare Zitate bestehender Musik oder Nationalhymnen, reale Militärmärsche.

**Stil-Zusatz für Musik-Prompts:**
> dieselpunk soundtrack, alternate 1920s industrial era, no vocals, no lyrics, original composition

**Stil-Zusatz für Sound-Prompts:**
> dieselpunk, coal-fired steam machinery, riveted steel, brass, dry and punchy, no music, no voices

## Formate und Ablage

| Art | Format | Lautheit | Ablage |
|---|---|---|---|
| Musik | OGG (Opus), 48 kHz, Stereo, 160 kbit/s | −16 LUFS integriert | `public/audio/music/<id>.ogg` |
| Musik-Schichten (adaptiv) | wie Musik, alle Schichten exakt gleich lang und im selben Tempo | −18 LUFS je Schicht | `public/audio/music/<id>-<schicht>.ogg` |
| Umgebung | OGG (Opus), 48 kHz, Stereo, nahtlose Schleife, 30–60 s | −24 LUFS | `public/audio/ambience/<id>.ogg` |
| Soundeffekte | OGG (Opus), 48 kHz, Mono, ohne Stille am Anfang | Spitze −3 dBFS | `public/audio/sfx/<id>.ogg` |

- Schleifen müssen ohne Klick oder Lücke ineinander übergehen. Der Generator-Prompt sollte deshalb „seamless loop“ enthalten. Nacharbeit im Audio-Editor ist oft trotzdem nötig.
- Von häufigen Sounds (Auswahl, Bewegung, Klick) bitte **2–3 Varianten** liefern (`-1`, `-2`, `-3`), damit sie sich nicht abnutzen.
- Lautstärkeregler in den Einstellungen: **Gesamt**, **Musik**, **Effekte** und **Umgebung**.

## Musik

### Menüs

| ID | Situation | Länge | Prompt |
|---|---|---|---|
| `menu-lobby` | Lobby, Kompendium, Profil, Einstellungen | 2–3 min, Schleife | `1920s gramophone swing with muted trumpet, upright bass and brushed drums, warm vinyl crackle, relaxed mid tempo, seamless loop` |
| `menu-setup` | Partie-Setup und Warteraum | 2 min, Schleife | `1920s military march band played softly on an old gramophone, snare rolls and brass, anticipation before departure, vinyl crackle, seamless loop` |

### Spielfeld: adaptive Musik

Die Spielfeldmusik besteht aus drei Schichten desselben Stücks, gleiches Tempo (88 BPM) und gleiche Tonart. Das Spiel blendet sie je nach Lage ein und aus.

| Schicht | Wann | Inhalt | Prompt |
|---|---|---|---|
| `field-explore` | Grundzustand: planen, erkunden, kein Feind in Sicht | Tiefe Drones, entfernte Maschinen, einzelne Celesta- oder Glockentöne | `slow industrial ambient, low drones, distant factory machinery and steam hiss, sparse celesta notes, calm and vast, 88 bpm, seamless loop` |
| `field-tension` | Feindliche Einheit in Sicht oder eigene Stadt bedroht | zusätzlich pulsierende Tieftöner, Streicher-Ostinato, Uhrwerk-Ticken | `industrial tension layer, pulsing low strings ostinato, ticking clockwork, muffled timpani, uneasy, 88 bpm, seamless loop` |
| `field-combat` | Angriff in diesem Zug, Kampfanimation, Gegnerzug mit Angriffen | zusätzlich Blechbläser, Pauken, Ambossschläge | `industrial orchestra combat layer, heavy brass stabs, timpani and anvil hits, hissing steam percussion, driving, 88 bpm, seamless loop` |

**Übergangsregeln:**
- Wechsel nur auf Taktgrenzen, Überblendung über 2 Takte.
- Von Kampf zurück zu Anspannung, wenn ein Zug lang nicht gekämpft wurde. Von Anspannung zurück zu Erkunden, wenn zwei Züge lang kein Feind in Sicht war.
- Das Fraktionsthema der eigenen Fraktion (siehe unten) erklingt als Einleitung, wenn die Kampf-Schicht zum ersten Mal in einer Partie einsetzt.

### Fraktionsthemen

Jede Fraktion bekommt ein kurzes Leitmotiv (4–8 Takte), das in drei Fassungen geliefert wird: als Kampf-Einleitung (`<fraktion>-theme`, 10–15 s), als Sieg (`<fraktion>-victory`, 20–30 s) und als Niederlage (`<fraktion>-defeat`, 15–20 s).

| Fraktion | Charakter | Prompt (Leitmotiv) |
|---|---|---|
| `eisenbund` | Schwer, stampfend, unaufhaltsam | `heavy stomping brass motif in a minor key, anvil strikes on every beat, deep tuba and trombones, relentless like a steam hammer` |
| `aurelia` | Stolz, wogend, seefahrend | `proud seafaring brass fanfare, rolling waltz-like rhythm, bright trumpets over swelling strings, ship bells, confident` |
| `nordmark` | Kühl, weit, schwebend | `cold airy motif, high muted horns and glassy celesta, slow wide intervals, wind-like strings, distant and soaring` |
| `salzkueste` | Zäh, trotzig, standhaft | `stubborn defiant motif, low clarinets and bassoons, steady snare march, stone-like timpani, weathered and resolute` |

Für Sieg und Niederlage wird der Prompt ergänzt um `triumphant full orchestra resolution, final anvil strike` bzw. `slow broken version, fading brass, steam dying out`.

## Umgebungsgeräusche

Das Spiel mischt die Ambiente-Schleifen nach dem Geländeanteil im sichtbaren Kartenausschnitt. Beim Hineinzoomen werden sie lauter, im Kriegsnebel leiser.

| ID | Gelände | Prompt |
|---|---|---|
| `amb-sea` | Tiefsee | `open sea ambience, deep swells, distant foghorn, gulls far away, seamless loop` |
| `amb-coast` | Küste, Küstengewässer | `coastline ambience, waves breaking on rocks, harbour buoys clanking, seamless loop` |
| `amb-plains` | Ebene | `windy open field ambience, grass rustling, distant steam whistle once, seamless loop` |
| `amb-forest` | Wald | `dark pine forest ambience, wind in branches, sparse birds, creaking wood, seamless loop` |
| `amb-mountains` | Hügel und Gebirge | `high mountain wind ambience, cold gusts, falling pebbles, hollow echo, seamless loop` |
| `amb-city` | Städte | `industrial town ambience, rhythmic factory hammers, steam vents, distant crowd murmur, chimney roar, seamless loop` |
| `amb-fog` | Unerforschte Gebiete am Rand | `muffled eerie fog ambience, low rumble, faint distant machinery, seamless loop` |

## Soundeffekte

### Oberfläche

| ID | Ereignis | Prompt |
|---|---|---|
| `ui-click` | Button, Auswahl | `small brass lever click, crisp mechanical` |
| `ui-toggle` | Schalter, Segment | `heavy toggle switch flipped, metallic clack` |
| `ui-panel-open` | Panel oder Dialog öffnet | `short steam valve release, soft hiss` |
| `ui-panel-close` | Panel oder Dialog schließt | `iron hatch closing gently, dull thud` |
| `ui-error` | Gesperrte Aktion, ungültiges Ziel | `dull buzzer and rattling chain, short` |
| `ui-saved` | „Gespeichert“ | `typewriter ding and carriage return` |
| `notify-your-turn` | Du bist am Zug (auch als Push-Ton) | `two-tone brass ship bell chime, inviting, short` |
| `notify-invite` | Einladung erhalten | `telegraph morse beeps, three short tones` |
| `notify-deadline` | Frist läuft bald ab | `ticking pocket watch with rising tick speed, short` |

### Spielfeld

| ID | Ereignis | Prompt |
|---|---|---|
| `turn-start` | Eigener Zug beginnt | `factory shift whistle, short blast` |
| `turn-end` | Zug beenden | `heavy lever pulled, gears engage, steam burst` |
| `replay-step` | Schritt der Gegnerzug-Wiederholung | `soft ticker tape clatter` |
| `move-invalid` | Ziel nicht erreichbar | `wheels spinning on gravel, engine sputter` |
| `path-preview` | Pfadvorschau erscheint | `pencil on paper map, short scratch` |
| `combat-gun` | Angriff durch Landeinheiten | `rifle and machine gun volley, distant echo` |
| `combat-cannon` | Angriff durch Schiffe und Panzer | `heavy naval cannon blast, deep boom with metal ring` |
| `combat-air` | Angriff durch Flugzeuge | `diving aircraft engine scream followed by bomb whistle and explosion` |
| `explosion-small` | Treffer | `short explosion with debris` |
| `explosion-large` | Einheit zerstört | `large explosion, collapsing steel, fire crackle tail` |
| `city-captured` | Stadt erobert | `crowd cheer and bell tower ringing, short brass fanfare` |
| `city-lost` | Stadt verloren | `low warning siren, single dull bell` |
| `production-done` | Einheit fertig | `factory gate opening, steam hiss, hammer clang` |
| `fuel-low` | Treibstoff knapp | `engine coughing and fuel gauge needle tick` |

### Einheiten

Pro Einheitentyp gibt es zwei Sounds, `<id>-select` (beim Auswählen, kurz, unter 1 s) und `<id>-move` (beim Bewegen, 1–2 s). Die Fraktionsvarianten teilen sich die Sounds.

| Einheit | Auswahl | Bewegung |
|---|---|---|
| `grenadiere` | `soldiers boots stamping to attention, gear rattle` | `marching boots on gravel, equipment clinking` |
| `panzerwagen` | `steam car engine revving, valve hiss` | `armoured steam car driving off, rattling plates` |
| `dampfkoloss` | `huge boiler roaring to life, three chimneys bellowing` | `colossal tracked fortress grinding forward, ground shaking, chains clanking` |
| `kanonenboot` | `small boat engine putt-putt, bell ring` | `small steamboat chugging through water` |
| `panzerkreuzer` | `deep ship horn, turbines spinning up` | `heavy warship ploughing waves, deep engine thrum` |
| `tauchboot` | `sonar ping, hull creak` | `submarine diving, water rush, ballast hiss` |
| `frachter` | `cargo crane winch, ship horn` | `freighter chugging, cargo chains rattling` |
| `flugzeugtraeger` | `deck alarm bell, aircraft engines idling` | `large carrier moving, deep engines, wind across flight deck` |
| `blitzkorvette` | `high-revving turbine whine` | `fast corvette slicing through waves, spray` |
| `doppeldecker` | `radial engine coughing to start` | `biplane flyby, propeller drone, doppler` |
| `schwerbomber` | `four heavy engines starting one after another` | `heavy bomber droning overhead, deep doppler` |
| `wolkenkreuzer` | `airship gas valves hissing, rigging creak` | `huge airship gliding, slow propeller hum, wind` |

## Produktion mit KI-Generatoren

**Werkzeuge:**

| Bereich | Werkzeug | Warum |
|---|---|---|
| Musik (17 Stücke) | Suno, Plan mit kommerziellen Rechten und Stem-Trennung (Premier), alternativ Soundverse | Instrumentalstücke in Orchester- und Swing-Stil, Zerlegen in Spuren für die adaptiven Schichten |
| Soundeffekte (47) | ElevenLabs Sound Effects, bezahlter Plan | Kurze, präzise Effekte nach Textbeschreibung |
| Umgebung (7 Schleifen) | Stable Audio | Längere, gleichmäßige Klangflächen |
| Nacharbeit | Audacity oder ein anderer Audio-Editor | Schleifen schneiden, Lautheit angleichen, Stille entfernen |

Vor der Veröffentlichung die aktuellen Lizenzbedingungen jedes Anbieters prüfen. Kostenlose Pläne erlauben meist keine kommerzielle Nutzung, und eine kommerzielle Lizenz ist nicht dasselbe wie das Urheberrecht.

**Adaptive Spielfeld-Musik aus einem Stück erzeugen:**

Werden die drei Schichten einzeln generiert, passen Tempo und Tonart nicht zusammen. Deshalb entstehen sie aus einem gemeinsamen Stück:

1. Das **volle Kampfstück** generieren. Den Prompt von `field-combat` um die Inhalte der anderen Schichten ergänzen, damit alles enthalten ist: `industrial orchestra, low drones and distant factory machinery, pulsing low strings ostinato and ticking clockwork, heavy brass stabs, timpani and anvil hits, hissing steam percussion, 88 bpm, instrumental, seamless loop`
2. Das Stück per **Stem-Trennung** in Spuren zerlegen (Drums bzw. Percussion, Bass, Streicher, Blech, Sonstiges).
3. Die Schichten aus den Spuren zusammenstellen:
   - `field-explore`: nur Drones und Ambient-Spuren, leise Melodie-Fragmente
   - `field-tension`: zusätzlich Streicher und Uhrwerk-Percussion
   - `field-combat`: alle Spuren
4. Alle drei Dateien auf **exakt dieselbe Länge** schneiden, Anfang und Ende auf Taktgrenzen legen und als Schleife prüfen.
5. Für weitere Spielfeld-Stücke (Abwechslung in langen Partien) den Vorgang mit neuem Seed und gleichem Tempo wiederholen.

**Fraktionsthemen:** Erst das Leitmotiv als kurzes Stück generieren, das am besten passende auswählen und Sieg- bzw. Niederlage-Fassung als Variation davon erzeugen, wenn der Generator „Extend“ oder „Remix“ mit Referenz anbietet. Sonst den Leitmotiv-Prompt mit dem jeweiligen Zusatz für Sieg oder Niederlage verwenden und auf ähnliche Instrumentierung achten.

**Schleifen nacharbeiten:**
- Generatoren liefern selten saubere Übergänge. Im Editor Anfang und Ende auf einen Nulldurchgang schneiden und einen kurzen Crossfade (50–200 ms) setzen.
- Danach mindestens fünf Durchläufe hintereinander anhören.
- Lautheit am Ende auf die Zielwerte aus „Formate und Ablage“ bringen.

## Umfang

- **Musik:** 2 Menü-Stücke, 3 adaptive Spielfeld-Schichten, 4 Fraktionen × 3 Fassungen = **17 Stücke**
- **Umgebung:** **7 Schleifen**
- **Soundeffekte:** 9 Oberfläche + 14 Spielfeld + 12 Einheiten × 2 = **47 Sounds**, für häufige Sounds jeweils 2–3 Varianten

## Abnahme

- Musik und Effekte passen in Lautheit zueinander. Effekte dürfen die Musik kurz übertönen, Musik nie die Effekte.
- Alle Schleifen laufen mindestens fünfmal hintereinander ohne hörbare Naht.
- Die drei Spielfeld-Schichten klingen einzeln und zusammen stimmig (gleiches Tempo, gleiche Tonart).
- Ein Leitmotiv ist nach zweimaligem Hören wiedererkennbar.
- Keine Stimmen, kein Text, keine Zitate bestehender Musik.
