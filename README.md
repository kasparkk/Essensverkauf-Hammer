# CarryConnect

Peer-to-peer-Kurierdienst: Wer unterwegs ist, hat oft freien Platz im Gepäck –
wer etwas transportiert oder besorgt braucht, zahlt sonst teure Paketpreise.
CarryConnect bringt beide Seiten über passende Routen zusammen.

## Die drei Anliegen

1. **Liegengelassen** – Vergessenes zurückholen (AirPods im Hotel in Buenos
   Aires, Mantel in Brüssel), per Übergabe oder Postabgabe am Ziel.
2. **Einkauf** – Regionale Produkte besorgen lassen, die daheim nicht zu haben
   oder stark verteuert sind.
3. **Transport** – Gegenstände zwischen Städten bewegen, wo Paketversand
   unpraktisch oder unverhältnismäßig teuer ist.

## Funktionsumfang

- Registrierung/Login mit E-Mail & Passwort (Session-Cookie, JWT via `jose`)
- **Anfragen** mit Art, Route (Land + Stadt), Deadline, Gewicht, Honorar in Euro
  und gewünschtem Liefermodus
- **Reisen** mit Verkehrsmittel (Flug/Zug/Auto/Bus), Route, Datum, freiem Platz
  in kg und optionaler Postabgabe am Ziel
- **Route-Matching** (`src/lib/matching.ts`): bewertet Treffer nach Route,
  Städten, Datum gegen Deadline, Kapazität gegen Gewicht und Liefermodus – und
  zeigt jede Begründung an, damit das Ranking nachvollziehbar bleibt
- **Abmachungen** mit Ablauf *vorgeschlagen → angenommen → abgeholt → geliefert
  → bestätigt* (oder abgebrochen). Wer vorschlägt, kann nicht selbst annehmen;
  jeder Schritt ist an die passende Rolle gebunden (`src/lib/deals.ts`).
  Eine zugesagte Anfrage gilt als vergeben und verschwindet aus der Liste.
- **Chat** pro Abmachung, Nachrichten per Polling (alle 3 Sekunden)

## Noch nicht umgesetzt

Diese Bausteine des Konzepts brauchen externe Dienstleister und sind bewusst
nicht als Attrappe eingebaut:

- **Escrow-Zahlung** – Honorare werden aktuell direkt zwischen den Beteiligten
  beglichen; treuhänderisches Halten und Freigeben braucht einen
  Zahlungsanbieter (z. B. Stripe Connect).
- **KYC / Identitätsprüfung** – es gibt absichtlich kein „verifiziert“-Abzeichen,
  solange nichts geprüft wird. Nötig wäre ein Ausweis-Dienst
  (z. B. Stripe Identity).
- **Foto-Verifikation bei der Übergabe** – braucht Datei-Upload und
  Blob-Storage.

## Sprachen

Die Oberfläche gibt es auf Englisch, Deutsch, Spanisch, Portugiesisch und
Französisch - passend zu einer Plattform, auf der Leute über Ländergrenzen
hinweg zusammenfinden.

- Erkennung: erst die ausdrückliche Wahl im Cookie, sonst der
  `Accept-Language`-Header des Browsers, sonst Englisch
- Umschalten über die Auswahl in der Navigation (ein Jahr im Cookie gespeichert)
- Auch die Fehler- und Validierungsmeldungen der API kommen in der Sprache des
  Aufrufers zurück
- Datums-, Gewichts- und Geldangaben werden pro Sprache formatiert
  (`€25.00` vs. `25,00 €`)
- Wörterbücher liegen unter `src/lib/i18n/dictionaries/`. Das englische ist die
  Vorlage, aus der der `Dictionary`-Typ abgeleitet wird - ein fehlender oder
  vertippter Schlüssel in einer Übersetzung ist damit ein Build-Fehler.
- Treffer-Begründungen werden als Code plus Werte berechnet
  (`src/lib/matching.ts`) und erst in der Oberfläche übersetzt

Eine Sprache ergänzen: Wörterbuch unter `dictionaries/` anlegen, in
`src/lib/i18n/config.ts` in `locales` und `localeNames` eintragen und in
`src/lib/i18n/server.ts` sowie `src/lib/format.ts` registrieren.

## Tech-Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Prisma](https://www.prisma.io) mit Postgres (`@prisma/adapter-pg`)
- [Netlify DB](https://docs.netlify.com/build/data-and-storage/netlify-db/) stellt die Postgres-Datenbank beim Deploy automatisch bereit
- `bcryptjs` für Passwort-Hashing, `jose` für Session-Tokens, `zod` für Validierung

## Deployment auf Netlify

Live: https://mitbring-reisemitbringer.netlify.app

Das Projekt ist vollständig für Netlify konfiguriert (`netlify.toml`):

1. Env-Var `SESSION_SECRET` in den Site-Einstellungen setzen (langer
   Zufallsstring).
2. Beim ersten Deploy provisioniert Netlify automatisch eine Postgres-Datenbank
   und wendet die SQL-Migrationen unter `netlify/database/migrations/` an –
   keine manuelle DB-Einrichtung, kein Connection-String nötig.

### Besonderheit: Next.js-Runtime

Wird `@netlify/plugin-nextjs` von Netlifys Plugin-System ausgeführt, bricht der
Deploy hier mit einem generischen `Build script returned non-zero exit code: 2`
ab. Ein Diagnose-Deploy hat gezeigt, dass sowohl `next build` als auch die
Build-Hooks des Plugins in derselben Umgebung fehlerfrei laufen, wenn man sie
direkt aufruft. Deshalb:

- `NETLIFY_NEXT_PLUGIN_SKIP = "true"` deaktiviert die Ausführung durch Netlify
- `scripts/netlify-next-runtime.mjs` ruft `onBuild`/`onPostBuild` nach dem Build
  selbst auf und erzeugt Server-Handler, Edge-Handler und Publish-Verzeichnis

Sollte eine neuere Plugin-Version das Problem beheben, kann das Skript entfernt
und das Plugin wieder regulär über `[[plugins]]` eingebunden werden.

## Lokale Entwicklung

Für lokale Entwicklung wird eine Postgres-Datenbank benötigt (lokal, Docker
oder z. B. `netlify dev`, welches automatisch eine verlinkte DB bereitstellt).

```bash
npm install
cp .env.example .env
# SESSION_SECRET setzen und DATABASE_URL auf eine eigene Postgres-Instanz zeigen lassen
psql "$DATABASE_URL" -f netlify/database/migrations/001_init/migration.sql
npm run dev
```

Die App läuft dann auf [http://localhost:3000](http://localhost:3000).

Ändert sich das Datenmodell (`prisma/schema.prisma`), eine neue Migration
gegen die aktuell verbundene Datenbank (`DATABASE_URL`) erzeugen und unter
`netlify/database/migrations/<nummer>_<name>/migration.sql` ablegen:

```bash
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script \
  > netlify/database/migrations/002_meine_aenderung/migration.sql
```

## Projektstruktur

- `src/app` – Seiten & API-Routen (App Router)
- `src/lib` – Prisma-Client, Auth-Helper, Formatierung
- `src/components` – geteilte UI-Komponenten
- `prisma/schema.prisma` – Datenmodell (User, Trip, Request, Conversation, Message)
- `netlify/database/migrations` – SQL-Migrationen, die Netlify beim Deploy anwendet
