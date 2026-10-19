# Schifferstadt Entdecker — Android-Prototyp

Android-App mit lokal eingebetteter 3D-Ansicht (Java/WebView + Three.js). Kein Backend, kein Account, keine Standortberechtigung. Echte OSM-Geometrie wird vor dem Build eingebunden. Umfang aktuell Innenstadt-Boundingbox 49.374–49.399 N / 8.354–8.395 E, nicht das gesamte Gemeindegebiet.

## APK aus GitHub Actions

Nach jedem Push auf `main` baut `.github/workflows/android-apk.yml` eine signierte Debug-APK. Der Workflow lädt echte Kartendaten und die 3D-Bibliothek, prüft die APK-Signatur und testet die mobile Weboberfläche mit gesperrten externen Requests. Unter https://github.com/EddyHolz/schifferstadt-3d/actions findet sich nach erfolgreichem Lauf das Artefakt **Schifferstadt-Android-APK** mit `Schifferstadt-Entdecker.apk`. Ein Android-Gerätetest bleibt separat erforderlich.

## Vorhanden

- Begehbare Gebäude-/Straßengeometrie, Gebäudekollisionen, Vogelperspektive.
- Touch-Blicksteuerung, Bewegungstasten, Pinch-Zoom und Zoomknöpfe.
- Simulierter Tageszeitregler, mobile sparsame Darstellung und Detailmodus.
- Lokal gespeicherte Lieblingspositionen, bis zu 30 pro Gerät.
- Android-Hülle mit geschützter lokaler HTTPS-Asset-Origin, ohne native JavaScript-Brücke.
- Projektphasen und unabhängiges Entwicklerreview in PROJECT.md.

## Start / APK bauen

1. JDK 17, Gradle 8.9 und Android SDK 35 installieren (oder Android Studio verwenden).
2. Im Projektstamm `python3 tools/prepare-assets.py` ausführen. Benötigt Internet; lädt Three.js 0.170.0 samt MIT-Lizenz und reale OpenStreetMap-Daten. Keine erfundenen Gebäude.
3. `cd android` und `gradle --no-daemon :app:assembleDebug` ausführen.
4. APK: `android/app/build/outputs/apk/debug/app-debug.apk`; mit `adb install -r` installieren.

Der Build prüft auf fehlende Offline-Assets und bricht mit einer Anleitung ab. Die Android-App blockiert externe Ressourcen; der CDN-Fallback ist nur für Webentwicklung. Schriftarten verwenden in Android den lokalen System-Fallback.

## Tatsächlich geprüft / offen

JavaScript-Syntax geprüft, Android-Quelltext statisch gegengeprüft. In der bereitgestellten Umgebung fehlen Android SDK und Gradle; der HTTP-Proxy war nicht erreichbar. Daher konnten Bibliothek und Stadtdaten noch nicht heruntergeladen, keine APK gebaut und keine Geräte-/Bildprüfung durchgeführt werden. Der aktuelle Quellstand ist noch keine fertig getestete App. Offlinefunktion und Leistung müssen nach dem Assetimport am Gerät geprüft werden.

Das Modell verwendet angenäherte Gebäudehöhen, ebene Straßen und keine fotografischen Fassaden. Keine geprüfte Navigation, Barrierefreiheit oder Live-Öffnungszeiten. Fotorealismus braucht geeignete lizenzierte Aufnahmen und ist eine spätere Projektphase.

Daten: © OpenStreetMap-Mitwirkende, ODbL, https://www.openstreetmap.org/copyright . Datenstand entspricht dem Downloadzeitpunkt. Three.js: MIT, Lizenz wird mit heruntergeladen. Keine öffentliche Website veröffentlicht; dieses Projekt wird als Android-Quellprojekt übergeben.
