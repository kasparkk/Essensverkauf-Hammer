# Gebärden-Assistent

Eine kleine, offline-fähige Web-App mit zwei Modi (Reiter oben in der
App):

- **Live-Untertitel**: gesprochene Sprache (Sprache wählbar) wird in
  **große, gut lesbare Untertitel** umgewandelt, zusätzlich über einen
  **3D-Gebärden-Avatar** (Three.js) Buchstabe für Buchstabe im
  vereinfachten Fingeralphabet dargestellt – als Hilfsmittel für
  Gehörlose und Schwerhörige, um Gesprächen leichter zu folgen.
- **Lernen für Kinder**: derselbe 3D-Avatar wird zum Lernspiel für das
  Fingeralphabet – als Quiz (Avatar zeigt, Kind rät den Buchstaben)
  oder im Nachmach-Modus (Kind wählt einen Buchstaben, Avatar zeigt ihn
  in Zeitlupe zum Nachmachen), mit Fortschrittsanzeige.

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
   Gesprochenes in exakten Text um – groß, kontraststark, mit Verlauf,
   Sprache über ein Dropdown einstellbar (Deutsch, Englisch, weitere).
2. **3D-Gebärden-Avatar & Fingeralphabet**: Ein kleiner, mit
   [Three.js](https://threejs.org/) (Open Source, MIT-Lizenz) gebauter
   Avatar animiert seine Hand Buchstabe für Buchstabe passend zum
   Fingeralphabet-Datenmodell; parallel läuft die bisherige 2D-Anzeige
   mit Hand-Piktogrammen und Buchstaben-Beschriftung mit.

   ⚠️ Avatar und Fingeralphabet sind eine **vereinfachte, schematische
   Annäherung** an das deutsche (DGS-)Fingeralphabet – **keine amtlich
   geprüfte DGS-Referenz** und **keine echte Gebärdensprache** (es wird
   buchstabiert, nicht gebärdet). Für echtes Lernen oder wichtige
   Kommunikation bitte einen Gebärdensprachdolmetscher, einen
   anerkannten DGS-Kurs oder einen Gehörlosenverband konsultieren.

   **Datenbasis**: Die Handformen in `fingeralphabet.js` sind gezielt am
   *deutschen* Fingeralphabet ausgerichtet (nicht am amerikanischen
   ASL, das sich bei mehreren Buchstaben unterscheidet), recherchiert
   anhand mehrerer Quellen (u. a. Wikipedia „Fingeralphabet",
   fakoo.de, gebaerdenlernen.de). Bekannte, bewusste Vereinfachungen:
   J, Z sowie die Umlaut-Buchstaben Ä/Ö/Ü erfordern in echt eine
   Bewegung (der Avatar deutet das mit einer Wackel-Animation nur an);
   G/H werden mit Handrücken zur Kamera gebärdet (der Avatar dreht die
   Hand entsprechend, das 2D-Piktogramm kann das nicht abbilden); ß
   wird praxisüblich wie „ss" dargestellt. Trotz Recherche: **nicht von
   Muttersprachler:innen gegengeprüft** – Fehler sind möglich.

## Funktionen

- **Live-Untertitel**: Mikrofon-Button startet die Spracherkennung,
  Zwischen- und Endergebnisse erscheinen sofort in großer Schrift
  (Schriftgröße einstellbar).
- **Sprachauswahl**: Dropdown zur Wahl der gesprochenen Sprache (u. a.
  Deutsch in drei Varianten, Englisch, Französisch, Spanisch, Türkisch,
  Russisch, Arabisch, …), Auswahl wird gespeichert.
- **Manuelle Texteingabe**: Alternative/Ergänzung zum Mikrofon, auch
  nützlich in Browsern ohne Spracherkennung.
- **3D-Avatar + Fingeralphabet-Anzeige**: Der aktuelle Text wird Buchstabe
  für Buchstabe von einem Three.js-Avatar "gebärdet" (schematisch) und
  parallel als Hand-Piktogramm-Streifen dargestellt, mit
  Abspiel-Funktion (Play/Pause, Tempo einstellbar).
- **Verlauf**: Frühere Sätze bleiben in einer Liste erhalten (inkl.
  Uhrzeit) und lassen sich erneut im Fingeralphabet anzeigen.
- **Lernen für Kinder** (eigener Reiter): Quiz-Modus (Avatar zeigt einen
  Buchstaben, Kind wählt aus vier Möglichkeiten die richtige Antwort)
  und Nachmach-Modus (Kind tippt einen Buchstaben an, Avatar zeigt ihn
  langsam); Fortschritt pro Buchstabe wird gespeichert und als
  Fortschrittsbalken angezeigt.
- **Speicherung im Browser**: Verlauf und Lernfortschritt werden in
  `localStorage` gehalten.
- **Installierbar (PWA)**: Manifest und Icons erlauben das Ablegen auf
  dem Homescreen.

## Nutzung

Reines HTML/CSS/JavaScript ohne Build-Schritt. Three.js wird als
ES-Modul direkt von einem CDN (jsDelivr) geladen, es ist also eine
Internetverbindung nötig; ohne sie funktionieren Untertitel und
2D-Fingeralphabet weiterhin, nur der 3D-Avatar bleibt dann leer.

1. `index.html` im Browser öffnen (z. B. mit `python3 -m http.server`
   lokal ausliefern – für Mikrofonzugriff wird in den meisten Browsern
   HTTPS oder `localhost` benötigt).
2. Gesprochene Sprache im Dropdown wählen, auf „Mikrofon starten"
   tippen, Mikrofonzugriff erlauben und sprechen – oder Text unten
   manuell eintippen.
3. Der Text erscheint groß als Untertitel; darunter animiert der
   3D-Avatar das (vereinfachte) Fingeralphabet, zusätzlich als
   Piktogramm-Streifen mit Beschriftung.
4. Mit „Abspielen" den Avatar und die Fingeralphabet-Anzeige Buchstabe
   für Buchstabe durchlaufen lassen, Tempo per Schieberegler anpassen.

**Browser-Hinweis**: Die Spracherkennung nutzt die Web Speech API, die
zuverlässig vor allem in Chrome/Edge (Desktop und Android) unterstützt
wird. Ohne Unterstützung bleibt die manuelle Texteingabe als
vollwertige Alternative. Das Fingeralphabet deckt nur lateinische
Buchstaben (inkl. Ä/Ö/Ü/ß) ab; bei anderen Schriftsystemen (z. B.
Kyrillisch, Arabisch) wird der jeweilige Buchstabe nur als Text
angezeigt, ohne Handform.

## Auf dem Handy als App ablegen

- **iOS/Safari**: Teilen-Menü → „Zum Home-Bildschirm"
- **Android/Chrome**: Menü → „App installieren" bzw. „Zum Startbildschirm
  hinzufügen"

## Dateien

| Datei                   | Zweck                                                        |
|-------------------------|---------------------------------------------------------------|
| `index.html`            | Struktur der Seite                                            |
| `style.css`             | Layout und Optik                                               |
| `app.js`                | Spracherkennung, Sprachauswahl, Untertitel, Verlauf, Wiedergabe |
| `fingeralphabet.js`     | Datenmodell + SVG-Renderer für das vereinfachte Fingeralphabet |
| `avatar3d.js`           | Three.js-Avatar, animiert dieselben Fingeralphabet-Daten in 3D |
| `kids.js`               | Kinder-Lernmodus: Quiz + Nachmachen, Fortschrittsspeicherung   |
| `tabs.js`               | Umschalten zwischen Live-Modus und Kinder-Lernmodus            |
| `logo.svg`, `icon.svg`  | App-Icon (Hand-Piktogramm)                                     |
| `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` | Homescreen-Icons |
| `manifest.webmanifest`  | Web-App-Manifest (Name, Farben, Icons)                         |
| `_headers`              | Netlify: korrekter MIME-Typ für das Manifest                   |

## Hosting

Statische Dateien – direkt über GitHub Pages, Netlify oder jeden
anderen Webserver veröffentlichbar. Für Mikrofonzugriff wird HTTPS
(oder `localhost`) vorausgesetzt.
