# Schifferstadt Explore für Android

Native Java-Activity mit Android System WebView, ohne AndroidX-Abhängigkeit. Die Weboberfläche wird beim Build unverändert aus `../dist` eingebunden; im Modul ist dies `../../dist`. Die App liest alle Ressourcen aus ihrem APK und sperrt externe Requests. Lokal gespeicherte Favoriten bleiben über DOM Storage erhalten.

## Build

Voraussetzungen: **JDK 17**, lokal installiertes **Gradle 8.9**, Android SDK mit **platforms;android-35** und **build-tools;35.0.0**, akzeptierte SDK-Lizenzen und Netzwerk für den ersten Gradle-Abhängigkeitsdownload sowie die einmalige Datenvorbereitung auf dem Build-Rechner. Die gebaute App startet vollständig offline. Android Gradle Plugin: **8.7.3**. Keine Gradle-Wrapper-JAR enthalten: `./gradlew` existiert deshalb bewusst nicht.

Im Verzeichnis `android` ausführen:

```sh
# ANDROID_HOME muss auf das installierte Android SDK zeigen.
gradle --version
python3 ../tools/prepare-assets.py
gradle --no-daemon :app:assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n de.schifferstadt.explore/.MainActivity
```

Alternativ das Verzeichnis in Android Studio öffnen und dieselbe Gradle-Version konfigurieren. Vorher muss `../dist/index.html` einschließlich aller JavaScript-, Vendor- und Datendateien existieren. Der Gradle-Build bricht bei fehlenden App-, Lizenz-, Vendor- oder Stadtdaten ab. Eine Laufzeit-Fehlerseite bleibt für beschädigte/unvollständige Installationen vorhanden. Build-Ausgabe: `app/build/outputs/apk/debug/app-debug.apk`. Die Debug-Signatur dient Entwicklung und lokalem Test. Veröffentlichung benötigt eigenen Release-/Signierungsprozess.

## Sicherheitsprüfung des Quelltexts

- HTTPS-Origin ausschließlich `appassets.androidplatform.net`, Standardport/443, ohne Userinfo.
- Nur GET auf `/assets/`; keine Netzwerk-Fallbacks für unbekannte Pfade oder fremde Hosts.
- Dekodierte Pfadsegmente dürfen weder `.` noch `..`, leere Segmente, Backslash, Prozentzeichen oder Steuerzeichen enthalten. Dies blockiert einfache und doppelte Traversal-Kodierung.
- Android AssetManager liefert ausschließlich gebündelte Dateien; kein Dateisystemzugriff, keine Content-URI-Freigabe, kein JavaScript-Native-Interface.
- JavaScript und DOM Storage sind für Karte/Favoriten aktiviert. Klartext, Mixed Content, Popup-Fenster und WebView-Debugging sind gesperrt.
- JavaScript-Module erhalten `text/javascript`, JSON `application/json`, WASM `application/wasm`; `nosniff` verhindert MIME-Raten.
- Keine Kamera-, Mikrofon-, Standort- oder Speicherberechtigungen. Keine TLS-Ausnahmen. INTERNET ist deklariert, externe Requests bleiben aktuell blockiert.

Diese statische Prüfung ist kein Nachweis eines APK-Builds oder eines Gerätetests. Gegenprüfen: normale `.js`-Imports und JSON laden; `../`, `%2e%2e`, `%252e%252e`, Backslashes und fremde Hosts dürfen keine Ressourcen liefern. Nach Netzwerk-Ausfall muss der Offline-Start funktionieren.

## Gerätetest noch erforderlich

Android 8 und aktuelles Android, aktualisierte Android System WebView, GLES 3/WebGL-fähiges Gerät. Prüfen: erster Start ohne Internet, echte Stadtdaten geladen, Bewegung und Blick per Touch, Tageszeit, Favoriten, Rotation, Zurück-Taste, App pausieren/fortsetzen, Systemleisten ohne verdeckte Bedienelemente, mindestens 30 FPS mit reduziertem Detailgrad auf dokumentiertem Gerät. Die Karte ist ein vereinfachtes Gebäudemodell, keine fotografische Street-View-Aufnahme.
