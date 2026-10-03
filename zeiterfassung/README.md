# Zeiterfassung & Rechnungen

Eine eigenständige Web-App (reines HTML/CSS/JavaScript, ohne Build-Schritt
und ohne Server), um Arbeitszeiten zu erfassen und daraus automatisch
Rechnungen zu erstellen. Einfach `index.html` im Browser öffnen.

## Funktionen

- **Stoppuhr**: Kunde wählen, Tätigkeit eintragen, Start/Stopp. Eine
  laufende Uhr übersteht auch ein Neuladen oder Schließen der Seite.
- **Zeit nachtragen**: Datum, von–bis, Tätigkeit. Zeiten über Mitternacht
  (z. B. 22:00–01:00) werden richtig berechnet.
- **Kunden**: Adresse, Ansprechpartner und optional ein eigener
  Stundensatz (sonst gilt der Standardsatz).
- **Rechnungen**:
  - „Offene Zeiten übernehmen“ holt alle noch nicht abgerechneten Zeiten
    des Kunden (optional nur aus einem Zeitraum) als Positionen, wahlweise
    nach Tätigkeit zusammengefasst oder einzeln mit Datum.
  - Alle Positionen sind frei bearbeitbar, weitere Positionen (z. B.
    Fahrtkosten, Material) lassen sich ergänzen.
  - Rechnungsnummer wird fortlaufend vorgeschlagen, Rechnungsdatum,
    Zahlungsziel, Betreff und Freitext sind einstellbar.
  - Netto, Umsatzsteuer und Brutto werden automatisch berechnet; für
    Kleinunternehmer erscheint der Hinweis nach § 19 UStG.
  - Die fertige Rechnung (A4) lässt sich drucken oder über den
    Druckdialog als PDF speichern.
  - Abgerechnete Zeiten werden markiert und nicht doppelt berechnet;
    Rechnungen können als bezahlt markiert werden, überfällige sind
    hervorgehoben.
- **Meine Daten**: Absender, Steuernummer/USt-IdNr., Bankverbindung,
  Standard-Stundensatz, Abrechnungstakt (z. B. angefangene 15 Minuten),
  USt-Satz, Zahlungsziel und Nummernkreis.
- **Backup**: Export und Import aller Daten als JSON-Datei.

Absender- und Kundendaten werden beim Erstellen in der Rechnung
festgeschrieben – spätere Änderungen verändern bereits ausgestellte
Rechnungen nicht.

## Hinweis zur Datenspeicherung

Alle Daten liegen ausschließlich im `localStorage` des Browsers. Wer den
Browser-Speicher leert oder das Gerät wechselt, verliert sie – daher
regelmäßig über „Meine Daten → Backup herunterladen“ sichern.
