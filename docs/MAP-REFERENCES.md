# Reale Außenansichten: Quellen- und Genauigkeitsprotokoll

## Ziel und aktueller Nachweisstand
Der gewünschte neue Kartenstand soll die **realen Außenanlagen und Außenfassaden** der Grundschule Nord und Grundschule Süd in Schifferstadt wiedergeben. Die bisherigen fiktiven Arenen erfüllen diesen Wunsch nicht. Eine genaue Rekonstruktion darf erst nach Abgleich von Gebäudeumrissen, öffentlich belegten Fassaden, Dachform und Höhen als solche bezeichnet werden.

Die folgenden städtischen Quellen wurden vom Projektmanager als Ausgangsreferenzen benannt. Ein lokaler HTTP-Abruf war in dieser Ausführungsumgebung bisher gesperrt. Deshalb gelten Gebäudezuordnung, Bildinhalt und Maße hier noch nicht als unabhängig bildlich verifiziert.

| Ort | Primäre öffentliche Referenz | Aus der Projekt-Recherche übernommene Adresse |
|---|---|---|
| Grundschule Nord | https://www.schifferstadt.de/bildung-kultur/schulen/grundschule-nord/ | Rehbachstraße 11; historische/weitere Adressangabe Rehbachstraße 3 noch abgleichen |
| Grundschule Süd | https://www.schifferstadt.de/bildung-kultur/schulen/grundschule-sued/ | Jägerstraße 18 |

Zusätzliche städtische Primärquelle: [Integriertes Handlungskonzept, 11.02.2021](https://www.schifferstadt.de/bilder/pdf/bauen-und-umwelt/2021.02.11.ihk-schifferstadt.pdf?cid=5v1). Laut Projekt-Recherche enthält der Bereich um Seite 66 Luft-/Hofansichten; PDF-Seitenzählung, konkretes Schulgebäude und Aufnahmezeit müssen vor Verwendung geprüft werden. Für Nord wurden Bauphasen 1868, 1902 und 1911 genannt; daraus folgen ohne belegtes Bild oder Maß keine konkreten Fassadenhöhen oder Grundrisse.

Die auf einer Süd-Webseite gefundene Koordinate `49.38828256852, 8.3717121` ist **nicht übernommen**: Ein CMS-/Kartenmarker ist kein ausreichender Ortsnachweis. Schulname, amtliche Adresse und Gebäudeumriss müssen zusammenpassen.

## Reproduzierbarer öffentlicher Datenabruf
Auf einem Rechner mit Internet im Projektverzeichnis ausführen:

```sh
python3 tools/fetch-map-references.py
```

Das Skript benötigt nur Python-Standardbibliotheken und keine Zugangsdaten. Es schreibt erst nach erfolgreicher Recherche beider Orte `dist/data/school-reference.json`. Der Ausgabebericht enthält Abrufzeit in UTC, OSM-Datenstand, Quell-URLs, verwendete Suchabfragen und örtliche Koordinatenursprünge.

1. Öffentliche OSM-Schulobjekte im Stadtgebiet abrufen. Einen eindeutigen Namen „Grundschule Nord/Süd“ bevorzugen. Falls nicht eindeutig, Nominatim nur bei Übereinstimmung von Straße und Hausnummer verwenden; keine ungeprüfte Ersttreffer-Koordinate.
2. OSM-Gebäude-/Gebäudeteilpolygone in 180 m Umgebung des ermittelten Ursprungs abrufen. **Umgebung ist keine Schulzuordnung**: Nachbargebäude bleiben Kandidaten, bis Grundstück und Fotos abgeglichen sind.
3. Bild-URLs mit Alt-/Titeltext aus den offiziellen Stadtseiten extrahieren. Diese sind **Bildkandidaten**, keine bereits gesichteten Referenzfotos. Templategrafiken und Wappen können enthalten sein. Konkrete Architekturdetails erst nach Sichtung ableiten.
4. Tatsächlich vorhandene OSM-Tags wie `height`, `building:levels`, `roof:shape` separat übernehmen. Fehlende Werte bleiben fehlend. Keine Ersatzhöhe oder Dachform eintragen.

Offene oder aus mehreren Wegen zusammengesetzte Multipolygone werden nicht stillschweigend zu einem erfundenen Polygon geschlossen. Relationen erhalten `complete:false` bis zu einer geprüften Ringzusammensetzung. Auch ein vollständiger OSM-Ring ist noch kein Nachweis zentimetergenauer Geometrie.

## Übergabe an die Engine
Optionale Gebäudestruktur:

```js
buildings: [{
  footprint: [{x, z}, /* ... */],
  h: /* nur belegte Höhe, sonst ausdrücklich geschätzte Modellhöhe */,
  roof: {type: /* belegte Dachform */},
  facadeType: /* sichtbare und belegte Fassade */,
  color: /* bildlich nachvollziehbare Farbe */
}]
```

`x` zeigt nach Osten, `z` nach Süden, Meter relativ zum im Referenzdatensatz angegebenen Ursprung. Gebäude werden nicht zusätzlich als rechteckige `boxes` dupliziert. Der 180-m-Suchradius definiert weder Kartenbegrenzung noch Schulgelände. Auswahl, Skalierung, Spielerstart und Kollisionen müssen nach dem Bild-/Geometrieabgleich neu geprüft werden.

## Fehlende Nachweise vor einer Genauigkeitsbehauptung
- Welches Polygon gehört zu welchem Schulflügel? Gebäudeteile und Hofgrenzen mit Primärbildern/Luftbild abgleichen.
- Öffentlich sichtbare Dachformen und Anzahl der Geschosse pro Flügel dokumentieren.
- Gebäudehöhen nach Quelle unterscheiden: OSM-Messwert, abgeleitete Geschosshöhe oder reine Schätzung.
- Fensterachsen, Türen, Materialien und Farben nur für belegte Ansichten übernehmen; verdeckte Rückseiten offen als ungeprüft führen.
- Keine aus Fotos geratenen Innenräume, Fluchtwege, Sicherheitsanlagen, Stundenpläne oder personenbezogenen Informationen ergänzen.
- OSM: ODbL und Namensnennung. Städtische Fotos/PDFs: Veröffentlichung ist keine pauschale Erlaubnis zur Übernahme als Spieltextur; konkrete Rechte vor einer solchen Nutzung prüfen. Referenzlinks und selbst modellierte Außenformen getrennt von Bildvervielfältigung behandeln.

Bis diese Prüfschritte abgeschlossen sind, lautet die zulässige Beschreibung „Außenmodell auf Basis öffentlicher Referenzen, mit dokumentierten Unsicherheiten“, nicht „exakte Nachbildung“.
