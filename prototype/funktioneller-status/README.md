# Funktioneller Status · Prototyp für Sarah Weber / Raum & Zeit

Interaktiver Practitioner-Assist-Prototyp. Er zeigt, wie Vorarbeit strukturiert
werden kann, bevor Sarah fachlich entscheidet:

`STATUS → RELEVANTE FAKTOREN → FUNKTIONELLES PROBLEM → INTERVENTIONSKANDIDATEN → SARAH BESTÄTIGT → DOKUMENTATION`

## V3: einfacher Einstieg, Details erst auf Wunsch

Der Prototyp öffnet jetzt bewusst **nicht** mehr mit der kompletten Arbeitsfläche.
Sarah sieht zuerst nur drei Dinge: vier auffällige Hinweise aus dem Status, eine
kurze funktionelle Einschätzung und drei mögliche nächste Schritte. Erst über
„Fall genauer ansehen“, „Einschätzung bearbeiten“ oder einen konkreten Hinweis
öffnet sich die vollständige V1/V2-Detailtiefe.

- **Was fällt auf?** Vier knappe, zentral konfigurierbare Signale. Ein Klick
  springt direkt zum zugehörigen Statusfeld.
- **Funktionelle Einschätzung:** Im Einstieg nur als kurze lesbare Vorschau.
  Bearbeitung und Bestätigung bleiben einen Klick tiefer erhalten.
- **Mögliche nächste Schritte:** Genau drei Kandidaten im Einstieg. Übernehmen
  ist direkt möglich; Anpassen, weitere Kandidaten und Dokumentation bleiben im
  Detail.
- **Progressive Disclosure:** Faktoren, Kategorien, Beziehungslinien,
  Dokumentationsvorschau und die komplette Schrittleiste sind auf der Startseite
  nicht mehr sichtbar. Die bestehende fachliche State-/Dependency-Logik bleibt
  vollständig erhalten.

Präsentationsmaterial, **nicht** Teil der Praxis-Website: Er liegt außerhalb
von `src/`, wird weder von `npm run build` noch von `npm run export` erfasst
und kann deshalb nie mit der Website veröffentlicht werden.

## Nach Sarahs Feedback ändern

Fast alles steht in **`config.js`**. Die Oberfläche (`app.js`) liest nur von dort.

| Was | Wo in `config.js` |
| --- | --- |
| Titel, Demo-Hinweis, Fallbezeichnung | `meta` |
| Einfacher Einstieg: Signale, Kurztexte, drei bevorzugte Kandidaten | `overview` |
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

Aus diesen Verweisen entstehen im Hintergrund weiterhin Zusammenhänge und
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

## Nachweis (V3, 2026-10-04)

`npm run prototype:check`: 218 Prüfungen, 0 Fehler. Vereinfachter Einstieg und
komplette Detail-Geschichte jeweils über Offline-Server und `file://`; direkte
Wege vom Signal zum Statusfeld, von der Einschätzung zum Problem-Editor und vom
Kandidaten zum bestehenden Interventions-Editor; Zurücksetzen und Neuladen;
1440/900/390 px ohne horizontalen Überlauf oder abgeschnittene Bedienelemente;
Tastatur, reduzierte Bewegung, WCAG AA; kein externes Netzwerk und kein
Browser-Speicher.

Die Website-Implementierung unter `src/` ist gegenüber V2 unverändert;
`npm run build` und `npm run content-check` laufen erfolgreich.

## Nachweis (V2, 2026-10-04)

V2 hatte 325 bestandene Prüfungen und zeigte Status, Faktoren, funktionelles
Problem, Plan und Dokumentation gleichzeitig auf einer Arbeitsfläche. Diese
Variante bleibt als Git-Historie erhalten, wurde aber wegen zu hoher kognitiver
Dichte durch V3 ersetzt.

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
