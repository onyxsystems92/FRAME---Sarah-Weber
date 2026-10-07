# Raum und Zeit · Technischer Review

Stand: 07.10.2026  
Prüfgegenstand: Branch `review/tilman-source-2026-10-07`

## Zweck

Dieses Paket ist der einheitliche technische Prüfstand für die Website von Raum und Zeit.

Tilman und ein weiterer unabhängiger technischer Prüfer sollen denselben Quellstand beurteilen. Maßgeblich ist deshalb nicht nur eine gerenderte Vorschau, sondern die Generator-, Template-, Daten-, Pflege-, Build- und Exportstruktur.

Die fachliche und gestalterische Endabnahme durch Sarah ist davon getrennt. Sarah kann danach Inhalte, Teamdaten, Qualifikationen, Bilder, Kontaktdaten und Hinweise weiter finalisieren, ohne die technische Grundarchitektur neu festlegen zu müssen.

## Technische Grundlage

Die Website ist eine klassische statische Multi-Page-Website mit sieben Seiten.

- Generator: Eleventy
- Template Engine: Nunjucks
- Inhaltsquellen: YAML und Markdown unter `src/`
- Lokaler Editor: Static CMS über einen ausschließlich lokal gebundenen Proxy
- Öffentlicher Export: statische Dateien in `release/`
- Lokale Vorschau: `dist/`

Der normale lokale Build benötigt kein LLM, keinen API Key und keinen GitHub-Zugang.

GitHub dient Entwicklung und Review. Es ist keine notwendige Laufzeit- oder Produktionsabhängigkeit der Website.

## Template und Definition

Für die technische Prüfung sind insbesondere relevant:

- `.eleventy.js` — Generator-Konfiguration
- `package.json` und `package-lock.json` — Abhängigkeiten und Build-Befehle
- `src/*.njk` und `src/_includes/` — Seitenstruktur und wiederverwendbare Templates
- `src/_data/copy/*.yaml` — öffentliche Seitentexte
- `src/_data/site.yaml` — Praxis- und Kontaktdaten
- `src/_data/images.yaml` — definierte Praxis-Bildplätze
- `src/team/` — Teamprofile
- `src/aktuelles/` — Praxisnews
- `admin/config.yml` — Definition der lokal pflegbaren Felder
- `scripts/export-site.js` — Erzeugung des öffentlichen Pakets
- `scripts/publish-sftp.js` — optionaler, noch nicht produktiv freigegebener SFTP-Weg
- `scripts/content-check.mjs` — Prüfung der Trennung von Inhalt und Templates
- `scripts/smoke-test.mjs` — Browser-Regression
- `scripts/contrast-check.mjs` — Kontrastprüfung
- `EDITING.md` — Pflege- und Übergabeanleitung
- `backups/RESTORE-TEST.md` — dokumentierter Wiederherstellungstest

## Lokale Reproduktion

Voraussetzung: Node.js 22.x und npm.

```bash
npm ci
npm run build
npm run export
```

`npm run build` erzeugt `dist/`.

`npm run export` erzeugt `release/`. Die lokale Admin-Oberfläche und die bearbeitbaren Quellen werden nicht in das öffentliche Paket übernommen.

Für die lokale Pflege:

```bash
npm run edit
```

Website: http://127.0.0.1:8080/  
Editor: http://127.0.0.1:8080/admin/

## Was Sarah lokal pflegen kann

Im aktuellen Editor sind vorgesehen:

- sämtliche öffentlichen Texte der sieben Seiten und der Fußzeile
- Praxis- und Kontaktdaten
- neun definierte Praxis-Bildplätze mit Alternativtext und Bildausschnitt
- Teammitglieder, Rollen, Fotos, Kurzbiografien und Qualifikationen
- Praxisnews und Hinweise

Die Templates enthalten Aufbau und technische Struktur, nicht die öffentlichen Fließtexte. `npm run content-check` prüft automatisiert, dass öffentliche Texte nicht wieder in Templates wandern, alle editierbaren Texte gerendert werden und die Editor-Felder zu den Quelldaten passen.

Bewusst nicht als freie Inhaltspflege angelegt sind technische Produktstrukturen wie Navigation, Layout, Komponentenlogik und die vier Besucherwege auf der Startseite. Solche Strukturänderungen bleiben technische Änderungen.

## Portabilität

Der öffentliche Export besteht aus statischen Dateien und kann auf einen geeigneten anderen Webspace übertragen werden.

Das Quellpaket kann lokal ohne Franklyns GitHub-Account installiert und neu gebaut werden. Backup und Restore wurden bereits in isolierter Umgebung geprüft.

Der technische Review-Workflow erzeugt zusätzlich aus exakt dem geprüften Commit ein bereinigtes Übergabepaket. Dieses Paket wird in einer separaten Umgebung erneut mit `npm ci` installiert und gebaut. Sein öffentlicher Export muss bytegleich bzw. dateigleich zum zuvor geprüften Export sein.

## Veröffentlichung und Hosting

Der technische Source-Review ist von der späteren Produktionsfreigabe getrennt.

Ein optionaler SFTP-Weg ist vorbereitet. Ein echter Livegang ist noch nicht freigegeben oder gegen Tilmanns reales Hosting getestet.

Vor Produktion offen:

- bestätigter Hosting-Zielpfad
- auf das Website-Ziel begrenzter Zugang
- Host-Key-Prüfung
- Backup- und Rollback-Prozess auf dem realen Server
- erster realer Transfer auf das Produktionssystem
- Bedienlauf auf Sarahs eigenem Rechner
- Sarahs fachliche, inhaltliche und gestalterische Endabnahme
- finale Prüfung von Impressum, Datenschutz, Stammdaten, Terminlink und Bildrechten

Diese offenen Punkte sind Produktions- und Übergabegates. Sie sind kein versteckter Bestandteil des Source-Reviews.

## Datenschutz und Datenumfang

Dieses Website-Paket verarbeitet keine Patientenakten oder Gesundheitsdaten.

Für die Websitepflege sollen keine Patientennamen, Diagnosen oder Gesundheitsdaten eingetragen werden.

Spätere Intelligence- oder Praxisfunktionen mit Gesundheitsdaten sind nicht Gegenstand dieses Website-Reviews und müssen separat technisch und datenschutzrechtlich geprüft werden.

Die im lokalen Design-Review zeitweise verwendeten vorläufigen Praxisfotos werden im technischen Review-Paket bewusst nicht mitgeliefert, weil ihre finale Bildfreigabe noch offen ist. Die dafür vorgesehenen Bildslots rendern deshalb mit der bereits implementierten neutralen Platzhalterdarstellung und bleiben über den lokalen Editor austauschbar.

## Automatisierte Prüfkette

Der Review-Branch enthält `.github/workflows/technical-review.yml`.

Geprüft werden:

1. Installation aus dem Lockfile mit `npm ci`
2. erfolgreicher Eleventy-Build
3. zwei Builds derselben Quelle auf identischen Output
4. Trennung von editierbarem Inhalt und Templates
5. öffentlicher Export nach `release/`
6. Ausschluss der lokalen Admin-Oberfläche aus dem öffentlichen Export
7. Browser-Smoke-Test der sieben Seiten bei 1440, 900 und 390 Pixel
8. Navigation, mobile Bedienung, Deep Links, Maps-Verhalten und Aktuelles-Rendering
9. WCAG-AA-Kontrastprüfung
10. Aufbau eines bereinigten Review-Pakets aus den maßgeblichen SSG-Quellen
11. erneute Installation und Reproduktion aus genau diesem Übergabepaket
12. Vergleich des daraus erzeugten öffentlichen Exports mit dem geprüften Repo-Export

## Fragen an den technischen Reviewer

Bitte den Review möglichst auf diese Fragen begrenzen:

1. Erzeugt dieselbe Quelle reproduzierbar denselben statischen Website-Output?
2. Ist die Website im normalen Betrieb ohne LLM und ohne GitHub nutzbar?
3. Sind Quellstruktur und öffentlicher Export so portabel, dass die Website auf ein anderes geeignetes Hosting übertragen werden kann?
4. Ist der lokale Pflegeweg für Sarah technisch nachvollziehbar und ausreichend von der Struktur getrennt?
5. Welche konkreten technischen Punkte fehlen vor einer sauberen Produktionsübergabe?

Bitte Findings möglichst mit Datei oder technischem Bezug, Risiko und gewünschtem Zielzustand benennen.

## Abgrenzung

Nicht Teil dieses technischen Reviews sind:

- Preis oder wirtschaftliche Bewertung
- persönliche Bewertung der verwendeten Entwicklungswerkzeuge
- Sarahs finale fachliche Freigabe
- spätere KI- oder Patientendaten-Anwendungsfälle
- die Behauptung, ein Produktions-Livegang sei bereits erfolgt

Ziel ist eine belastbare technische Bewertung eines gemeinsamen, reproduzierbaren Quellstands.
