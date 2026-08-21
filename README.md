# Essensverkauf – Strichliste

Eine kleine, offline-fähige Web-App zur Erfassung eines Essensverkaufs
(z. B. Schulfest, Vereinsfeier, Grillstand). Statt Papier und Strichliste
tippt man bei jedem Verkauf auf den passenden Artikel – die App zählt
mit und berechnet laufend die Einnahmen.

## Funktionen

- **Artikel anlegen**: Bezeichnung und Stückpreis frei definierbar
  (z. B. „Bratwurst – 2,50 €").
- **Tipp-Zähler (Strichliste)**: Pro Artikel ein großer „+"-Button zum
  Antippen bei jedem Verkauf, sowie ein „−"-Button zum Korrigieren von
  Fehltipps.
- **Live-Summen**: Verkaufte Portionen gesamt und Gesamteinnahmen
  werden oben permanent angezeigt, Zwischensummen je Artikel unter dem
  jeweiligen Zähler.
- **Speicherung im Browser**: Alle Zähler und Artikel werden in
  `localStorage` gehalten – ein versehentliches Neuladen der Seite
  verliert keine Daten.
- **Zurücksetzen**: Ein Button setzt alle Zähler auf 0 zurück (Artikel
  bleiben erhalten), z. B. für den nächsten Verkaufstag.

## Nutzung

Die App besteht aus reinem HTML/CSS/JavaScript ohne Build-Schritt und
ohne Server-Abhängigkeit.

1. `index.html` im Browser öffnen (Doppelklick reicht, oder z. B. mit
   `python3 -m http.server` lokal ausliefern).
2. Artikel über das Formular „Neuen Artikel anlegen" hinzufügen, oder
   die drei vordefinierten Beispielartikel (Bratwurst, Kuchen, Getränk)
   direkt verwenden bzw. anpassen.
3. Während des Verkaufs bei jedem Verkauf auf den „+"-Button des
   jeweiligen Artikels tippen.
4. Am Ende die Gesamteinnahmen und verkauften Portionen oben ablesen.

Die App ist für Smartphones/Tablets optimiert (große Tipp-Flächen),
funktioniert aber ebenso am Desktop.

## Auf dem Handy als App ablegen

Die Seite bringt ein Web-App-Manifest und Homescreen-Icons mit, lässt
sich also wie eine App ablegen und startet dann ohne Browserleiste:

- **iOS/Safari**: Teilen-Menü → „Zum Home-Bildschirm"
- **Android/Chrome**: Menü → „App installieren" bzw. „Zum Startbildschirm
  hinzufügen"

Das Icon ist so angelegt, dass der Burger auch dann vollständig sichtbar
bleibt, wenn das Betriebssystem es rund oder abgerundet zuschneidet.

## Dateien

| Datei         | Zweck                                             |
|---------------|----------------------------------------------------|
| `index.html`  | Struktur der Seite                                 |
| `style.css`   | Layout und Optik (große Buttons, mobil-freundlich) |
| `app.js`      | Logik: Artikelverwaltung, Zählung, Speicherung     |
| `logo.svg`    | Burger-Logo (Kopfzeile und Favicon)                |
| `icon.svg`    | Quelle des App-Icons (Burger auf Hintergrundkachel) |
| `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` | Aus `icon.svg` gerenderte Homescreen-Icons |
| `manifest.webmanifest` | Web-App-Manifest (Name, Farben, Icons)    |

## Hosting

Da es sich um statische Dateien handelt, lässt sich das Projekt direkt
über GitHub Pages veröffentlichen (Branch/Ordner als Pages-Quelle
einstellen) oder auf jedem beliebigen Webserver ablegen.
