# Raum & Zeit · Website

**Stand: nahezu abnahmefertige, lokale Review-Version; nicht produktiv.**
Die bestehende GitHub-Pages-Preview auf main bleibt bis zur ausdrücklichen
Freigabe unverändert. Diese Umsetzung liegt auf feat/sarah-portable-ssg.

## Lieferumfang und Architektur

Sieben Seiten: Startseite, Arbeitsweise, Therapie, Team, Praxisbesuch,
Karriere und Aktuelles. Die bestehende Navigation Home, vier Besucherwege,
sechs Seitenkarten, interaktiven Accordions und direkten Termin-/Kontaktwege
bleiben erhalten. Das visuelle System folgt DESIGN.md mit behutsamen
Designverbesserungen und einer verstärkten Teampräsenz. Vorhandene
Praxisangaben und Qualifikationen sind vor dem Livegang mit Sarah abzugleichen.

Der statische Generator ist Eleventy. Die einzigen bearbeitbaren
Inhaltsquellen liegen in src/ (Team und Aktuelles als Markdown,
Überschriften und Einleitungen in src/_data/copy.yaml, allgemeine
Praxisangaben in src/_data/site.yaml). Die weiteren Seitentexte sind
im Template und noch nicht als einzelne CMS-Felder pflegbar. Layouts liegen in src/_includes.
Das generierte JSON für Aktuelles ist ausschließlich ein Build-Artefakt;
es ist keine zweite Inhaltsdatenbank. GitHub wird für Entwicklung und
Review verwendet und ist für Sarahs spätere Routinepflege nicht nötig.
Die Site baut lokal ohne KI. Eine künftige FRAME-Anbindung ist optional
und darf die führende Inhaltsquelle nicht ersetzen.

## Lokales Prüfen und Inhalte pflegen

Node.js 20.11+ und npm sind einmalig auf Sarahs eigenem Rechner
einzurichten. Im Projektverzeichnis:

1. Einmalig: npm ci
2. Editor und Website gemeinsam starten: npm run edit
3. Website: http://127.0.0.1:8080/
4. Editor: http://127.0.0.1:8080/admin/
5. Mit Strg+C beenden.

Der Editor schreibt über einen auf 127.0.0.1 beschränkten lokalen Proxy
direkt in src/. Das CMS-Knöpfchen Publish speichert **nur lokal**.
Es lädt nichts zum Hosting hoch. Details: EDITING.md.

## Review, Export und Veröffentlichung

npm run export baut die Website und schreibt eine ausschließlich öffentliche
statische Ausgabe nach release/; die lokale Admin-Oberfläche ist explizit
ausgeschlossen. Nur release/ (nicht das ganze Repository, nicht dist/ und
nicht src/) gehört auf einen Webserver. Vor Produktion sind bestätigte
Praxisinhalte, Rechtsangaben, Datenschutz/Fonts, Domain/Indexierung,
Team-Fotorechte und Sarahs Gesamtabnahme erforderlich. Aktuell tragen
alle Seiten noindex,nofollow; die Schriftdateien werden in dieser Version lokal ausgeliefert;
die vollständigen Datenschutz-/Rechtsinhalte sind vor einem öffentlichen
Livegang dennoch zu prüfen. Die Review-Version ist somit **nicht freigegeben für Produktion**.

Ein optionales npm run publish:dry-run erstellt ohne Netzwerkverbindung
eine Upload-Vorschau. npm run publish:live kann später nach einmaliger
Einrichtung einer persönlichen, auf das Zielverzeichnis beschränkten
SFTP-Berechtigung durch Tilmann die öffentlichen Dateien übertragen.
Dieser echte Plesk-Pfad wurde noch nicht getestet oder freigegeben.
Für den SFTP-Batch-Modus ist ein eingerichteter SSH-Schlüssel bzw.
SSH-Agent und geprüfter Host-Key notwendig, kein Passwort im Quellcode.
Der Live-Aufruf verlangt zusätzlich eine bewusste Eingabe des Hostnamens.
EDITING.md enthält die nötigen Schritte und die Verbleibenden-Gates-Liste.

## Technische Prüfung

Lokale Prüfkette: npm ci, npm run export; Vorschau über npm run edit,
Browser-Regression mit scripts/smoke-test.mjs an 1440/900/390 Pixel,
UI-Test für Team-/News-Änderung, wiederholbarer Build und Restore aus
vollständiger Quell-Sicherung in einer isolierten Umgebung. Ein lokaler
Build oder ein GitHub-Commit ist **kein** Nachweis für einen produktiven
Upload. Jede konkrete Prüfung muss mit Datum und Ergebnis belegt werden;
nicht durchgeführte Schritte bleiben offen.

## Noch von Menschen zu bestätigen

Sarah: Teamliste und echte Portraits samt Foto-Freigaben; Rolle/Biografien/
Qualifikationen, korrekte PLZ, E-Mail, Online-Termin-Link, Impressum und
Datenschutz, Inhalte/Design, wirtschaftliche Konditionen und Gesamtfreigabe.
Tilmann: Hosting-Verzeichnis, eigener Sarah-Zugang mit minimalen Rechten,
SFTP-/Rollback-/Backup-Prozess, Font-/Datenschutz-Konzept und technisches
Go für Produktion. Kein produktiver Upload ohne diese Entscheidungen.

## Zuständigkeit

Franklyn: Website-Produkt, Template, Gestaltung und Übergabe.
Sarah: fachliche Wahrheit, Routinepflege und finale Freigabe.
Tilmann: bestehendes Hosting, Plesk, serverseitige Sicherheit und der
freigegebene Publikationszugang. Ein späteres FRAME-Abonnement ist
keine Voraussetzung für die eigenständig nutzbare Website.
