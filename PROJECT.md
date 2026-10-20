# S-OPS · Projektstand

Der Nutzer hat die Stadterkundungs-App in einen Android-Ego-Shooter mit einzelnen Schifferstadt-bezogenen Maps umbeauftragt. Produkt ist ein eigenständiger Arcade-Prototyp mit fiktiven Arenen. Die alte Entdecker-APK bleibt als historisches Release erhalten.

## Umsetzung

- Nordcampus und Südcampus: frei entworfene Karten, keine realen Schulgrundrisse oder Adressen.
- 120 Sekunden Kontrollpunkt gegen fünf robotische Trainingsgegner.
- Zwei Waffen, Feuern/Nachladen/Visier, Sprint, Regeneration und Respawn.
- Kollisionsprüfung und Sichtlinien, Bot-Wegsuche, verdeckte Einstiegsposition.
- Touchlinks bewegen, rechts umsehen, separate Aktionstasten; Querformat und immersive Android-Hülle.
- Eigene prozedurale Modelle, Oberflächen und Audioeffekte. Kein CoD-Name im Produkt, keine übernommenen Assets.

## Entwicklerkontrolle

Engine-Entwickler: Rendering, Waffen, Botnavigation und Matchzustand. Map-Entwickler/Reviewer: zwei verschiedene Layouts und unabhängige Erreichbarkeits-/Sichtlinienprüfung. Projektleitung: Integration, Touch-UI, Android-Hülle, CI, Tests und Release.

Layout-Validator prüft Grenzen, freie Startpunkte, Erreichbarkeit von Kontrollpunkt und Botpositionen sowie drei durchgängige Routen. Reviewer prüfte Engine separat und veranlasste Rücksetzen gehaltener Eingaben bei Pause und einheitliches Betonmaterial für die Südhalle. Instanzierte Umgebung reduziert Zeichnungsaufrufe.

## Abnahme

Automatischer mobiler Offline-Browsertest prüft beide Starts, fünf Bots, Munitionsverbrauch beim Feuern, zeitgesteuertes Nachladen, Joystickbewegung, Blicksteuerung, Visier, eingefrorene Pause und Mapwechsel mit zurückgesetztem Zustand. APK-Build und Signaturprüfung laufen auf GitHub Actions. Release nur nach erfolgreichem Build und Browsertest.

Ergebnisse müssen am tatsächlichen neuen Commit geprüft werden. Kein Test auf einem physischen Android-Gerät behauptet. Erste synthetische 3D-Grafik, kein MW2-/AAA-Qualitätsversprechen, kein Online-Multiplayer. Die Namen bezeichnen fiktive Trainingsarenen und keine nachgebauten Schulen.
