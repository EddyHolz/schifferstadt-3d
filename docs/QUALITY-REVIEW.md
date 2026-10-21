# Qualitätsprüfung – 21.10.2026

Status: NICHT als fertig oder fotorealistisch abgenommen. Automatische Releases bleiben gesperrt.

## Nachgewiesen

- CI 39552998120: APK-Build und APK-v2-Signatur erfolgreich.
- Mobiler Offline-Gameplaytest: Schießen, Nachladen, zwei Maps, Reset und Pause bestanden.
- Echte gleichzeitige Touchkontakte: Bewegen+Sprint+Umsehen sowie Bewegen+Feuern+Umsehen bestanden.
- Loslassen einer einzelnen Kontakt-ID beendet die andere Kontakt-ID nicht.
- ADS-Projektion: zentrale 18% der Ansicht frei; tatsächliche Renderbilder geprüft.
- Neun fotografische CC0-PBR-Karten plus HDRI geladen, Farbräume geprüft; 8.35MB Download.

## Noch nicht erfüllt

- Die aktiven Spielmaps verwenden weiterhin fiktive Layouts.
- Sichtprüfung zeigt weiterhin primitive Gebäude und ein blockförmiges Waffenmodell. Keine Fotorealismus-Abnahme.
- Keine physische Android-Geräteprüfung, kein Nachweis dauerhaft stabiler 30 FPS am Zielgerät.
- Reale Schulaußenhüllen, Dächer, Fensterachsen und Materialien müssen mit vollständigen Referenzen rekonstruiert und gegengeprüft werden.

## Reale Referenzen

Offizielle Stadtfotos von Nord und Süd visuell gesichtet; nicht als Spieltexturen wiederverwendet. OSM-Referenzabruf erfolgreich, kein erratener Ersatz.
- Grundschule Nord: 255 Gebäude in der Referenzumgebung; 0 mit Höhenangabe, 3 mit Geschossangabe, 4 mit Dachform. Nachbargebäude sind nicht automatisch Schulgebäude.
- Grundschule Süd: 314 Gebäude in der Referenzumgebung; 0 mit Höhenangabe, 4 mit Geschossangabe, 0 mit Dachform. Nachbargebäude sind nicht automatisch Schulgebäude.

Ein exakter Außenbau kann aus diesen Grundrissen und wenigen Ansichten noch nicht bestätigt werden. Amtliche LoD2-Daten werden als zusätzliche Geometriequelle geprüft.
Eigene aktuelle Außenaufnahmen oder ein freigegebenes Gebäudemodell sind als fehlende Eingabe angefragt.
