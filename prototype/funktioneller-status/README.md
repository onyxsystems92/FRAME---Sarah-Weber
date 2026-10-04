# Funktioneller Status · Prototyp für Sarah Weber / Raum & Zeit

Interaktiver Practitioner-Assist-Prototyp. Er zeigt, wie Vorarbeit strukturiert
werden kann, bevor Sarah fachlich entscheidet:

`STATUS → RELEVANTE FAKTOREN → FUNKTIONELLES PROBLEM → INTERVENTIONSKANDIDATEN → SARAH BESTÄTIGT → DOKUMENTATION`

## V2: Überblick als Arbeitsfläche

Der Prototyp öffnet im **Überblick**: Fall, Statussignale, Faktoren (veränderbar /
Kontext / offen), Arbeitshypothese mit Bestätigung, Plan und Vorschläge sowie
eine laufend erzeugte Dokumentationsvorschau auf einer Fläche. Die Bereiche
stehen in der Denkrichtung von links nach rechts.

- **Zusammenhänge:** Ein gewähltes Element (Klick, Enter/Leertaste) zeigt, was
  über Faktoren damit verbunden ist: Verbundenes bekommt Fläche, der Rest tritt
  zurück, auf breiten Bildschirmen verbinden feine Linien die Nachbarbereiche.
  Eine Zeile oben nennt die Verbindungen auch für Screenreader. Escape hebt auf.
- **Prüfbedarf:** Jeder Faktor merkt sich seine Statusfelder, jeder Eintrag und
  jede Intervention ihre Faktoren. Ändert sich eine Grundlage, steht dort
  „Grundlage geändert · prüfen“; nichts wird gelöscht oder umgeschrieben.
  „Geprüft“, Bearbeiten, Übernehmen oder Bestätigen setzt die Grundlage neu.
  Eine bestätigte Arbeitshypothese bleibt bestätigt, wird aber bei geänderter
  Grundlage als „Bestätigt · Grundlage geändert“ gekennzeichnet.
- **Detail:** Die fünf Schritte aus V1 bleiben vollständig erhalten. Jedes
  Element führt direkt in seinen Editor; „Zum Überblick“ kehrt mit erhaltener
  Auswahl zurück.

Präsentationsmaterial, **nicht** Teil der Praxis-Website: Er liegt außerhalb
von `src/`, wird weder von `npm run build` noch von `npm run export` erfasst
und kann deshalb nie mit der Website veröffentlicht werden.

## Nach Sarahs Feedback ändern

Fast alles steht in **`config.js`**. Die Oberfläche (`app.js`) liest nur von dort.

| Was | Wo in `config.js` |
| --- | --- |
| Titel, Demo-Hinweis, Fallbezeichnung | `meta` |
| Überblick: Hinweistext, Länge der Doku-Vorschau | `overview` |
| Die fünf Schritte, Überschriften, Einleitungen, Bereichstitel im Überblick | `steps` (`zone`) |
| Statusfelder: Name, Reihenfolge, Hinweis, Größe, Gruppe, Platz im Überblick | `statusFields` (`overview`), `statusGroups` |
| Faktor-Kategorien (veränderbar / Kontext / offen) | `factorCategories` |
| Arten im funktionellen Problem | `statementTypes` |
| Interventionskategorien | `interventionCategories` |
| Demo-Fall: Status, Faktoren, Arbeitshypothese, Kandidaten | `demoCase` |
| Überschriften und Formulierungen der Dokumentation | `documentation` |
| Alle Button- und Hinweistexte | `text` |

Regeln: Reihenfolge in einer Liste ist Reihenfolge in der Oberfläche. `id`
ist ein technischer Schlüssel; Labels sind frei. Verweise laufen über ids:
ein Faktor nennt mit `sources` seine Statusfelder, Einträge und Kandidaten nennen
mit `factorIds` ihre Faktoren. Nur synthetische Inhalte.

Aus diesen Verweisen entstehen die Zusammenhänge im Überblick und der
Prüfbedarf: Wird ein Statusfeld geändert, zeigen die daraus abgeleiteten
Faktoren und alles, was auf ihnen beruht, „Grundlage geändert · prüfen“. Wird ein Faktor entfernt oder
umgeordnet, zeigen die Bezug-Chips in Problem und Interventionen das an. Jede
Änderung am bestätigten Problem setzt es zurück auf Entwurf.

## Ansehen, prüfen, ausliefern

```sh
npm run prototype:export   # → prototype-release/funktioneller-status/
npm run prototype:check    # Export + kompletter Browser-Durchlauf
```

`prototype-release/funktioneller-status/` enthält `site/` (der Prototyp),
den Offline-Starter `Funktioneller Status starten.command` mit
`serve-local.mjs` (nur Node-Bordmittel, nur 127.0.0.1), `LIES MICH.txt` und
`MANIFEST.json` (Quell-Commit und SHA-256 je Datei). `site/index.html`
funktioniert auch per Doppelklick direkt aus dem Dateisystem.
Schriften und Logo kopiert der Export aus `src/assets/`, die Website bleibt
damit die einzige Quelle der Markenelemente.

## Grenzen (bewusst)

- Kein Backend, keine Datenbank, keine API, kein LLM, keine Analytics.
- Zustand nur im Arbeitsspeicher; kein localStorage, keine Cookies. Neu laden
  setzt die Demo zurück.
- Content-Security-Policy `connect-src 'none'`: der Prototyp kann nichts senden.
- `noindex,nofollow,noarchive`.
- Vorschläge sind vorformuliert (Demo-Fall), nicht berechnet. Die fachliche
  Entscheidung bleibt bei Sarah: übernehmen, anpassen, entfernen, ergänzen.

## Nachweis (V2, 2026-10-04)

`npm run prototype:check`: 325 Prüfungen. Überblick-Geschichte und
Detail-Geschichte jeweils über den Offline-Server und über `file://`;
Überblick zuerst, alle Kernelemente bei 1440×900 ohne Scrollen sichtbar;
Zusammenhänge für Status, Faktor, Eintrag, Intervention; Prüfbedarf nach
Statusänderung, Faktoränderung, Umordnung und Entfernen; Bestätigung mit
nachträglich geänderter Grundlage; Plan und Dokumentationsvorschau reagieren;
Hin- und Rückweg zwischen Überblick und Detail; Zurücksetzen und Neuladen;
1440/900/390 px ohne Überlauf oder abgeschnittene Bedienelemente;
Tastatur, reduzierte Bewegung, WCAG AA; kein Netzwerk, kein Browser-Speicher.

Website-Regression: `release/` aus sauberer Quelle am Website-Stand `4e2aa24`
und aus diesem Branch sind byte-identisch (20 Dateien).

## Nachweis (V1, 2026-09-30)

`npm run prototype:check`: 143 Prüfungen, einmal über den Offline-Server und
einmal über `file://`: alle fünf Schritte; Statusfeld ändern; Faktor
bearbeiten, entfernen und rückgängig, ergänzen, umordnen; Arbeitshypothese
editieren, bestätigen, nach Änderung erneut bestätigen; Eintrag ergänzen und
umtypisieren; Intervention übernehmen, anpassen (mit Umfang), entfernen,
eigene hinzufügen; Dokumentation spiegelt jeden dieser Zustände; manuelle
Bearbeitung bleibt erhalten, veraltete Stände werden angezeigt und neu
erzeugt; Kopieren und Sichern als Textdatei; Zurücksetzen. Außerdem: keine
Anfrage außerhalb des Prototyps, kein Browser-Speicher, keine Konsolenfehler,
kein horizontales Überlaufen bei 1440/900/390 px, Tastaturfokus, reduzierte
Bewegung, WCAG AA für jeden gerenderten Textknoten.

Website-Regression: `npm run build && npm run export` erzeugt vor und nach
dieser Änderung byte-identische 20 Dateien in `release/`.
