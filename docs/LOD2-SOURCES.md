# Amtliche LoD2-Quelle — Schifferstadt

Recherche: 21.10.2026. **Amtliche Bezugsquelle bestätigt; konkrete CityGML-Kacheldateien noch nicht heruntergeladen oder ausgewertet.** Kein First-/Traufhöhenwert der Schulen ist hiermit verifiziert.

## Verifizierte primäre Quellen

- Produkt: [LVermGeo Rheinland-Pfalz: 3D-Gebäudemodell](https://lvermgeo.rlp.de/produktinformationen/geotopografie/3d-geodaten/3d-gebaeudemodell). LoD2 bietet standardisierte Dachformen, CityGML und ungefähr 1 m Höhengenauigkeit; komplexe Dächer können stärker abweichen. Es ersetzt keine fotogrammetrische Fassade.
- [Amtlicher Metadatensatz](https://metaportal.rlp.de/gui/pdf/0b28684d-b2ce-4b0b-b080-928025588c61), UUID `0b28684d-b2ce-4b0b-b080-928025588c61`: im geöffneten Dokument Metadatenstand 12.05.2026, Datenaktualität 01.04.2026. Landesweite 1×1-km-Kacheln, untere linke Ecke auf ganzen Kilometern; CityGML, ggf. ZIP. Lage EPSG:25832 (ETRS89/UTM32), Höhe EPSG:7837 (DHHN2016-Normalhöhen/GCG2016). Aktualisierung unregelmäßig; Aktualität der konkreten Kachel zusätzlich prüfen.
- [Offizieller Open-Data-Einstieg](https://geoshop.rlp.de/opendata-geb3dlo.html) verlinkt den [HVD-Massendownload](https://geoshop.rlp.de/files/anpassungen/hvd/index.html?config=./products/geb3dlo.json). Dieser Link ist auch auf der [Offenen-Daten-Plattform RLP](https://open.rlp.de/de/suchergebnisse/dataset/3d-gebaudemodell-lod2-rp) als LoD2-Massendownload aufgeführt.
- Aus dem **tatsächlich verlinkten** relativen Konfigurationspfad ergibt sich `https://geoshop.rlp.de/files/anpassungen/hvd/products/geb3dlo.json`. Diese JSON-Datei konnte das Recherchewerkzeug nicht öffnen; ihr Inhalt, die darin genannten Services und Kachel-URL-Schablonen sind deshalb noch **nicht bestätigt**. Hier keine erfundenen WFS-/3D-Tiles-/ZIP-Endpunkte ergänzen.
- [GeoShop-Produktseite](https://geoshop.rlp.de/id-3d-gebaeudemodelle/_3d-gebaeudemodelle.html): im geöffneten Stand Hinweis vom 20.10.2026 auf Wartung bis voraussichtlich 29.10.2026, bestimmte Flächen im individuellen Abruf gesperrt; ausdrücklich Massendownload als Alternative empfohlen.

## Räumliche Auswahl für die Außenhüllen

Die folgenden Suchpunkte stammen aus dem Projektauftrag/OSM-Flächenmittelpunkten, **nicht aus dem amtlichen CityGML**. Adresszuordnung und jedes Gebäude einzeln über vorhandene amtliche/kommunale Referenzen prüfen. Kein Innenraum- oder Schulbetriebsmodell ableiten.

| Auswahl | Suchpunkt WGS84 (lat, lon) | ungefähr UTM32 (E, N), Meter | betroffene 1-km-Suchkachel (xmin,ymin,xmax,ymax) |
|---|---|---|---|
| Nord, Rehbachstraße 11, OSM-Way 1116293698 | 49.3881791, 8.3712224 | 454368, 5470799 | 454000,5470000,455000,5471000 |
| Nord, weiterer Bereich/Rehbachstraße 3, OSM-Way 473371545 | 49.3874713, 8.3715997 | 454395, 5470720 | 454000,5470000,455000,5471000 |
| Süd, Jägerstraße 18, OSM-Way 151231283 | 49.3777108, 8.378745 | 454905, 5469631 | 454000,5469000,455000,5470000 |

UTM-Werte lokal mit WGS84-Transversal-Mercator berechnet, auf Meter gerundet; ETRS89-Transformation für den endgültigen Import mit PROJ/EPSG:25832 durchführen. Süd liegt nahe der Ostkante: bei schneidenden Gebäudeumringen zusätzlich Nachbarkachel 455000,5469000,456000,5470000 wählen. Die Tabelle bezeichnet Suchkacheln, keine verifizierten Dateinamen.

## Abruf und Cache — nächster überprüfbarer Schritt

1. Den oben verlinkten HVD-Client samt Produkt-JSON auf einem Rechner mit Internet abrufen und unverändert cachen. Erst die dort deklarierte Download-/Indexquelle verwenden; keine URL-Schablone raten.
2. Im offiziellen Kachelindex die genannten BBOXen auswählen. Angegebene ZIP/CityGML-URLs abrufen; MIME, ZIP-Inhalt, XML und Koordinatenreferenz prüfen. Originaldateien, Download-URL, Abrufzeit und SHA-256 gemeinsam ablegen.
3. Empfohlene Cache-Orte: `research/lod2/geb3dlo.json`, `research/lod2/index/`, `research/lod2/raw/`, `research/lod2/manifest.json`. **Diese Orte sind geplant; bei dieser Recherche wurde dort kein Cache erzeugt.**
4. Nur äußere Gebäudeschalen passend zu den geprüften Umringen extrahieren. Dach-/Wandflächen und Grundniveau aus CityGML übernehmen; absolute Normalhöhen in lokale Höhen relativ zum dokumentierten Gelände-/Sockelniveau umrechnen. OSM-Zentrum allein identifiziert kein amtliches Gebäude. Keine vermuteten Geschosshöhen als amtliche Maße ausgeben.

Lizenz laut amtlichem Metadatensatz: [Datenlizenz Deutschland — Namensnennung 2.0](https://www.govdata.de/dl-de/by-2-0). Quellenvermerk nach tatsächlichem Abruf beispielsweise `©GeoBasis-DE / LVermGeoRP2026, dl-de/by-2-0, www.lvermgeo.rlp.de [Daten bearbeitet]`. Lizenz und Abrufjahr mit dem Cache festhalten.

Der amtliche [RLP-3D-Viewer](https://www.rheinland-pfalz-in-3d.rlp.de/) leitet auf `https://rlp.plexmap.de/v/RLP-in-3D-neu/` weiter. Das bestätigt einen Viewer, **keinen bereits gefundenen oder freigegebenen 3D-Tiles-Download-Endpunkt**.
