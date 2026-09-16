# Gebärden-Assistent

Eine kleine, offline-fähige Web-App, die gesprochene Sprache in **große,
gut lesbare Live-Untertitel** umwandelt und den Text zusätzlich als
**vereinfachtes Fingeralphabet** darstellt – als Hilfsmittel für
Gehörlose und Schwerhörige, um Gesprächen leichter folgen zu können.

## Wichtiger Hinweis zur Ehrlichkeit dieser App

Eine vollautomatische, grammatikalisch korrekte Übersetzung von
gesprochener Sprache in echte Gebärdensprache (mit Mimik, Raumnutzung
und ganzheitlichen Gebärden) ist mit heutiger Technik als reine
Web-App **nicht seriös umsetzbar**. Eine App, die das vorgibt, würde
Gehörlosen falsche oder unverständliche „Gebärden" als korrekt
verkaufen – das wäre mehr Schaden als Nutzen.

Diese App setzt deshalb bewusst auf zwei ehrliche, tatsächlich
funktionierende Bausteine:

1. **Live-Untertitel**: Spracherkennung (Web Speech API) wandelt
   Gesprochenes in exakten Text um – groß, kontraststark, mit Verlauf.
2. **Fingeralphabet-Schema**: Der Text wird zusätzlich Buchstabe für
   Buchstabe mit stilisierten Hand-Piktogrammen dargestellt.

   ⚠️ Dieses Fingeralphabet ist eine **vereinfachte, schematische
   Annäherung** an gängige einhändige Fingeralphabete – **keine amtlich
   geprüfte DGS-Referenz** (Deutsche Gebärdensprache). Für echtes
   Lernen oder wichtige Kommunikation bitte einen
   Gebärdensprachdolmetscher, einen anerkannten DGS-Kurs oder einen
   Gehörlosenverband konsultieren.

## Funktionen

- **Live-Untertitel**: Mikrofon-Button startet die Spracherkennung
  (Deutsch), Zwischen- und Endergebnisse erscheinen sofort in großer
  Schrift (Schriftgröße einstellbar).
- **Manuelle Texteingabe**: Alternative/Ergänzung zum Mikrofon, auch
  nützlich in Browsern ohne Spracherkennung.
- **Fingeralphabet-Anzeige**: Der aktuelle Text wird in Hand-Piktogramme
  je Buchstabe zerlegt, mit Abspiel-Funktion (Play/Pause, Tempo
  einstellbar), die Buchstabe für Buchstabe hervorhebt.
- **Verlauf**: Frühere Sätze bleiben in einer Liste erhalten (inkl.
  Uhrzeit) und lassen sich erneut im Fingeralphabet anzeigen.
- **Speicherung im Browser**: Verlauf wird in `localStorage` gehalten.
- **Installierbar (PWA)**: Manifest und Icons erlauben das Ablegen auf
  dem Homescreen.

## Nutzung

Reines HTML/CSS/JavaScript ohne Build-Schritt, ohne Server-Abhängigkeit
(bis auf die Spracherkennung selbst, die in Chrome/Edge einen
Online-Spracherkennungsdienst nutzt).

1. `index.html` im Browser öffnen (z. B. mit `python3 -m http.server`
   lokal ausliefern – für Mikrofonzugriff wird in den meisten Browsern
   HTTPS oder `localhost` benötigt).
2. Auf „Mikrofon starten" tippen, Mikrofonzugriff erlauben und
   sprechen – oder Text unten manuell eintippen.
3. Der Text erscheint groß als Untertitel; darunter wird er automatisch
   im (vereinfachten) Fingeralphabet dargestellt.
4. Mit „Abspielen" die Fingeralphabet-Anzeige Buchstabe für Buchstabe
   durchlaufen lassen, Tempo per Schieberegler anpassen.

**Browser-Hinweis**: Die Spracherkennung nutzt die Web Speech API, die
zuverlässig vor allem in Chrome/Edge (Desktop und Android) unterstützt
wird. Ohne Unterstützung bleibt die manuelle Texteingabe als
vollwertige Alternative.

## Auf dem Handy als App ablegen

- **iOS/Safari**: Teilen-Menü → „Zum Home-Bildschirm"
- **Android/Chrome**: Menü → „App installieren" bzw. „Zum Startbildschirm
  hinzufügen"

## Dateien

| Datei                   | Zweck                                                        |
|-------------------------|---------------------------------------------------------------|
| `index.html`            | Struktur der Seite                                            |
| `style.css`             | Layout und Optik                                               |
| `app.js`                | Spracherkennung, Untertitel, Verlauf, Wiedergabe-Steuerung     |
| `fingeralphabet.js`     | Datenmodell + SVG-Renderer für das vereinfachte Fingeralphabet |
| `logo.svg`, `icon.svg`  | App-Icon (Hand-Piktogramm)                                     |
| `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` | Homescreen-Icons |
| `manifest.webmanifest`  | Web-App-Manifest (Name, Farben, Icons)                         |
| `_headers`              | Netlify: korrekter MIME-Typ für das Manifest                   |

## Hosting

Statische Dateien – direkt über GitHub Pages, Netlify oder jeden
anderen Webserver veröffentlichbar. Für Mikrofonzugriff wird HTTPS
(oder `localhost`) vorausgesetzt.
