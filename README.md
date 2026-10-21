# S-OPS · Schifferstadt Arenas

**Qualität nicht abgenommen.** Die Veröffentlichung neuer APKs ist gesperrt, bis visuelle Qualität und echte Außenrekonstruktionen nachgewiesen sind. Fortschritt und offene Lücken: [Qualitätsprüfung](docs/QUALITY-REVIEW.md). Die bisherigen Release-Maps sind fiktiv und erfüllen den geforderten exakten Schulnachbau nicht.

Eigenständiger Android-Arcade-Ego-Shooter-Prototyp. Zwei **frei entworfene** Trainingsarenen mit lokalem Namensbezug: Nordcampus und Südcampus. Keine geografisch genaue Darstellung oder Grundrisse realer Schulen, keine CoD-Assets. Eigenständige synthetische Grafik, kein AAA-/MW2-Grafikniveau.

## Spielen

[Android-Releases](https://github.com/EddyHolz/schifferstadt-3d/releases): das neueste **S-OPS**-Release öffnen und unter Assets `Schifferstadt-SOPS.apk` herunterladen. Benötigt Android 8+, aktuelle Android System WebView, WebGL2. Eigene Paket-ID `de.schifferstadt.sops`; kann neben dem früheren Stadtentdecker installiert werden. Läuft offline im Querformat ohne Internet-, Standort- oder Speicherberechtigung.

- 120-Sekunden-Kontrollpunkt-Matches gegen fünf Trainingsroboter.
- Nordcampus: Backsteinhöfe mit drei Routen. Südcampus: moderne Halle und Ladehof.
- Zwei eigenständige Waffen: VX-7 und Falcon; Magazinwechsel, Visier und Sprint.
- Deckung und Sichtlinien, Trefferfeedback, Regeneration, Respawn und Ergebnisanzeige.
- Links bewegen, rechts streichen für Blickrichtung, rechts Feuern/Visier/Nachladen.
- Desktop: WASD, Maus ziehen, Leertaste feuern, R nachladen, Shift sprinten, Esc Pause.

## Build

JDK 17, Gradle 8.9, Android SDK35. Im Projektstamm:

```sh
python3 tools/prepare-assets.py
node tools/validate-maps.mjs
cd android
gradle --no-daemon :app:assembleDebug
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`. Three.js 0.170.0 und MIT-Lizenz werden vor dem Build heruntergeladen. Arenen, Texturen, Audio und Modelle entstehen im eigenen Code. Kein Google- oder OSM-Bild-/Kartendownload.

GitHub Actions baut auf `main`, prüft Layouts, APK-Signatur und mobile Offline-Gameplay-Integration. Erst nach erfolgreichen Prüfungen veröffentlicht der separate Workflow einen direkten APK-Download als Vorabversion. QA-Screenshots und Bericht stehen als Build-Artefakt bereit.

## Umfang und Grenzen

Erster spielbarer Einzelspieler-Prototyp, kein Online-Multiplayer. Keine fotografisch rekonstruierten Orte oder echten Schulgelände. Desktop-/Touch-Browsertests ersetzen keinen physischen Android-Gerätetest. Die Vorabversion wird mit einem Entwicklungsschlüssel signiert, der zwischen Builds wechseln kann; gegebenenfalls alte S-OPS-Version deinstallieren.
