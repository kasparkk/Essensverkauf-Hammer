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
- [Prisma](https://www.prisma.io) mit SQLite (`@prisma/adapter-better-sqlite3`)
- `bcryptjs` für Passwort-Hashing, `jose` für Session-Tokens, `zod` für Validierung

## Loslegen

```bash
npm install
cp .env.example .env   # SESSION_SECRET durch einen eigenen zufälligen Wert ersetzen
npx prisma migrate deploy
npm run dev
```

Die App läuft dann auf [http://localhost:3000](http://localhost:3000).

## Projektstruktur

- `src/app` – Seiten & API-Routen (App Router)
- `src/lib` – Prisma-Client, Auth-Helper, Formatierung
- `src/components` – geteilte UI-Komponenten
- `prisma/schema.prisma` – Datenmodell (User, Trip, Request, Conversation, Message)
