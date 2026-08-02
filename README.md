# KanbanThing

A free kanban board you can share with a link. No account, no email, no install.

**<https://www.kanbanthing.com>**

You name a board, choose a password, and get a link. Anyone you send that link to opens the
same board and moves the same cards. That last part is the point — most free no-signup kanban
tools keep the board in one browser's local storage, so it can never really be shared. This
one is shared by default.

## What it does

- **Columns** you can add, rename and reorder, starting from To Do, In Progress and Done
- **Cards** with a description, a colour and a due date, moved by drag and drop or from the card menu
- A **backlog** for work that is not scheduled yet
- A **calendar view** of the same cards by due date, and a **timeline view** by most recent activity
- A **password on every board**, set when the board is created, plus a **read-only link** for
  people who should see the board but not change it
- **Light and dark** appearance, following your system setting
- A **command line client** with `--json` on every command, so a script or an AI agent can
  drive the same board a person has open in a browser — see [the CLI docs](https://www.kanbanthing.com/cli)

## What it does not do

There are no accounts, no teams, no permissions and no paid tier. **Boards are deleted up to
60 days after they are created**, so copy out anything you want to keep.

If you need long-lived project history, this is the wrong tool, and that is on purpose. It
suits work with an end in sight: a retrospective, a short project, or a personal board you
start again every few weeks.

## Guides

- [Choosing the columns on a kanban board](https://www.kanbanthing.com/guides/kanban-columns)
- [Running a retrospective on a shared board](https://www.kanbanthing.com/guides/retrospective-board)
- [Personal kanban: running a board for one](https://www.kanbanthing.com/guides/personal-kanban)
- [Edit links, read-only links and passwords](https://www.kanbanthing.com/guides/read-only-board-links)

## Built with

Next.js, React, TypeScript and Tailwind CSS, with Supabase for storage. Made and maintained
by Tron Schell.

## Running it locally

Requires Node 20 or newer and a Supabase project.

```bash
npm install
npm run dev
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`. The SQL
that builds the schema lives in `db/`, applied in filename order.

```bash
npm run build       # production build
npm test            # vitest
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
```
