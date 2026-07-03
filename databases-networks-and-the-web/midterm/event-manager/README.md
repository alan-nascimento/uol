# Event Manager

A deployable event manager built with Express.js, SQLite and EJS. It has two
distinct areas: an **Organiser** area for creating, editing, publishing and
deleting events, and an **Attendee** area for browsing published events and
booking tickets.

## Requirements

- Node.js >= 16 (developed on Node 24)
- npm >= 8
- SQLite 3

## Setup

From the project directory:

```
npm install
npm run build-db      # on Windows: npm run build-db-win
npm run start
```

Then open http://localhost:3000

- Main home page: http://localhost:3000/
- Organiser area: http://localhost:3000/organiser
- Attendee area: http://localhost:3000/attendee

To rebuild the database from scratch:

```
npm run clean-db      # on Windows: npm run clean-db-win
npm run build-db
```

## Organiser login (extension feature)

The organiser area is protected by authentication. A default account is created
by the database build script:

- **Username:** `organiser`
- **Password:** `password123`

## Additional libraries

- **express-session** — keeps the organiser logged in across requests (used by the authentication extension).
- **bcryptjs** — hashes and verifies the organiser password. Pure JavaScript, so it installs without native build tools.
- **express-validator** — server-side validation middleware for the forms.
- **date-fns** — formats stored ISO datetimes into readable text.
- **prettier** (dev only) — code formatting; not required to run the app.

## Project structure

```
index.js              App entry point: Express, sessions, DB, routes
helpers.js            View helpers (date and price formatting)
db_schema.sql         Database schema and seed data
routes/
  auth.js             Organiser login/logout + requireAuth middleware (extension)
  organiser.js        Organiser pages + sales dashboard (extension)
  attendee.js         Attendee pages + booking
views/                EJS templates (with shared partials/)
public/main.css       Styles
```
