# Schifferstadt Explore — Projekt und Qualitätsvertrag

## Ziel
Eine Android-App mit einer frei begehbaren 3D-Karte von Schifferstadt: von der Übersicht direkt auf Augenhöhe, mit verständlicher Orientierung, interessanten Orten und spürbar flüssiger Bedienung. „Besser als Street View“ ist das Produktziel, kein bereits nachgewiesener Qualitätsstand.

## Datenlage und ehrliche Grenzen
Ein Gebäudemodell aus OpenStreetMap kann Straßen und Gebäude räumlich verständlich machen; es liefert keine fotografischen Fassaden. Geschätzte Gebäudehöhen müssen als Schätzung erkennbar sein. LoD2-Modelle enthalten typischerweise vereinfachte Dachformen, aber keine vollständigen Fassadentexturen. Luftbilder zeigen Dächer, nicht zuverlässig den Blick vom Gehweg.

Diese Recherche konnte öffentliche Endpunkte wegen der Netzwerkbeschränkung nicht live prüfen. Stadtweite Panorama-, LoD2- oder Gaussian-Splat-Abdeckung ist deshalb **nicht bestätigt**. Vor einer solchen Behauptung müssen Datensatz, räumliche Abdeckung, Aktualität, Nutzungsrecht und ein Sichttest dokumentiert werden.

Prüfkandidaten:
- OpenStreetMap und Overpass: Straßen, Gebäude, Wege, ausgewählte POIs; ODbL, sichtbare Namensnennung und Prüfung der Datenbankpflichten. https://www.openstreetmap.org/copyright
- Vermessungs- und Katasterverwaltung Rheinland-Pfalz: LoD2, DGM und Orthofotos im Open-Data-Angebot prüfen. Lizenz pro Produkt dokumentieren; „öffentlich zugänglich“ allein genügt nicht. https://lvermgeo.rlp.de/
- Mapillary / andere Panoramaanbieter: tatsächliche Straßendeckung und API-/Anzeige-/Downloadrechte prüfen; keine flächendeckende Verfügbarkeit unterstellen.
- Selbst aufgenommene Fotos und 360°-Sequenzen: Rechte, Aufnahmezeitpunkt, Verpixelung von Gesichtern und Kennzeichen sowie sichere Aufnahmerouten vor Veröffentlichung klären.

Keine Google-Street-View-Bilder oder Google-3D-Kacheln extrahieren und als eigene Daten weiterverwenden. Ein Anbieterprodukt braucht seinen vorgesehenen Zugang und die zugehörigen Bedingungen.

## Technische Wege

| Weg | Stärke | Grenze | Rolle |
|---|---|---|---|
| Three.js + OSM-Polygone | Freie Bewegung, individuelle Gimmicks, kleine lokale Demo | Datenaufbereitung und Georeferenzierung nötig; Fassaden bleiben schematisch | MVP und schneller Interaktionsvergleich |
| MapLibre + extrudierte Vektorkacheln | Solide Kartenorientierung und große Flächen | Augenhöhe, Kollisionen und echte Fassaden sind Zusatzarbeit | Alternative für große Kartenfläche |
| Cesium + georeferenzierte 3D Tiles | Gelände, Streaming, große Stadtmodelle | Aufbereitung und Betrieb komplexer; Qualität hängt weiter an Quelldaten | Ausbau mit LoD2/Photogrammetrie |
| Verknüpfte 360°-Panoramen | Vertrauter realistischer Straßenblick | Sprungpunkte statt beliebig freier Bewegung | Realistischer Pilot mit eigenen Aufnahmen |
| Gaussian Splats / Photogrammetrie | Hohe örtliche visuelle Qualität und freie Perspektive | Aufnahmekosten, Löcher, Bewegung, große Datenmengen; Kollision separat | Ein klar begrenzter Vorzeigeabschnitt |

Empfehlung: zuerst einen nutzbaren georeferenzierten Spaziergang bauen; dann denselben 150–300-m-Abschnitt mit 360° und Splat-Prototyp vergleichen. Der bessere Ansatz wird anhand identischer Route, Gerät und Qualitätskriterien gewählt. Keine stadtweite fotorealistische Aufnahme vor diesem Vergleich planen.

## Phasen und Abnahme

1. **Interaktiver Prototyp.** Schifferstadt als Ausgangspunkt; Blick von oben, Straßenperspektive, freie Bewegung, Orte, Tageslicht und merkbare Position. Kennzeichnung „3D-Modell“ und sichtbare Quellen. Abnahme: Android-Touch und Desktop-Vorschau bedienbar, keine blockierende Startabhängigkeit, klarer Lade-/Fehlerzustand, Reset funktioniert.
2. **Verlässlicher Stadtzwilling.** Datenversion und Herkunft festhalten; Gebäudehöhen/Dachformen verbessern; begehbare Wege und Gelände ergänzen. Abnahme: zehn vorab ausgewählte reale Referenzpunkte einschließlich Bahnhof und Innenstadt geographisch korrekt; Datenlücken dokumentiert; keine ungekennzeichneten erfundenen POIs.
3. **Realistischer Pilot.** Ein kurzer Abschnitt mit eigenen/rechtmäßig nutzbaren Bildern. Panorama und Splat/Photogrammetrie im direkten Vergleich. Abnahme: erkennbare reale Fassaden, Aufnahmezeit sichtbar, Blick-/Navigationssprünge bewertet, Datenschutzbearbeitung geprüft.
4. **Stadtweite Erweiterung.** Erst nach gewonnenem Pilot: Kachelung, Streaming, Aktualisierungsprozess, Messung auf mehreren Geräten und klarer Betriebs-/Aufnahmeaufwand.

## Nützliche Gimmicks
- Wechsel zwischen Vogelperspektive und Augenhöhe, mit sichtbarer Position auf einer kleinen Karte.
- Tageszeit-Slider und Nachtansicht als simulierte Beleuchtung kennzeichnen.
- Favoriten / letzter Standort lokal auf dem Gerät speichern; teilbare Links mit Position und Blickrichtung.
- Ortskarten mit Entfernung und Herkunft; eigene Touren wie „Innenstadt entdecken“ erst nach Prüfung der Route.
- Kompass, Bewegungshilfe, Touch-Steuerung, reduzierte Animationen und verständliche Rückkehr zur Übersicht.
- Später: verfügbare barrierearme Routen auf Basis belegbarer Wegattribute; fehlende Angaben offen anzeigen.

## Entwicklerwettbewerb und Projektkontrolle
Zwei Entwürfe lösen dieselbe Aufgabe: A optimiert die frei begehbare 3D-Engine, B optimiert Orientierung und realistische Bildintegration. Eine unabhängige Prüfung bewertet beide; der Projektmanager integriert anhand der Ergebnisse. Gemeinsame Anforderungen haben Vorrang vor isolierten Effekten.

| Kriterium | Punkte | Nachweis |
|---|---:|---|
| Geografische Korrektheit und Datenherkunft | 25 | Referenzpunkte, Quellen und Datenlücken |
| Bewegung und Orientierung | 25 | Identische kurze Teststrecke, Desktop und Touch |
| Visuelle Qualität | 20 | Lesbarkeit, stabile Perspektive, belegter Realismus |
| Performance und Robustheit | 20 | Gerätemodell, Ladezeit, Bildrate, Netzfehler |
| Nützliche Funktionen und Zugänglichkeit | 10 | Tour/Ort finden, Reset, Tastatur, reduzierte Bewegung |

Ausschlusskriterien: unbrauchbare Navigation, nicht belegte Fotorealismus-/Live-Daten-Behauptungen, unklare Bildrechte oder erfundene geografische Inhalte ohne Kennzeichnung. Angestrebte Desktop-Bildrate: mindestens 45 FPS auf dem dokumentierten Testgerät; mobiles Ziel mindestens 30 FPS mit reduzierten Details. Messungen gehören in den Prüfbericht und sind keine garantierten Werte für jedes Gerät.

## Prüfprotokoll
Stand dieses Dokuments: Projektplan mit implementiertem Quellprototyp und Android-Hülle. Datenimport, APK-Build, Installation und Gerätetest sind nicht abgenommen. Prüfergebnisse werden getrennt dokumentiert.

## Android als Zielplattform
Das Quellprojekt enthält eine native Android-Hülle (Java, Android System WebView), welche die vorhandene Three.js-Oberfläche und mitgelieferte Daten über eine lokale HTTPS-Origin lädt. Mindestversion Android 8 (API 26), Ziel-/Compile-SDK 35. Kein AndroidX und keine JavaScript-Native-Bridge. Netzwerkzugriffe und Navigation zu anderen Origins sind im aktuellen Prototyp gesperrt; die Internet-Berechtigung ist für spätere bewusst implementierte Datendienste deklariert.

Android-Abnahme: APK mit Gradle 8.9, JDK 17 und SDK 35 bauen; Installation auf realem Gerät; WebGL, Touch, Rotation, Systemleisten, Zurück-Taste, Hintergrund/Rückkehr und Offline-Neustart testen. Ein erfolgreicher Web-Test ersetzt diese Abnahme nicht. Die Entwickler liefern Quellprojekt und dokumentierten Build; ein erzeugtes oder installiertes APK darf erst nach erfolgreichem Build behauptet werden. Details: `android/README.md`.

Aktuell angelegte Grundlage: freie 3D-Navigation, Touch-Pfeile, Tageszeit-Simulation, lokale Favoriten und Detailregler. Minikarte, POI-Karten, Touren, teilbare Links und fotorealistische Abschnitte sind weitere Ausbaustufen. Der Datenimport deckt den Innenstadt-Ausschnitt (49.374–49.399° N, 8.354–8.395° E) ab, nicht das gesamte Gemeindegebiet; er muss auf dem Build-Rechner vor dem APK-Bau ausgeführt werden. Die fertige App lädt ihre Karten- und Bibliotheksdateien vollständig aus dem APK und benötigt beim ersten Start kein Internet.
