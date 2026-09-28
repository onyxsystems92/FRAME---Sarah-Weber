# Raum & Zeit: Inhalte selbst pflegen

Alle Texte, Bilder, Teamprofile und Hinweise der Website pflegen Sie in
einem Editor auf Ihrem eigenen Rechner. Dafür brauchen Sie weder
Programmierkenntnisse noch GitHub, Franklyn, Tilmann oder eine KI.
Aufbau, Farben, Navigation und Verlinkung der Website sind geschützt und
lassen sich im Editor nicht versehentlich verändern.

## 1. Starten

Node.js und npm werden **einmalig** bei der Übergabe eingerichtet, ebenso
einmalig im Projektordner `npm ci`. Danach öffnen Sie das Terminal im
Projektordner und geben ein:

    npm run edit

Dann im Browser öffnen:

- **Editor:** http://127.0.0.1:8080/admin/ (auf „Login“ klicken, es gibt
  kein Passwort, weil der Editor nur auf Ihrem Rechner läuft)
- **Vorschau der Website:** http://127.0.0.1:8080/

Beides läuft ausschließlich auf Ihrem Rechner, nicht im Internet. Mit
Strg+C im Terminal beenden Sie beides. Nutzen Sie den Editor nur in Ihrem
eigenen, geschützten Benutzerkonto.

## 2. Wo Sie was ändern

| Im Editor links | Was Sie dort pflegen |
| --- | --- |
| **Seiteninhalte** | Alle Texte der sieben Seiten und der Fußzeile, nach Seite und Bereich geordnet: Überschriften, Einleitungen, Absätze, Ablauf-Schritte, Behandlungskontexte, Methodenliste, Karriere-Punkte, Hinweise zum Praxisbesuch, Texte der grünen Abschlusskästen |
| **Praxis-Angaben** | Telefonnummer, Adresse, Google-Maps-Link, Online-Terminlink (erscheint erst, wenn „bestätigt“ angehakt ist) |
| **Praxisbilder** | Die neun Fotos der Website: Foto austauschen, Alternativtext, Bildausschnitt |
| **Team** | Personen: Name, Rolle, Foto, Kurzbiografie, Qualifikationen; neue Person mit „Neue(r/s) Teammitglied“ |
| **Aktuelles** | Hinweise für Patientinnen und Patienten, z. B. Urlaub oder geänderte Erreichbarkeit |
| **Medien** | Alle hochgeladenen Fotos an einem Ort |

**Kleine Regeln für Texte**

- Eine Leerzeile beginnt einen neuen Absatz.
- In den Hinweisen unter „Praxisbesuch“ setzen `[Telefon]`, `[Adresse]`
  und `[Google Maps]` automatisch die aktuellen Praxis-Angaben ein. So
  steht die Telefonnummer nur an einer Stelle und bleibt überall richtig.
- Die fünf Behandlungskontexte, die vier Kennzeichen und die drei Schritte
  auf der Seite „Arbeitsweise“ haben eine feste Anzahl, weil das Layout
  darauf aufbaut. Die Texte darin sind frei änderbar.
- Die vier Besucherwege im grünen Kasten der Startseite sind fest
  vorgegeben und nicht im Editor änderbar.

**Fotos**

Unter „Praxisbilder“ öffnen Sie den gewünschten Bildplatz, klicken auf
„Anderes Bild wählen“, dann auf „Hochladen“, wählen das Foto und bestätigen
mit „Ausgewähltes Element verwenden“. Tragen Sie bitte immer einen kurzen
Alternativtext ein (was auf dem Foto zu sehen ist). Verwenden Sie nur
Fotos, deren Nutzungsrechte vorliegen, und bei Personen nur mit deren
Einwilligung. Ein leerer Bildplatz zeigt eine ruhige Fläche im richtigen
Format; das Layout bleibt gleich.

**Aktuelles**

Neuen Hinweis anlegen, Titel und Text schreiben, Status auf
„Veröffentlicht“ stellen und das Datum „Veröffentlichen ab“ setzen.
„Läuft ab am“ leer lassen, wenn der Hinweis unbegrenzt gelten soll; mit
Datum verschwindet er danach automatisch. Mit „Auch auf der Startseite
zeigen“ erscheint er zusätzlich auf der Startseite (höchstens zwei).
Hinweise im Status „Entwurf“ sind auf der Website nicht zu sehen.

Bitte niemals Patientennamen, Diagnosen oder andere Gesundheitsdaten
eintragen.

## 3. Vorschau

Nach jedem Speichern baut sich die Vorschau unter http://127.0.0.1:8080/
innerhalb weniger Sekunden neu auf. Seite im Browser neu laden, und Sie
sehen die Website genau so, wie sie später veröffentlicht wird.

## 4. Was „Veröffentlichen“ im Editor bedeutet

Der Knopf „Veröffentlichen“ → „Jetzt veröffentlichen“ **speichert Ihre
Änderung auf Ihrem Rechner**. Er lädt noch nichts ins Internet. Die
öffentliche Website ändert sich erst, wenn die fertige Website hochgeladen
wird (Abschnitt „Selbst veröffentlichen“ unten).

## 5. Was Sie nicht von Hand ändern sollten

Bitte nichts direkt in den Ordnern `src/_includes/`, `admin/`, `scripts/`
und nicht an den Dateien `*.njk`, `*.css`, `*.js`, `.eleventy.js` oder
`package*.json` ändern. Dort liegen Aufbau und Technik der Website. Alles,
was Sie inhaltlich pflegen möchten, finden Sie im Editor.

## Öffentlichen Export vorbereiten

    npm run export

Anschließend enthält der Ordner release/ ausschließlich die öffentlich
auszuliefernden HTML-, CSS-, JavaScript-, Bild- und Inhaltsdateien.
Die lokale Admin-Oberfläche und die bearbeitbaren Quellen bleiben draußen.
Der separate Ordner dist/ ist eine lokale Test-/Editor-Ausgabe und darf
nicht als öffentliche Website hochgeladen werden.

## Selbst veröffentlichen: erst nach Tilmanns Freigabe

Vor dem ersten echten Upload muss Tilmann den zulässigen SFTP-Host, einen
auf das Website-Ziel begrenzten Zugang, den korrekten Zielpfad, die
Host-Key-Prüfung, den Backup-/Rollback-Weg und die Betriebspflichten
bestätigen. Anmeldedaten und private SSH-Schlüssel bleiben auf Ihrem
Rechner, niemals in GitHub oder im Website-Quellordner.

Einmalig kann eine unversionierte Datei namens .env.publish im
Projektordner mit den **von Tilmann bestätigten** Angaben eingerichtet
werden (kein Passwort und kein privater Schlüssel in dieser Datei):

    RZ_SFTP_HOST=example.invalid
    RZ_SFTP_USER=sarah_site
    RZ_SFTP_REMOTE_PATH=/absoluter/von_tilmann_bestaetigter/pfad
    RZ_SFTP_PORT=22
    RZ_SFTP_KEY_PATH=/pfad/zu/Ihrem/privaten/ssh-schluessel

Die Beispielwerte sind **keine funktionsfähigen Zugangsdaten**.
Den Schlüssel/SSH-Agenten und den vertrauenswürdigen Host-Key richtet
Tilmann einmalig mit Ihnen ein. Die Datei .env.publish wird von Git ignoriert.

Nach erfolgter Freigabe: npm run publish:dry-run zeigt ohne Verbindung
die hochzuladenden Dateien; npm run publish:live baut die Website und
fragt vor dem SFTP-Upload zusätzlich nach einer ausdrücklichen
Bestätigung. Der Upload zu Tilmanns Server ist bislang NICHT getestet.
Erst wenn dieser echte Veröffentlichungsweg bestätigt und mit Ihnen
durchgespielt ist, kann selbstständiges Live-Publizieren als
abgeschlossen gelten. Bis dahin bitte nichts auf den Live-Host laden.

## Sicherung und Wiederherstellung

Sichern Sie den **gesamten Projektquellordner** regelmäßig außerhalb
des Rechners (mindestens src/, die Templates, package*.json,
.eleventy.js, admin/ ohne vendor/ und scripts/). Die Ordner
node_modules/, dist/ und release/ können neu erzeugt werden.
Eine Wiederherstellung aus einem Archiv wurde lokal in einer isolierten
Umgebung getestet; der Transfer auf Sarahs eigenen Rechner ist noch
einmal im Rahmen der Übergabe zu prüfen. Details: backups/RESTORE-TEST.md.

## Noch offen bis zur tatsächlichen Übergabe/Produktion

Sarah muss die realen Teamdaten/Fotos, Stammdaten, Impressum und
Datenschutzhinweise sowie Gestaltung und kaufmännisches Angebot abnehmen.
Tilmann muss den konkreten sicheren Hosting-/Publikationspfad freigeben.
Der öffentliche Livegang und die eigenständige SFTP-Veröffentlichung
können nicht ohne diese beiden Freigaben nachgewiesen werden.
