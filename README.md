# Mitbring

Eine kleine Plattform: Wer im Urlaub oder auf Reisen etwas vergessen hat oder
sich etwas aus einem anderen Land wünscht, findet hier Reisende, die zufällig
ins gleiche Land fliegen und es mitbringen können. Beide Seiten klären alles
Weitere direkt im eingebauten Chat.

## Funktionsumfang

- Registrierung/Login mit E-Mail & Passwort (Session-Cookie, JWT via `jose`)
- **Reisen**: Reisende tragen Abflugs-/Zielort und Datum ein
- **Anfragen**: Leute beschreiben, was sie mitgebracht bekommen möchten
- Beide Listen lassen sich nach Zielland filtern
- **Chat**: Kontaktaufnahme startet eine Konversation, Nachrichten werden per
  Polling (alle 3 Sekunden) aktualisiert

## Tech-Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Prisma](https://www.prisma.io) mit Postgres (`@prisma/adapter-pg`)
- [Netlify DB](https://docs.netlify.com/build/data-and-storage/netlify-db/) stellt die Postgres-Datenbank beim Deploy automatisch bereit
- `bcryptjs` für Passwort-Hashing, `jose` für Session-Tokens, `zod` für Validierung

## Deployment auf Netlify

Das Projekt ist für Netlify vorbereitet:

1. Repo mit Netlify verbinden (oder `netlify deploy --build --prod`)
2. Env-Var `SESSION_SECRET` in den Site-Einstellungen setzen
3. Beim ersten Deploy provisioniert Netlify automatisch eine Postgres-Datenbank
   und führt die SQL-Migration unter `netlify/database/migrations/001_init`
   aus – keine manuelle DB-Einrichtung nötig.

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
