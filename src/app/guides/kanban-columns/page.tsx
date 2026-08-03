import type { Metadata } from "next"
import Link from "next/link"
import { generateMetadata } from "@/lib/metadata"
import { GuidePage } from "../guide-page"

export const metadata: Metadata = generateMetadata({
  title: "How to Choose Kanban Board Columns",
  description:
    "Which columns a kanban board should have, when to split one, how to name them, and how to tell from the board itself that the columns are wrong.",
  path: "/guides/kanban-columns",
  type: "article",
})

export default function KanbanColumnsGuide() {
  return (
    <GuidePage
      title="How to choose the columns on a kanban board"
      breadcrumb="Kanban columns"
      path="/guides/kanban-columns"
      published="2026-08-02"
      lead="The columns are the only design decision a board really asks of you. Everything else is cards. This is how to pick them, when to split one in two, and how to tell from the board itself that you got them wrong."
    >
      <h2>What a column actually represents</h2>
      <p>
        A column is a state a piece of work can be in, not a category of work
        and not a person. The point of drawing them side by side is that you
        can see where work piles up. Kanban comes out of the Toyota Production
        System, where Taiichi Ohno used cards to signal what should be produced
        and when; the Japanese word means <em>signboard</em>, and the signboard
        is doing the same job on a software team that it did on a factory floor
        (see the{" "}
        <a
          href="https://en.wikipedia.org/wiki/Kanban"
          target="_blank"
          rel="noopener noreferrer"
        >
          overview of kanban and its origins
        </a>
        ).
      </p>
      <p>
        That is worth holding on to, because it rules out a lot of column
        schemes. Columns named after people (Sam, Priya, Alex) tell you who is
        busy but not what is stuck. Columns named after types of work (Bugs,
        Features, Chores) turn the board into four to-do lists that never
        interact. If you cannot point at a column and say what has to happen to
        a card before it leaves, it is not a state.
      </p>

      <h2>Start with three and add only under pressure</h2>
      <p>
        A new board here opens with <strong>To Do</strong>,{" "}
        <strong>In Progress</strong> and <strong>Done</strong>, plus a separate
        Backlog panel. Three columns is a genuinely good default, and most
        boards that go wrong go wrong by adding a fourth and fifth column before
        anybody has felt the need for one.
      </p>
      <p>
        Run it for a week or two first. The columns you need will announce
        themselves as the ones you keep explaining in standup: <em>it is done
        but not reviewed</em>, <em>it is waiting on the client</em>,{" "}
        <em>it is merged but not deployed</em>. Each of those sentences is a
        column you do not have yet.
      </p>

      <h3>The test for splitting a column</h3>
      <p>
        Split a column when you cannot answer <em>whose turn is it?</em> for
        every card in it. In Progress usually fails this test first, because it
        holds two different things: work somebody is actively doing, and work
        that is parked waiting on someone else. Those look identical on the
        board and are completely different problems. Splitting into{" "}
        <strong>Doing</strong> and <strong>Waiting</strong>, or adding a{" "}
        <strong>Blocked</strong> column, makes the difference visible and makes
        the pile-up embarrassing, which is the point.
      </p>
      <p>
        The other common split is at the end. <strong>In Review</strong> before
        Done catches the work that one person considers finished and nobody else
        has looked at.
      </p>

      <h3>Name columns after states, in the order work travels</h3>
      <p>
        Left to right, in the direction cards move. It sounds obvious and it is
        the first thing that breaks when a column is added in a hurry, because
        the new column lands on the end. Drag columns into the right order using
        the handle in the column header, and rename them from the column menu.
        Both are safe to do at any time and neither touches the cards.
      </p>
      <p>
        Prefer short, concrete names. <em>In Review</em> beats{" "}
        <em>Awaiting stakeholder sign-off</em>, which will be truncated on any
        narrow screen anyway.
      </p>

      <h2>Make Done mean exactly one thing</h2>
      <p>
        The most expensive ambiguity on a board is a Done column that means
        <em> I stopped working on it</em> to one person and{" "}
        <em>it is live for customers</em> to another. Write the definition down
        somewhere the team can see it. On this board the natural place is a card
        in the last column that never moves and holds the checklist, because
        card descriptions accept markdown and any line written as{" "}
        <code>- [ ] deployed to production</code> becomes a real tickable
        checkbox with a progress count.
      </p>
      <p>
        If the definition of done is long enough that people forget half of it,
        that is a signal to split the last column rather than to write a longer
        card.
      </p>

      <h2>The backlog is not a column</h2>
      <p>
        Everything not scheduled yet belongs in the Backlog, which sits as its
        own panel to the left of the columns rather than as an ordinary column.
        Keeping it separate matters more than it sounds: the moment the backlog
        becomes column one, it starts competing for attention with work that is
        genuinely in flight, and a board with two hundred cards in the first
        column tells you nothing.
      </p>
      <p>
        The Backlog is also where cards land by default, so the fastest way to
        empty your head is to open Create, choose <em>Paste a list</em>, and
        drop in one line per card. Bullets, numbering and checkbox markers are
        stripped, so you can paste straight out of a notes app or a meeting
        document.
      </p>

      <h2>How many columns is too many</h2>
      <p>
        The honest answer is: as soon as the board no longer fits on one screen.
        Columns are a fixed width and the board scrolls horizontally past that
        point, and a state you have to scroll to find is a state nobody looks
        at. On a laptop that is around five or six columns including the
        backlog; on a phone it is fewer.
      </p>
      <p>
        Deleting a column removes every card inside it permanently, so move the
        cards out first. That is deliberate, but it means column pruning is a
        job to do carefully rather than while distracted.
      </p>

      <h2>Limiting work in progress (WIP limits)</h2>
      <p>
        The reason kanban has columns at all is to expose how much is in flight
        at once, and the classic discipline is an upper limit on the number of
        cards allowed in a column. This board does not enforce limits: it shows
        a count next to each column name and leaves the limit to you.
      </p>
      <p>
        That is less useless than it sounds, because the count is the number you
        actually argue about. Agree that In Progress holds at most two cards per
        person, put the number in the column name if it helps
        (<em>In Progress (4)</em>), and treat going over as a signal to finish
        something rather than to start something. If you are working alone, the
        limit matters even more, which is the subject of{" "}
        <Link href="/guides/personal-kanban">the personal kanban guide</Link>.
      </p>

      <h2>Checking whether the columns are working</h2>
      <p>
        A column layout is a hypothesis, and the board will tell you if it is
        wrong. Two things to look at:
      </p>
      <ul>
        <li>
          <strong>Cards that never move.</strong> Open the terminal from the
          board header and run <code>stuck 7</code> to list every card that has
          not changed column in a week. It skips the backlog and the last
          column, so what comes back is genuinely stalled work. If everything
          stuck is in one column, that column is either mis-named or hiding a
          handoff.
        </li>
        <li>
          <strong>Columns nobody uses.</strong> The Pulse view summarises what
          moved recently and what is overdue. A column that never appears in it
          is decoration.
        </li>
      </ul>

      <h2>Four kanban board layouts worth copying</h2>
      <ul>
        <li>
          <strong>Small software team.</strong> Backlog, To Do, In Progress, In
          Review, Done. The review column is the whole reason this is not three
          columns.
        </li>
        <li>
          <strong>Freelance or client work.</strong> Backlog, To Do, Doing,
          Waiting on client, Done. The waiting column is where the money goes,
          and it is the one you want to be able to point at in a status call.
        </li>
        <li>
          <strong>Hiring.</strong> Applied, Screening, Interview, Offer, Closed.
          Each card is one candidate and the columns are stages, which is the
          cleanest possible fit for a board.
        </li>
        <li>
          <strong>Content or launch checklist.</strong> Ideas, Drafting, Edit,
          Scheduled, Published. Due dates on the cards make the{" "}
          <em>Scheduled</em> column readable in the calendar view as well.
        </li>
      </ul>

      <h2>Change the columns, keep the board</h2>
      <p>
        Renaming and reordering are cheap and you should do them the moment the
        names stop describing reality. If the layout has drifted far enough that
        you want a clean start, duplicate the board with <em>Include cards</em>{" "}
        switched off: you get the same columns, the same password and a fresh
        60-day lifespan, with nothing on it.
      </p>
      <p>
        That is also a decent way to keep a house layout around, since{" "}
        <Link href="/about">boards here are deleted after at most 60 days</Link>
        . For a board that only needs to exist for one meeting, the{" "}
        <Link href="/guides/retrospective-board">retrospective guide</Link>{" "}
        covers a column set built for exactly that.
      </p>
    </GuidePage>
  )
}
