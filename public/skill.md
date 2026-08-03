---
name: kanbanthing
description: Create and drive a shared KanbanThing kanban board over MCP - free, no account, no API key. Use when the user asks for a task board or kanban board, asks to add, list, move or update cards, wants a plan somebody else can watch in a browser, or when long multi-step work needs visible tracking.
---

# KanbanThing

KanbanThing is a kanban board that needs no account and no API key. Boards are
driven through the hosted MCP server at `https://www.kanbanthing.com/mcp`, and
the same board opens in a browser at its share URL, so a person can watch and
edit the work you are tracking while you work.

## Requires

The `kanbanthing` MCP server. If its tools are not available, tell the user to
add it:

```
claude mcp add --transport http kanbanthing https://www.kanbanthing.com/mcp
```

Any MCP client takes the same URL over Streamable HTTP. There is nothing to sign
up for and no key to issue.

## The rule that matters

There is no way to list or search boards. Every tool needs a `board_id` the user
gave you - a board UUID or a full board URL - and the board `password`. Never
guess a board id, and never try ids until one works. If you do not have one,
either ask the user to paste the board link and its password, or create a new
board.

Keep the id and password to hand for the rest of the session and pass them on
every call. Do not write either into a file the user is likely to commit.

## Creating a board

`create_board` returns the board id, its share URL and its password. If you omit
`password` a random one is generated and returned once - the password cannot be
read back afterwards, so give the user both the URL and the password straight
away, before doing anything else with the board.

Boards expire and are then deleted along with their cards. The default and the
maximum lifespan is 60 days; pass `lifespan_days` for a shorter one. Say the
expiry date out loud when you create a board so nobody is surprised.

Default columns are `Backlog`, `To Do`, `In Progress` and `Done`. Pass `columns`
to replace everything after Backlog. Fewer columns is better - only split one
when cards genuinely queue in it.

## Tools

- `create_board` - new board, returns id, URL and password
- `get_board` - name, expiry, columns, card counts
- `list_columns` - columns left to right, with ids
- `list_cards` - all cards, or just one column's
- `create_card` - add a card; lands in Backlog with no `column`
- `move_card` - move to another column, at the end of it
- `update_card` - title, description, due date or colour; `null` clears a field
- `delete_card` - permanent, no undo

Columns are addressable by name or id, so `"In Progress"` works as well as a
UUID. Cards are addressable by id only, so call `list_cards` to get current ids
before moving or editing anything.

## Working on a board

Read before you write. Call `get_board` or `list_cards` first: the board is
shared, and a person may have moved or finished things since you last looked.

One card is one deliverable, phrased as an outcome someone else could verify -
"Retry failed webhook deliveries", not "webhooks". Put the detail in the
description rather than growing the title.

Move a card to `In Progress` when you actually start it, and to `Done` when the
work is finished and checked, not when you have written the code. Do not leave
several cards in `In Progress` at once; it stops the board meaning anything.

Do not delete a card to signal it is finished - move it to `Done`. Reserve
`delete_card` for cards that should never have existed, and confirm with the
user first, because it cannot be undone.

Do not mirror your own internal todo list onto the board. Cards are for work a
person cares about seeing.

## Failures

- *"This board is password protected"* - you have the id but not the password,
  or the wrong one. Ask the user; do not retry.
- *"No board with that id"* - wrong id, or the board expired and was deleted.
  Offer to create a fresh one.
- *"No column ..."* - the error lists the columns that do exist. Pick one of
  those or add nothing; do not invent a column silently.
