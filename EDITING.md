# Raum & Zeit: Inhalte selbst pflegen

## Starten

Die Website befindet sich in einem eigenen Ordner auf Ihrem Rechner.
Node.js und npm werden **einmalig** bei der Übergabe eingerichtet.
Öffnen Sie dort das Terminal. Einmalig ausführen: npm ci.
Danach genügt zum Bearbeiten und zur Vorschau:

    npm run edit

Öffnen Sie http://127.0.0.1:8080/admin/ für den Editor und
http://127.0.0.1:8080/ für die Vorschau. Beide Dienste laufen ausschließlich
auf Ihrem eigenen Rechner (127.0.0.1), nicht auf einer öffentlichen Website.
Mit Strg+C beenden Sie beide zusammen. Verwenden Sie den Editor nur in
Ihrem eigenen geschützten Benutzerkonto.

## Inhalte bearbeiten

Im deutschen Editor: Seitentexte (Überschriften und Einleitungen aller
sieben Seiten); Praxis-Angaben; Team (Person und Foto ergänzen oder
bearbeiten); Aktuelles (Hinweis mit Titel, Text, Datum und Status).
Für weitere Fließtexte innerhalb der Seiten ist derzeit eine Anpassung
der Templates durch Franklyn nötig; diese sind keine frei editierbaren
Textfelder im lokalen Editor. Ein
Teamfoto benötigen Sie nur mit Einwilligung der betroffenen Person.
Das Knöpfchen Publish beziehungsweise Speichern schreibt die Änderung
in die Quelldateien dieses Rechners; die Vorschau wird neu gebaut.
**Es ist noch keine Veröffentlichung im Internet.**

Bitte keine Patientennamen, Diagnosen oder Gesundheitsdaten eintragen.
Aktuelles im Status Entwurf gehört nicht auf die öffentliche Website.
Inhaltliche und gestalterische Grundstruktur bleiben im Template geschützt.

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
