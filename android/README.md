# S-OPS Android

Offline-Android-Hülle mit Java Activity und System WebView. Paket `de.schifferstadt.sops`, Android 8+, SDK35, GLES3/WebGL2. Querformat, immersive Systemleisten, keine Internet-/Standort-/Speicherberechtigung, kein JavaScript-Native-Interface. Geschützte appassets-HTTPS-Origin mit blockierten externen Requests und Traversal-Prüfung.

Build: im Projektstamm `python3 tools/prepare-assets.py`, dann `cd android` und mit JDK17, SDK35 und Gradle8.9 `gradle --no-daemon :app:assembleDebug`. Kein Gradle-Wrapper enthalten. Die App bündelt `../../dist` aus Sicht des app-Moduls und prüft Game-/Bibliotheksdateien vor dem Build. Ausgabe `app/build/outputs/apk/debug/app-debug.apk`.

Installation: `adb install -r app/build/outputs/apk/debug/app-debug.apk`, Start `adb shell am start -n de.schifferstadt.sops/.MainActivity`. Die Debug-Signatur ist nicht stabil zwischen verschiedenen Buildrunnern; gegebenenfalls alte S-OPS-App entfernen. Stadtentdecker mit anderer Paket-ID bleibt erhalten.

Geräteabnahme offen: Offline-Kaltstart, WebGL2, Audio, gleichzeitiger Mehrfingerbetrieb, Pause/Hintergrund/Rückkehr, Bildschirmdrehen, Systemleisten, Leistung und Batterie auf realem Gerät. Der mobile Browsertest deckt das tatsächliche Spiel ab, ersetzt diese Prüfung aber nicht.
