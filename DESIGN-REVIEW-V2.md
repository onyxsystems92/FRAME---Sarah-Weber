# Design Review V2 · Raum & Zeit

Status: **CONTENT AUTONOMY READY · AWAITING FRANKLYN REVIEW** (Nachträge 2026-09-28 am Ende)
Datum: 2026-09-25
Branch: `feat/sarah-design-review-v2` (isolierter Worktree)
Ausgangsstand: `feat/sarah-portable-ssg` @ `6405cd0`

Dieser Bericht ist Engineering-Evidenz. Er ist keine Freigabe, keine
Produktionsreife-Aussage und keine Zusage gegenüber Sarah oder Tilmann.

---

## 1. Ausgangslage, verifiziert

| Prüfung | Ergebnis |
| --- | --- |
| Lokaler Branch `feat/sarah-portable-ssg` | `6405cd0bdabacaf61f2d442ab36960d508f1c981` |
| `origin/feat/sarah-portable-ssg` | identisch, `6405cd0…` |
| `origin/main` | `c5f512f69fef61f6e999e27093884dcbd8987cd6`, unverändert |
| Arbeitsbaum vor Beginn | sauber |
| Praxisakte-Bildmaterial (Drive `01_Bildmaterial`) | enthält ausschließlich `Logo · Raum und Zeit.png` |
| Freigegebene Praxis-/Teamfotos | **keine vorhanden** |

Referenz-Screenshots des Ausgangsstands wurden vor der ersten Änderung aus
einer Kopie von `dist/` aufgenommen (45 Aufnahmen, 7 Seiten × 3 Viewports ×
Fold/Full plus Navigation-Home-Zustand).

## 2. Isolation

- Eigener Git-Worktree: `~/Projects/sarah-design-review-v2`
- Eigener Branch: `feat/sarah-design-review-v2`, abgezweigt von `6405cd0`
- Eigenes `node_modules` aus `npm ci`, eigene `dist/` und `release/`
- Eigene Review-Ports 8097/8098, getrennt vom Standard-Port 8080

Unverändert geblieben: `main`, die daran gekoppelte GitHub-Pages-Preview,
`feat/sarah-portable-ssg`, der gemeinsame Checkout
`~/Projects/FRAME---Sarah-Weber`, Sarahs produktiver Webauftritt, Tilmanns
Plesk-Umgebung, DNS, Hosting und jede Publishing-Konfiguration. Es wurde
nichts gemerged, gepusht, deployed oder hochgeladen.

## 3. Tatsächlich verwendete Design Skills

Die im Auftrag genannten Skills sind in dieser Claude-Code-Umgebung **nicht
als Skills installiert**. Geprüft wurden `ListSkills`, `SearchSkills`,
`~/.claude/skills`, `~/.claude/plugins` und die Projekt-Skill-Verzeichnisse;
verfügbar sind dort nur `watch` und `video-to-ui`.

Die vollständigen Skill-Quellen liegen jedoch lokal unter
`~/Projects/design-skill-research-20260918`. Ich habe ihre Anweisungen direkt
gelesen und angewendet:

| Skill | Quelle gelesen | Angewendet auf |
| --- | --- | --- |
| `redesign-existing-projects` (`taste/skills/redesign-skill`) | ja | Audit-Raster, Fix-Priorität, Anti-Generic-Patterns |
| `taste-skill` | ja (Abschnitte 4.1–4.11, 11) | Layout-Diversifizierung, Eyebrow-Restraint, Split-Header-Verbot, Bildstrategie, Content-Dichte |
| `emil-design-eng` | ja | Motion-Entscheidungsrahmen, Easing-Kurven, Interruptibility, Press-Feedback |
| `animate` | ja | Build-Sequenz je Animation, Tool-Wahl, `@starting-style`-Alternativen |
| `find-animation-opportunities` | ja | das Gate, mit dem die meisten Kandidaten abgelehnt wurden |
| `improve-animations` | ja | Kategorie-Audit der bestehenden Motion |
| `impeccable` (`craft-floor`, `polish`, `layout`, `typeset`) | ja | Qualitätsboden, Browser-Surfaces, Mess-statt-Absicht-Verifikation |

**Nicht** genutzt: die `impeccable`-Binärwerkzeuge (`impeccable context`,
`detect`, `critique-storage`) und `review-animations`. Die Skills wurden nicht
über das Skill-Tool aufgerufen, weil sie in dieser Sitzung nicht registriert
sind. Wo Skill-Vorgaben dem Repository-Designvertrag widersprachen, gewinnt
der Vertrag: die Eyebrows wurden reduziert, nicht wie von `impeccable`
gefordert verboten; die grüne Navigation Home bleibt eine dunkle Fläche in
einer hellen Seite; die Accordions bleiben Accordions; Newsreader bleibt die
Display-Schrift.

## 4. Umgesetzte Designänderungen

### Durchgehend

- **Geometrie vereinheitlicht.** Flächen rechteckig (`--radius: 3px`),
  Bedienelemente Pille. Der 22px-Kartenradius, der die vom Vertrag
  abgelehnte SaaS-Optik erzeugte, ist weg.
- **Section-Head-System.** Der dreispaltige Eyebrow-Headline-Absatz-Kopf auf
  jedem Abschnitt jeder Seite ist durch zwei rotierende Formen ersetzt.
  Eyebrows nur noch dort, wo sie eine Fläche wirklich benennen.
- **Bildsystem.** Acht benannte Bildplätze in `src/_data/images.yaml` mit
  festem Seitenverhältnis, Fokuspunkt, Alternativtext und Motivnotiz;
  im lokalen Editor als „Praxisbilder“ pflegbar.
- **Typografie.** Zeilenmaß auf 66 Zeichen begrenzt, `text-wrap: balance` auf
  Display-Zeilen und `pretty` im Fließtext, Tabellenziffern für Indizes,
  Mikro-Labels von 10px auf 11px.
- **Browser-Oberflächen** aus der Palette gestaltet: Textmarkierung, Caret,
  Scrollbar, Fokusring, Unterstreichungsabstand.
- **Kontrast.** `--muted` abgedunkelt, neues `--sage-ink` für salbeifarbenen
  Text auf hellen Flächen. Das bisherige `--sage` wurde als Textfarbe mit
  2,8:1 verwendet und ist damit durchgefallen.

### Startseite

Weißes Positionierungsfeld und grüner Orientierungskasten bleiben, mit
ruhigerer Display-Größe und einem feinen Sanduhr-Akzent. Die Fläche endet
jetzt so, dass der Anfang des Praxisbands sichtbar wird. Darunter ein
vollflächiges Praxisband, ein Bild-Text-Kopf für „Was uns prägt“ mit dem
Logo als Akzent, die sechs Seiteneinstiege als Haarlinienraster mit unten
verankertem Titel, und der Behandlungs-Index als Haarlinienliste statt als
fünfspaltiges Kartenraster.

### Navigation Home

Reihenfolge, Beschriftungen, Routen, `aria-pressed`, `aria-expanded`,
`aria-controls` und die Event-Semantik sind unverändert. Neu: animierte
Panelhöhe statt `hidden`-Sprung, klar lesbarer aktiver Zustand mit
Salbei-Fläche und Randleiste, die sich in das Panel fortsetzt, gezeichnetes
Plus-zu-Minus statt Textzeichen, leichter Versatz der Routen, und
eingeklappte Routen sind nicht mehr per Tab erreichbar.

### Arbeitsweise

Nummerierte Schritt-Sequenz statt drei gleicher Karten. Behandlungsband.
Der eine gestaltete Motion-Moment: die Sanduhr im Abschnitt „Mehr Zeit für
relevante Beobachtung“ lässt den Sand einmal fließen und endet mitten im
Lauf, nicht leer.

### Therapie

Behandlungsband direkt unter dem Hero. Die Aufklapp-Liste animiert ihre
Höhe, markiert den offenen Kontext mit einer Salbei-Randleiste und hat
größere Bedienflächen. Der Methodenauszug ist eine Tag-Wand statt eines
Fließtextabsatzes; der Bestätigungsvorbehalt bleibt sichtbar.

### Team

Die stärkste persönliche Gestaltung: großes 4:5-Porträtformat, redaktionelle
Hierarchie, fachliche Schwerpunkte als Liste, Team-Band, und ein Roster ohne
Kartenrahmen. Keine erfundenen Namen, Biografien oder Qualifikationen; die
leeren Profile bleiben als „Profil nach Freigabe“ markiert.

### Praxisbesuch

Kontaktblock statt drei gleicher Info-Karten: die Telefonnummer als
Display-Typo und echter Link, Adresse mit Google-Maps-Click-through,
Termin-Block mit sichtbarem offenen Punkt, Praxisraum-Bildplatz. Die
Vorbereitungshinweise sind eine Definitionsliste, also eine andere
Layoutfamilie als die Sequenz auf der Arbeitsweise-Seite.

### Karriere

Arbeitsband, ausgerichtete Pfeiler-Überschriften, ruhiger Abschlussblock.
Keine erfundene Stellenausschreibung.

### Aktuelles

Ruhiger redaktioneller Leerzustand mit einem Weiterweg zu Termin und
Kontakt. Die Contentlogik, die zeitliche Sichtbarkeit und der bedingte
Startseiten-Abschnitt sind unverändert.

### Mobil

Eigene Bildformate je Breakpoint, kompaktere Seiteneinstiege, animiertes
mobiles Menü, Mindest-Tippziel 24px, und der Terminweg jetzt auch im mobilen
Menü. **Gefundener Defekt im Ausgangsstand:** unter 1080px war der
Header-Button `Termin & Kontakt` ausgeblendet und im Menü nicht vorhanden,
der Terminweg also aus dem Header heraus mobil unerreichbar.

### Weitere im Ausgangsstand gefundene und behobene Defekte

| Defekt | Behebung |
| --- | --- |
| `praxis.html#termin` landete unter dem sticky Header | `scroll-margin-top` |
| `.page-main { overflow: hidden }` unterbindet `position: sticky` | `overflow-x: clip` |
| Hover animierte `padding` und erzwang Layout pro Frame | Transform- und Farbübergänge |
| `transition: .2s var(--ease)` auf dem Menü-Icon = `transition: all` | benannte Eigenschaften |
| `--sage` als Textfarbe mit 2,8:1 | `--sage-ink` |
| `.nav-home-kicker img` gestylt, aber kein Element im Template | tote Regel entfernt |
| `.hourglass-large`, `.hero-*`, `.editorial-split`, `.intent-row` in `styles.css` ohne Template | ersetzt durch das genutzte Marken-Motiv |
| 10px-Mikrolabels unter der Lesbarkeitsschwelle | 11px |
| Footer-Links 21px hoch | 24px Mindesthöhe |

## 5. Review-Artefakt

Es gibt **keine** externe Review-URL. Innerhalb der autorisierten
Infrastruktur ist keine sichere isolierte Nicht-Produktions-URL verfügbar:
`main`/GitHub Pages darf nicht überschrieben werden, und `AGENTS.md` schließt
Cloudflare, Vercel und Netlify als Pfad aus. Geliefert wird deshalb die im
Auftrag vorgesehene lokale Variante.

**Portables Artefakt:** `~/Projects/sarah-design-review-v2-artifact/`

```
index.html            Vorher/Nachher-Vergleich mit Umschalter
website/              der öffentliche Export, vollständig navigierbar
vergleich/vorher/     45 Referenzaufnahmen des Ausgangsstands
vergleich/nachher/    45 Aufnahmen des neuen Stands
vergleich/zustaende/  6 Interaktionszustände
serve.mjs             minimaler, nur auf 127.0.0.1 gebundener Server
```

Starten:

```sh
cd ~/Projects/sarah-design-review-v2-artifact
node serve.mjs . 8097          # Vergleichsseite: http://127.0.0.1:8097/
node serve.mjs ./website 8099  # nur die Website: http://127.0.0.1:8099/
```

Mit Editor aus dem Worktree:

```sh
cd ~/Projects/sarah-design-review-v2
npm ci
npm run edit                   # Website 8080, Editor 8080/admin/
```

Alle Aufnahmen stammen aus echtem Chromium-Rendering des gebauten Stands.
Die Seite wird vor jeder Aufnahme durchgescrollt, damit scrollausgelöste
Einblendungen tatsächlich gelaufen sind.

## 6. Prüfergebnisse

| Prüfung | Kommando | Ergebnis |
| --- | --- | --- |
| Funktion, Zugänglichkeit, Regression | `npm run smoke -- --base-url …` | **223 / 223** |
| Kontrast aller Textknoten, 7 Seiten | `npm run contrast -- --base-url …` | **alles WCAG AA** |
| Wiederholbarer Build | zweimal `npm run build` | identische Prüfsumme |
| Öffentlicher Export | `npm run export` | 20 Dateien, kein `admin/` |
| Echtes Foto statt Platzhalter | Fixture gesetzt, gebaut, geprüft, entfernt | `<img>` mit Alt und Fokuspunkt, Platzhalter weg, Asset kopiert |

Abgedeckt sind unter anderem: alle sieben Seiten an 1440/900/390px, keine
Console-Fehler, kein horizontales Overflow, kein externer Request, jedes
Bild mit Alt-Attribut, lückenlose Überschriftenhierarchie, genau ein `h1`,
`noindex,nofollow`, die vier Besucherzustände samt Schließen und Wechseln,
Tastaturbedienung und sichtbarer Fokus, genau sechs Seiteneinstiege mit
korrekten Zielen, das responsive Kartenraster, Deep Links, mobiles Menü mit
Escape, Telefonlinks, Google-Maps-Verhalten ohne Iframe und ohne Request
beim Seitenaufruf, die Aktuelles-Renderer-Regeln und die FRAME-Events.

Zusätzlich neu geprüft: eingeklappte Panels sind nicht fokussierbar, das
Panel animiert seine Höhe, jeder Bildplatz ohne Foto ist als Platzhalter
markiert, die Bänder laufen wirklich über die volle Breite, Deep Links
landen unter dem Header, bei `prefers-reduced-motion` ist keine Einblendung
aktiv und nichts bleibt ausgeblendet, ohne JavaScript bleibt die Seite
vollständig lesbar, und kein Tippziel ist kleiner als 24px.

**Ein erfolgreicher Build und grüne Tests sind keine visuelle Freigabe.**

## 7. Bekannte Restpunkte

1. **Alle acht Bildplätze sind Platzhalter.** Die Gestaltung ist darauf
   ausgelegt, wirkt mit echten Fotos aber deutlich anders. Der reale
   Eindruck lässt sich erst mit Sarahs Aufnahmen abschließend beurteilen.
2. **`Aktuelles` fehlt in der Hauptnavigation** (`inNav: false` laut
   Vertrag). Auf dem Desktop ist die Seite über die Startseitenkarte und den
   Footer erreichbar, im mobilen Menü nicht. Das ist der vereinbarte Stand,
   aber eine offene Gestaltungsfrage.
3. **Die Team-Platzhalter dominieren mobil**, weil vier 4:5-Porträts
   untereinander stehen. Mit echten Porträts ist das richtig, mit
   Platzhaltern lang.
4. Der Zeit-Moment auf der Arbeitsweise-Seite läuft einmal pro Seitenaufruf
   und ist bewusst nicht wiederholbar; ob er auffällig genug ist, ist eine
   Geschmacksentscheidung.
5. Getestet ausschließlich in Chromium. Safari und Firefox sind nicht
   geprüft; `grid-template-rows`-Animation und `aspect-ratio` sind dort
   unterstützt, aber nicht verifiziert.
6. Fließtexte innerhalb der Seiten sind weiterhin nicht im Editor pflegbar.
   Dieser Auftrag hat den Umfang der Pflegbarkeit nicht erweitert, sondern
   nur die Bildplätze ergänzt.

## 8. Fehlende beziehungsweise nicht freigegebene Originalfotografien

Benötigt werden acht Praxisaufnahmen und die Porträts. Im Drive-Bildmaterial
der Praxisakte liegt nur das Logo; es gibt keine freigegebene Fotografie.

| Bildplatz | Motiv | Format |
| --- | --- | --- |
| `homeAtmosphere` | Behandlungsraum im Tageslicht, weiter Ausschnitt | 21:8 |
| `homePortrait` | Sarah Weber im Praxisraum, ruhige Arbeitssituation | 4:5 |
| `arbeitsweiseHands` | Behandlung aus der Nähe, Hände und Bewegung | 16:6 |
| `therapieRoom` | Behandlungssituation, Befund und Bewegung | 16:6 |
| `teamGroup` | Team im Praxisraum, natürliche Situation | 16:6 |
| `praxisEntrance` | Ankommen, Eingang oder Empfang | 16:6 |
| `praxisRoom` | Praxisraum, Materialien und Licht | 4:3 |
| `karriereWork` | Arbeiten in der Praxis, Austausch im Team | 16:6 |

Dazu Porträts für Sarah Weber und die drei noch namenlosen Profile. Für jede
abgebildete Person werden Nutzungsrecht und Einwilligung benötigt.

Es wurden **keine** Stockfotos, keine generierten Praxisaufnahmen und keine
erfundenen Personen verwendet.

## 9. Bestätigung der Unverändertheit

| Gegenstand | Zustand |
| --- | --- |
| `origin/main` | `c5f512f…`, nicht angefasst |
| GitHub-Pages-Preview auf `main` | unverändert |
| `feat/sarah-portable-ssg` lokal und remote | `6405cd0…`, unverändert |
| Gemeinsamer Checkout `~/Projects/FRAME---Sarah-Weber` | Arbeitsbaum unverändert |
| Sarahs produktive Website, Tilmanns Plesk | nicht berührt |
| DNS, Hosting, Publishing-Konfiguration | nicht berührt |
| Google-Drive-Praxisakte, AI CONTEXT | nur gelesen |
| Merge, Cherry-Pick, Push, Deployment, Upload | keiner erfolgt |

## 10. Zustandsabgrenzung

- **Tatsächlich implementiert:** alle Abschnitte unter 4, im Eleventy-Template.
- **Lokal getestet:** Abschnitt 6, reproduzierbar per npm-Skript.
- **Visuell geprüft:** durch mich in Chromium an 1440/900/390px, alle sieben
  Seiten, Vorher/Nachher verglichen, mehrere Korrekturrunden.
- **Von Franklyn abgenommen:** **nein, ausstehend.**
- **Von Sarah oder Tilmann gesehen:** **nein.**
- **Produktionsreif:** **nein.**

---

**DESIGN REVIEW READY · AWAITING FRANKLYN VISUAL APPROVAL.**

Kein Merge nach `feat/sarah-portable-ssg`, kein Merge nach `main`, kein
Überschreiben der GitHub-Pages-Preview, kein produktiver Upload, keine
Weitergabe als freigegebene Kundenfassung, keine Aktualisierung der
Praxisakte mit einer angeblich abgeschlossenen Website-Freigabe.

---

## Nachtrag 2026-09-28 · Client-Preview-Pass

Franklyns visuelle Abnahmerunde umgesetzt, Commit `1cb9153` auf demselben
isolierten Branch. Einzelheiten stehen in der Commit-Nachricht und in
`DESIGN.md` unter „Client preview pass“.

- Seitenflächen nur noch Weiß und das etablierte Grün; Header grün,
  „Termin & Kontakt“ weiß mit grüner Schrift.
- Startseite: zweiteiliger erster Screen, mittleres Bild und Hinweissatz
  entfernt, Seitenkacheln ohne Pfeile, Behandlungs-Index grün mit weißer
  aktiver Zeile.
- Arbeitsweise als Sequenz 01 → 02 → 03; Therapie-Methodenübersicht neu;
  Team-Hero-Text unter die Überschrift; Karriere mit echten Accordions.
- Keine interne Sprache mehr auf der Website, Platzhalter ohne Etikett,
  offene Daten ausgeblendet statt erklärt.
- `npm run smoke` 273/273, `npm run contrast` alles WCAG AA.

Die vorläufigen Fotos (inzwischen in `src/images/vorlaeufig/`) stammen aus dem bisherigen
öffentlichen Praxisauftritt. Das Repository ist öffentlich; die Fotos sind
deshalb nicht in Git und dürfen erst nach geklärten Bildrechten committet
werden. Abschnitt 8 dieses Berichts (fehlende Originalfotografie) gilt
unverändert.

---

## Nachtrag 2026-09-28 · Inhaltsautonomie

Alle öffentlichen Seitentexte liegen jetzt in `src/_data/copy/<seite>.yaml`
und sind im lokalen Editor unter „Seiteninhalte“ pflegbar. Templates
enthalten nur noch Aufbau. Einzelheiten: `CONTENT.md` („Content ownership“),
Anleitung für Sarah: `EDITING.md`.

**Nachweis, dass die Umstellung selbst nichts verändert:** Textknoten-
Schnappschuss aller 7 Seiten × 3 Breiten vor und nach der Umstellung mit
unverändertem Wortlaut: 0 Abweichungen in Text und Position. Danach wurden
fünf Sätze mit Projekt- oder Entwicklersicht ausschließlich über die
Inhaltsdateien umformuliert; Team und Aktuelles blieben byte-identisch.

**Selbstpflege im echten Editor** (`npm run edit`, Browser-Automatisierung
der Editor-Oberfläche, je Bearbeiten → Vorschau → Build → Export geprüft,
danach vollständig zurückgesetzt):

| Test | Weg im Editor | Ergebnis |
| --- | --- | --- |
| A Seitentext | Seiteninhalte › Praxisbesuch › Text unter der Telefonnummer, zwei Absätze | zwei `<p>` in Vorschau und Export |
| B Bild | Praxisbilder › Praxisraum › Hochladen, Alternativtext, Bildausschnitt | Foto geladen, Alt-Text und Ausschnitt gesetzt |
| C Team | Team › Sarah Weber › Qualifikationen ergänzen | neue Qualifikation auf der Teamseite |
| D Aktuelles | Neuer Hinweis, veröffentlicht, Startseite an | Hinweis auf Startseite und Aktuelles-Seite, Leerzustand ausgeblendet |
| E Praxis-Angaben | Adresse Zeile 2 speichern | technische Werte inkl. `robots: noindex,nofollow` bleiben erhalten |

**Dabei gefundene und behobene Editorfehler** (bestanden vor dieser Runde):

- Aktuelles: Static CMS 4 kennt kein Widget `date`. „Veröffentlichen ab“ und
  „Läuft ab am“ waren im Editor nicht bedienbar. Jetzt `datetime`.
- Aktuelles: Ein leeres Ablaufdatum wurde mit dem heutigen Tag vorbelegt,
  jeder neue Hinweis wäre am Folgetag verschwunden. Jetzt `default: ""`.
- Aktuelles: Dateinamen enthielten Umlaute und Sonderzeichen. Jetzt ASCII.
- Praxisbilder: Hochgeladene Fotos landeten unter `src/_data/src/images/…`
  mit falschem Pfad. Jetzt eine gemeinsame Medienbibliothek `src/images/`.
- Praxis-Angaben: `robots`, `name`, `wordmark`, `tagline` hatten kein
  Editorfeld und hätten beim Speichern verloren gehen können. Jetzt
  unsichtbare Felder; Test E belegt den Erhalt.
- Team: zwei Felder ohne Wirkung auf die Website entfernt; Editor-Oberfläche
  auf Deutsch; die rohe Feldvorschau im Editor abgeschaltet.

**Portabilität:** Reinraum-Kopie der Quellen, `npm ci`, zwei Builds mit
leerer Umgebung (nur `PATH`, `HOME`): identische Prüfsumme, gleich dem
Build im Arbeitsbaum. Kein KI-, API-Schlüssel- oder GitHub-Bezug in
Website, Build oder Editor.

**Weiterhin offen:** der echte Upload auf Tilmanns Plesk (Abschnitt
„Selbst veröffentlichen“ in `EDITING.md`) und ein Probelauf auf Sarahs
eigenem Rechner mit ihr selbst am Editor. Technisch portabel ist belegt;
Sarahs eigener Arbeitsablauf ist es noch nicht.
