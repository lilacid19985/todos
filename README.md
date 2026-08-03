# todos

A minimal todo tracker. Every todo is a plan of steps; the todo completes
itself when the last step is checked off. Steps run one after another by
default, and you can unlink any of them to run side by side. The main view
shows only what's actually open — one card per open step, checkable in place.

## Run it

```bash
npm install
# point DATABASE_URL at a Postgres you can reach — a local one is simplest:
#   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=dev --name todos-pg postgres
echo 'DATABASE_URL="postgresql://postgres:dev@localhost:5432/postgres"' > .env
npx prisma db push   # first time only — creates the tables
npm run dev
```

Open http://localhost:3000

To use the deployed database from your machine instead, turn on public
networking for the Railway Postgres service and use its `DATABASE_PUBLIC_URL`.
It is off by default, and that URL has no host until you enable it.

Optional: `node prisma/seed.mjs` fills an empty database with a few example
todos. It refuses to run if you already have any.

## How it works

- **Todos** have a title, short description, and a priority (Highest → Lowest).
  You can't check off a todo directly.
- **Steps** are ordered — first to last, each one waiting on the step above it.
  Checking off the last open step completes the todo. You can check them in any
  order; the order is a plan, not a lock.
- **Unlink** (the chain icon on each step in the form) cuts a step loose from
  the one directly above it, so the two run side by side instead of one after
  the other. Unlink step 3 and steps 2 and 3 both come up as soon as 1 is done
  — and step 4 waits for both of them. Unlink 4 as well and all three come up
  together. Steps that run alongside each other share a number in the plan; the
  ones after the first are marked `+`. The first step can't be unlinked, since
  nothing runs before it.
- **Me / someone else.** Each step is on you by default. Toggle it to "someone
  else" for anything you're only waiting on — put their name in the step text,
  e.g. *"wait for Sam to send the proposal"*.
- **Next up** (the main view) shows one card per step that's open right now, so
  a todo with unlinked steps gets a card each (they're badged "2 at once").
  Check one off right on the card, or click it for the full plan — finished
  steps, upcoming ones, and an Edit button top-right.
- **Priority is a colour**, never a word on the card: the rail down a card's
  left edge runs red (highest), orange, yellow, light blue, dark blue (lowest).
  Open a todo and the level is spelled out inside.
- **The order is automatic** — there's nothing to sort, and no sections. One
  list: everything you can act on now comes first, then what you're waiting on
  someone else for, then todos with no steps yet, with priority deciding inside
  each of those. Your own work is always at the top, and the card sitting there
  is what to do next.
- **All todos** (`/all`) is the full list, including completed ones, if you want
  the wider view.

### Keyboard

In the create/edit form, Enter never submits — it moves you along. Title →
description, priority → first step, and inside the step list it jumps to the
next step or adds a new one. Use the Create/Save button to commit.

## Deploying

**Database — Railway Postgres.** Add a Postgres service to the project, then
set `DATABASE_URL` on the app service to the reference `${{Postgres.DATABASE_URL}}`
so Railway resolves it over the private network. `npm start` runs
`prisma db push` before booting, so a fresh database gets its tables on the
first deploy and schema changes apply on the next one.

Railway deploys the `main` branch of the connected GitHub repo.

**Password.** Set `APP_PASSWORD` in the environment and the whole site goes
behind a single password prompt at `/login`. Leave it unset (as in the local
`.env`) and there is no login at all, which is what you want on localhost.

## Layout

```
prisma/schema.prisma      Todo, Step
src/lib/queries.ts        reads + the one sort order
src/lib/actions.ts        server actions (create/update/delete/toggle)
src/app/(app)/page.tsx    main view — next-up cards + detail modal
src/app/(app)/all         full list
src/app/(app)/new         create form
src/app/(app)/todo/[id]   edit form
src/middleware.ts         password gate (no-op unless APP_PASSWORD is set)
```
