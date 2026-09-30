# Funktioneller Status · Prototyp für Sarah Weber / Raum & Zeit

Interaktiver Practitioner-Assist-Prototyp. Er zeigt, wie Vorarbeit strukturiert
werden kann, bevor Sarah fachlich entscheidet:

`STATUS → RELEVANTE FAKTOREN → FUNKTIONELLES PROBLEM → INTERVENTIONSKANDIDATEN → SARAH BESTÄTIGT → DOKUMENTATION`

Präsentationsmaterial, **nicht** Teil der Praxis-Website: Er liegt außerhalb
von `src/`, wird weder von `npm run build` noch von `npm run export` erfasst
und kann deshalb nie mit der Website veröffentlicht werden.

## Nach Sarahs Feedback ändern

Fast alles steht in **`config.js`**. Die Oberfläche (`app.js`) liest nur von dort.

| Was | Wo in `config.js` |
| --- | --- |
| Titel, Demo-Hinweis, Fallbezeichnung | `meta` |
| Die fünf Schritte, Überschriften, Einleitungen | `steps` |
| Statusfelder: Name, Reihenfolge, Hinweis, Größe, Gruppe | `statusFields`, `statusGroups` |
| Faktor-Kategorien (veränderbar / Kontext / offen) | `factorCategories` |
| Arten im funktionellen Problem | `statementTypes` |
| Interventionskategorien | `interventionCategories` |
| Demo-Fall: Status, Faktoren, Arbeitshypothese, Kandidaten | `demoCase` |
| Überschriften und Formulierungen der Dokumentation | `documentation` |
| Alle Button- und Hinweistexte | `text` |

Regeln: Reihenfolge in einer Liste ist Reihenfolge in der Oberfläche. `id`
ist ein technischer Schlüssel; Labels sind frei. Verweise laufen über ids:
ein Faktor nennt mit `source` sein Statusfeld, Einträge und Kandidaten nennen
mit `factorIds` ihre Faktoren. Nur synthetische Inhalte.

Wird ein Statusfeld geändert, markiert der Prototyp die daraus abgeleiteten
Faktoren mit „Status geändert · prüfen“. Wird ein Faktor entfernt oder
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
