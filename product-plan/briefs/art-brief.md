# Art-Brief: Dominion of Steam

Dieser Brief beschreibt die Illustrationen für das Kompendium (Fraktionen & Einheiten). Er richtet sich an Illustratorinnen und Illustratoren oder dient als Vorlage für einen Bildgenerator. Die Prompts sind auf Englisch, weil die meisten Bildgeneratoren damit die besten Ergebnisse liefern.

## Bildstil

- **Welt:** Alternative Industrie-Ära, Dieselpunk mit Dampf-Einschlag. Kohle, Stahl, Nieten, Kessel, Schlote, Messing und Zahnräder, aber keine Fantasy-Magie und keine reale Nation, Uniform oder Flagge.
- **Malweise:** Gemalte Konzeptkunst mit sichtbarem Pinselduktus und einer leichten Anmutung von Propaganda-Plakaten der 1920er- bis 1930er-Jahre: kräftige Silhouetten, monumentale Perspektive von leicht unten, Rauch und Dunst als Gestaltungsmittel.
- **Licht:** Warmes Gegenlicht (Glut, Sonnenuntergang, Hochofen) gegen kühle, rauchige Schatten.
- **Farbe:** Gedämpfte Grundpalette aus warmem Steingrau, Ruß und Messing. Jede Fraktion bringt ihre Akzentfarbe ein (siehe unten). Teal taucht nur als Patina auf Kupfer oder als Wasser auf.
- **Nicht gewünscht:** Text oder Schrift im Bild, Logos, Hakenkreuze oder andere reale Hoheitszeichen, Blut und Gore, Fotorealismus, Anime-Stil, glänzender 3D-Render-Look.

**Stil-Zusatz für alle Prompts:**
> painted dieselpunk concept art, alternate 1920s industrial era, coal smoke and brass, riveted steel, dramatic low-angle composition, warm backlight against cool smoky shadows, visible brushwork, muted palette, no text, no logos, no real-world flags or insignia

## Formate und Ablage

| Motiv | Format | Mindestgröße | Ablage | Datenfeld |
|---|---|---|---|---|
| Einheit, Fraktionsvariante | 4:3, Querformat | 1600 × 1200 px | `public/art/units/<faction-id>/<unit-id>.webp` | `unitType.variantIllustrationUrls[<faction-id>]` |
| Einheit, neutral bzw. Sondereinheit | 4:3, Querformat | 1600 × 1200 px | `public/art/units/<unit-id>.webp` | `unitType.illustrationUrl` |
| Fraktions-Kopfbild | 21:9, Querformat, Motiv rechts, links Raum für Titel | 2520 × 1080 px | `public/art/factions/<faction-id>-hero.webp` | `faction.heroImageUrl` |
| Fraktions-Wappen | 8:9, Hochformat, freigestellt | 512 × 576 px | `public/art/factions/<faction-id>-emblem.png` (transparent) | `faction.emblemUrl` |
| KI-Porträt | 1:1, Brustbild, Gesicht mittig | 768 × 768 px | `public/art/portraits/<personality-id>.webp` | `aiPersonality.portraitUrl` |

- Die Dateinamen entsprechen den IDs in `product/sections/fraktionen-and-einheiten/data.json`, dort sind alle Pfade bereits eingetragen.
- Ein Bild erscheint in den Mocks, sobald die Datei unter dem passenden Namen abgelegt ist (Seite neu laden genügt). Fehlt eine Datei, zeigen die Screens weiter den Platzhalter.
- Das Kopfbild erscheint im Kopfbereich der Fraktionsansicht und im farbigen Band der Fraktionskarte in der Übersicht.
- Bei allgemeinen Einheiten zeigen die Screens zuerst die Variante der Fraktion, dann das neutrale Bild, dann die Blaupause. Das neutrale Bild ist also optional, sobald alle Varianten existieren.

## Fraktionsvarianten der Einheiten

Allgemeine Einheiten haben in allen Fraktionen dieselben Werte, aber jede Fraktion baut sie in ihrer eigenen Ausführung. Die **Grundform bleibt gleich**, damit man einen Kreuzer immer als Kreuzer erkennt. Fraktionen unterscheiden sich durch Formensprache, Lackierung und Details. Auf der Spielkarte gibt es weiterhin ein gemeinsames Icon pro Einheitentyp, die Fraktion erkennt man dort an der Farbe des Spielsteins.

| Fraktion | Formensprache | Prompt-Zusatz |
|---|---|---|
| Eisenbund | Massig und kantig, schwarzes Eisen, grobe Nieten, viele Schlote, Ruß und Glut | `massive angular build, blackened iron, heavy rivets, many smokestacks, soot, amber trim` |
| Aurelia | Schlank und elegant, Karmesin und Weiß lackiert, poliertes Messing, geschwungene Linien | `sleek elegant lines, crimson and white lacquer, polished brass fittings, naval pennants without symbols` |
| Nordmark | Leicht und windschnittig, Weiß und Himmelblau, Isolierung, Pelz, Frost | `light streamlined build, white and sky blue paint, insulated panels, fur-lined crews, frost on metal` |
| Salzküste | Geflickt und improvisiert, Sandstein-Tarnung, Salzkrusten, zusätzliche Panzerplatten | `patched and improvised, sandstone camouflage, salt-crusted plating, extra bolted armour plates, lime green markings` |

Ein Varianten-Prompt besteht aus dem Motiv-Prompt der Einheit, dem Prompt-Zusatz der Fraktion und dem Stil-Zusatz.

**Bildliste:** 9 allgemeine Einheiten × 4 Fraktionen = 36 Varianten, dazu 3 Sondereinheiten, insgesamt 39 Einheitenbilder. Empfehlung: eine Fraktion vollständig umsetzen (z. B. Eisenbund: 9 Varianten + Dampfkoloss) und die anderen danach.

## Fraktionen

### Eisenbund von Valdrin (`eisenbund`)
- **Farbwelt:** Amber und Glut, Hochofenorange, schwarzer Ruß
- **Wofür sie steht:** Schwerindustrie, Beharrlichkeit, Stahl statt Diplomatie
- **Kopfbild:** Ein Zechenmeister-General in schwerem Ledermantel mit Messingorden steht auf einer Abraumhalde. Hinter ihm rollen drei Dampfkolosse aus dem Rauch einer Industriestadt mit Fördertürmen und glühenden Hochöfen.
- **Prompt:** `stern coal-baron general in a heavy leather greatcoat with brass medals standing on a slag heap, three enormous tracked steam fortresses rolling out of smoke behind him, mining town with headframes and glowing blast furnaces, amber and ember orange palette`
- **Wappen:** Schild mit gekreuztem Hammer und Schlägel über einem Zahnrad, Amber auf Ruß

### Aurelische Republik (`aurelia`)
- **Farbwelt:** Rosé-Rot und Karmesin, Marineblau-Grau, weiße Gischt
- **Wofür sie steht:** Seehandel, Flotte, kaufmännischer Ehrgeiz
- **Kopfbild:** Eine Admiralin mit Dreispitz-artiger Mütze und Fernrohr auf der Brücke eines Panzerkreuzers. Dahinter läuft eine Flotte mit Blitzkorvetten aus einem Hafen mit Leuchtturm und Handelskontoren aus.
- **Prompt:** `confident admiral with a spyglass on the bridge of an armoured cruiser, fleet of sleek fast corvettes and ironclads leaving a harbour with lighthouse and merchant guild halls, crimson and rose accents, sea spray, morning haze`
- **Wappen:** Schild mit Anker, umrahmt von einem Lorbeerkranz aus Tauen, Karmesin auf Silbergrau

### Nordmark-Kollektiv (`nordmark`)
- **Farbwelt:** Himmelblau und Eisweiß, kühles Stahlgrau
- **Wofür sie steht:** Luftschifffahrt, Aufklärung, kühler Pragmatismus
- **Kopfbild:** Eine Luftschiff-Kapitänin mit Fliegerbrille und Pelzkragen an der offenen Gondel. Unter ihr gleiten Wolkenkreuzer über Gletscher und eine Fjordwerft mit Ankermasten.
- **Prompt:** `airship captain with flight goggles and fur collar leaning out of an open gondola, fleet of ribbed zeppelin cruisers gliding over glaciers and a fjord shipyard with mooring masts, sky blue and ice white palette, crisp cold light`
- **Wappen:** Schild mit stilisiertem Luftschiff vor Nordstern, Himmelblau auf Eisweiß

### Salzküsten-Liga (`salzkueste`)
- **Farbwelt:** Lindgrün und Salzweiß, Sandstein, Brackwasser
- **Wofür sie steht:** Befestigung, Ausdauer, Salzhandel
- **Kopfbild:** Ein grauhaariger Festungskommandant auf einem Bastionswall mit Küstengeschützen. Dahinter liegen gestaffelte Festungsmauern über Salzmarschen mit Salinen und Windpumpen.
- **Prompt:** `grey-haired fortress commander on a bastion wall beside coastal artillery, layered star-fort walls above salt marshes with salt pans and wind pumps, lime green and salt white accents, sandstone, overcast sky`
- **Wappen:** Schild mit Turm über drei Wellenlinien, Lindgrün auf Salzweiß

## KI-Persönlichkeiten

Porträts der KI-Gegner für Partie-Setup, Lobby und Warteraum. Sie werden **rund** zugeschnitten und oft klein angezeigt (40–64 px). Das Gesicht muss deshalb mittig und gut erkennbar sein, der Hintergrund ruhig. Jede Person trägt Uniform bzw. Kleidung im Stil ihrer Fraktion (siehe Formensprache oben) mit Akzenten in der Fraktionsfarbe, aber keine realen Abzeichen.

**Stil-Zusatz für Porträts:**
> painted dieselpunk character portrait, head and shoulders, centered face, three-quarter view, soft rim light, muted smoky background, visible brushwork, no text, no real-world insignia

| ID | Persönlichkeit | Fraktion | Motiv | Prompt |
|---|---|---|---|---|
| `kessler` | Admiral Kessler | Aurelia | Strenger Großadmiral, grauer Backenbart, karmesinrote Marineuniform mit Messingknöpfen, salzverkrustete Schirmmütze | `stern grand admiral with grey mutton chops, crimson naval uniform with brass buttons, salt-stained peaked cap, sea spray in background` |
| `varenne` | Senatorin Varenne | Aurelia | Kühle Handelsministerin, hochgestecktes Haar, weißer Mantel mit karmesinroter Schärpe, Monokel an Kette | `cool calculating trade minister woman, pinned-up hair, white coat with crimson sash, monocle on a chain, harbour cranes blurred behind` |
| `brandt` | Zechenmeister Brandt | Eisenbund | Massiger Zechenmeister, rußgeschwärztes Gesicht, Lederschürze über Uniformjacke, Schutzbrille auf der Stirn | `burly coal mine master with soot-blackened face, leather apron over uniform jacket, goggles on forehead, glowing furnace light` |
| `eisenhart` | Generalin Eisenhart | Eisenbund | Entschlossene Generalin, kurzes Haar, schwarzer Panzerfahrer-Mantel mit amberfarbenen Litzen, Ölflecken | `determined female general with short hair, black armoured-car commander coat with amber piping, oil smudges, engine exhaust haze` |
| `halvorsen` | Kapitänin Halvorsen | Nordmark | Luftschiff-Kapitänin, Fliegerbrille, Pelzkragen, himmelblauer Fliegermantel, frostige Wangen | `airship captain woman with flight goggles pushed up, fur collar, sky blue flying coat, frost on cheeks, clouds behind` |
| `lindqvist` | Ingenieur Lindqvist | Nordmark | Bedächtiger Werftingenieur, Brille, Strickschal, weiß-blauer Overall, Rechenschieber in der Brusttasche | `thoughtful shipyard engineer with round glasses, knitted scarf, white and sky blue overalls, slide rule in breast pocket, hangar lights` |
| `ostrow` | Graf Ostrow | Salzküste | Alter Festungskommandant, Augenklappe, sandfarbene Uniform mit lindgrünen Kragenspiegeln, Salzkristalle am Mantel | `old fortress commander count with an eye patch, sand-coloured uniform with lime green collar tabs, salt crystals on coat, stone walls behind` |

## Einheiten

Jede Einheit wird einzeln in ihrer Umgebung gezeigt, in der Dreiviertelansicht und leicht von unten. Bei Sondereinheiten spiegelt die Lackierung die Fraktionsfarbe, allgemeine Einheiten tragen neutrales Stahlgrau mit Messingdetails.

| ID | Einheit | Motiv | Prompt |
|---|---|---|---|
| `grenadiere` | Grenadiere | Trupp mit Gasmasken und Stahlhelmen, Gewehrgranaten, Schützengraben im Nebel | `squad of infantry in gas masks and steel helmets with rifle grenades advancing through a misty trench line` |
| `panzerwagen` | Panzerwagen | Genieteter Dampfwagen mit Schnellfeuerkanone und Schornstein auf einer Schotterstraße | `riveted armoured steam car with a turret autocannon and smoking chimney speeding along a gravel road, dust trail` |
| `dampfkoloss` | Dampfkoloss (Eisenbund) | Turmhohe Kettenfestung mit drei Schloten, Soldaten winzig daneben | `colossal tracked land fortress as tall as a church tower, three smoking chimneys, tiny soldiers beside it for scale, amber hull markings` |
| `kanonenboot` | Kanonenboot | Kleines Patrouillenboot mit Bugkanone in einer felsigen Bucht | `small patrol gunboat with a bow cannon and single funnel in a rocky cove, choppy water` |
| `panzerkreuzer` | Panzerkreuzer | Schwerer Kreuzer mit zwei Schornsteinen und Geschütztürmen in rauer See | `heavy armoured cruiser with twin funnels and gun turrets ploughing through rough sea, smoke trailing` |
| `tauchboot` | Tauchboot | Genietetes U-Boot mit Turm und Periskop, halb aufgetaucht im Mondlicht | `riveted submarine with conning tower and periscope half surfaced at night, moonlit water` |
| `frachter` | Transportfrachter | Dampffrachter mit Ladekran und Kisten, Soldaten gehen an Bord | `steam cargo freighter with deck crane and crates at a quay, soldiers boarding up a gangway` |
| `flugzeugtraeger` | Flugzeugträger | Flugzeugträger mit Flugdeck und Brückeninsel, ein Doppeldecker startet, Matrosen mit Signalflaggen | `aircraft carrier with a long flight deck and an island superstructure with funnel, a biplane taking off, deck crew with signal flags, open sea` |
| `blitzkorvette` | Blitzkorvette (Aurelia) | Schlanke, schnelle Korvette mit hoher Bugwelle | `sleek fast corvette slicing through waves with a high bow wave, crimson stripe on the hull` |
| `doppeldecker` | Doppeldecker | Doppeldecker mit Sternmotor im Steigflug über Feldern | `biplane with radial engine climbing over patchwork fields, propeller blur, clouds` |
| `schwerbomber` | Schwerbomber | Viermotoriger Bomber mit verglaster Bugkanzel im Tiefflug über einer rauchenden Industriestadt | `four-engined heavy bomber with glazed nose canopy flying low over a smoking industrial town, open bomb bay, flak bursts in the sky` |
| `wolkenkreuzer` | Wolkenkreuzer (Nordmark) | Gewaltiges Starrluftschiff mit Gondel und Bordgeschützen über Wolken | `huge rigid zeppelin warship with armoured gondola and deck guns above a sea of clouds, sky blue hull markings` |

Ein vollständiger Prompt setzt sich zusammen aus dem Motiv-Prompt, dem Stil-Zusatz und dem Format, zum Beispiel:

> colossal tracked land fortress as tall as a church tower, three smoking chimneys, tiny soldiers beside it for scale, amber hull markings, painted dieselpunk concept art, alternate 1920s industrial era, coal smoke and brass, riveted steel, dramatic low-angle composition, warm backlight against cool smoky shadows, visible brushwork, muted palette, no text, no logos, no real-world flags or insignia, 4:3 landscape

## Abnahme

- Die Einheit ist auch in der Vorschaugröße von etwa 320 px Breite klar erkennbar.
- Kopfbilder lassen links etwa 40 % ruhige Fläche für Titel und Leitspruch.
- Keine echten Hoheitszeichen, keine erkennbaren realen Personen.
- Alle Bilder einer Gruppe wirken wie aus einer Hand: gleiche Lichtstimmung, gleicher Pinselduktus.
