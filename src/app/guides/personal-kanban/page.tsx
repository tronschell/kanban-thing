import type { Metadata } from "next"
import Link from "next/link"
import { generateMetadata } from "@/lib/metadata"
import { GuidePage } from "../guide-page"

export const metadata: Metadata = generateMetadata({
  title: "Personal Kanban: A Board for One Person",
  description:
    "How to run a kanban board on your own: which columns to use, why the work-in-progress limit is the whole point, and what a weekly review should cover.",
  path: "/guides/personal-kanban",
  type: "article",
})

export default function PersonalKanbanGuide() {
  return (
    <GuidePage
      title="Personal kanban: running a board for one"
      breadcrumb="Personal kanban"
      path="/guides/personal-kanban"
      lead="A board built for a team is a coordination device. A board built for one person is an attention device, and it needs different columns, a much harder limit on what is in flight, and a habit of looking at it once a week."
    >
      <h2>What personal kanban is</h2>
      <p>
        The term was popularised by{" "}
        <a
          href="https://moduscooperandi.com/modus-cooperandi/blog/personal-kanban-the-book"
          target="_blank"
          rel="noopener noreferrer"
        >
          <em>Personal Kanban</em>
        </a>
        , the 2011 book by Jim Benson and Tonianne DeMaria Barry, which reduces
        the practice to two rules: visualise your work, and limit your work in
        progress. That is the whole method. Everything below is just a way of
        keeping those two rules when nobody else is watching.
      </p>
      <p>
        The reason it works better than a to-do list is that a list has no
        middle. A list of forty items tells you nothing about which four you are
        actually holding open right now, and holding four things open is the
        thing that makes a week feel bad.
      </p>

      <h2>The columns</h2>
      <p>
        Start with the three a new board gives you and rename the first two:
      </p>
      <ul>
        <li>
          <strong>Backlog</strong> — everything, unordered, no guilt attached
        </li>
        <li>
          <strong>This week</strong> — what you have actually committed to
        </li>
        <li>
          <strong>Doing</strong> — what is open right now, and nothing else
        </li>
        <li>
          <strong>Done</strong> — cleared out when you review
        </li>
      </ul>
      <p>
        Resist adding more. On a solo board there are no handoffs, so extra
        columns are not describing a workflow, they are describing categories,
        and categories belong on the card as a colour. The one exception worth
        making is a <strong>Waiting</strong> column for things blocked on other
        people, because those are exactly the items that fall out of your head
        and resurface as a problem three weeks later. The general rule of thumb
        is in{" "}
        <Link href="/guides/kanban-columns">the guide to choosing columns</Link>
        .
      </p>
      <p>
        Backlog here is a separate panel to the left of the columns rather than
        an ordinary column, which turns out to be the right shape for solo work:
        the thing you want to see at a glance is the small set you committed to,
        not the pile you did not.
      </p>

      <h2>The limit is the whole point</h2>
      <p>
        Pick a number for Doing and keep it. For most people working alone the
        number is two, occasionally three, and it is almost never higher than
        that honestly.
      </p>
      <p>
        This board does not enforce a limit. It shows a count next to each
        column name, and that number is the entire mechanism. When Doing shows
        four and your limit is two, the correct move is to finish or explicitly
        park something, not to start the fifth. Some people put the limit in the
        column name — <em>Doing (2)</em> — so the count sits next to the number
        it is supposed to respect.
      </p>
      <p>
        Parking is a real move, not a failure: drag the card back to Backlog. A
        board with three things in Doing and one honest sentence in the card
        description about why the fourth got parked is far more useful than a
        board that pretends all four are progressing.
      </p>

      <h2>Getting everything out of your head first</h2>
      <p>
        The first pass is a brain dump and it should take five minutes, not an
        evening. Open Create, choose <em>Paste a list</em>, and paste one item
        per line straight from wherever your notes live. Bullets, numbers and
        checkbox markers are stripped automatically, and up to 200 lines go in
        at once, all landing in the Backlog.
      </p>
      <p>
        Then leave the backlog alone. Do not sort it, do not prioritise it. The
        only thing you do with the backlog is pull from it.
      </p>

      <h3>One card, one outcome</h3>
      <p>
        A card should name something that can be finished, not an area of
        responsibility. <em>Taxes</em> is a region of anxiety;{" "}
        <em>send P60 to the accountant</em> is a card. When a card genuinely has
        steps, put them in the description as markdown checklist lines:
      </p>
      <pre>
        <code>{`- [ ] find last year's return
- [ ] export bank CSV
- [ ] email both to the accountant`}</code>
      </pre>
      <p>
        Those render as tickable checkboxes with a done-out-of-total count, so a
        single card can carry a multi-step job without you having to break it
        into five cards that clog the board.
      </p>

      <h2>Dates, and when not to use them</h2>
      <p>
        Set a due date only when the date is real — a deadline someone else
        imposed, a flight, a renewal. Inventing due dates for everything trains
        you to ignore them, and the badge on the card turns red for anything due
        soon, which stops meaning anything if half the board is red.
      </p>
      <p>
        With real dates on the cards, the calendar view becomes worth opening:
        it lays the same cards out by due date across a month, and dragging a
        card to a different day changes its due date. That is the fastest way to
        do a rescheduling pass on a bad week.
      </p>

      <h2>The weekly review</h2>
      <p>
        Fifteen minutes, once a week, is what turns a board into a system. In
        order:
      </p>
      <ol>
        <li>
          <strong>Clear Done.</strong> Read it first — it is the only record you
          will get of what the week actually contained — then delete the cards.
        </li>
        <li>
          <strong>Find what stalled.</strong> Open the terminal from the board
          header and run <code>stuck 7</code>. It lists every card that has not
          changed column in a week, skipping the backlog and the last column.
          Each one is either abandoned, blocked, or too big, and each of those
          has a different fix.
        </li>
        <li>
          <strong>Look at what is coming.</strong> <code>due week</code> lists
          everything due in the next seven days; <code>due overdue</code> lists
          what you have already missed.
        </li>
        <li>
          <strong>Refill This week.</strong> Pull from the backlog, up to the
          limit you set, and stop.
        </li>
      </ol>
      <p>
        The Timeline and Pulse views cover the same ground with less typing if
        you would rather read than type: Timeline shows cards by most recent
        activity, and Pulse summarises what moved, what landed and what is
        stuck.
      </p>

      <h2>The expiry date is a feature here</h2>
      <p>
        Boards are deleted after the lifespan you choose — 14, 28 or 60 days —
        and the date cannot be pushed back. For a personal board that is
        genuinely useful rather than merely tolerable, because the failure mode
        of a solo board is not losing it, it is letting it silently rot into a
        four-hundred-card monument to things you were never going to do.
      </p>
      <p>
        Pick 28 days and treat the expiry as a scheduled reset. Near the end,
        duplicate the board with <em>Include cards</em> switched off to get the
        same columns and password on a clean board, then move across only what
        you still actually intend to do. Whatever you do not carry over was
        answering the question for you.
      </p>
      <p>
        If you want the record, export to JSON or CSV from the board menu before
        the date. And keep the link somewhere: boards are not listed anywhere
        and cannot be searched for, so the only route back in is the link plus
        the password. The board list at <Link href="/boards">/boards</Link>{" "}
        remembers boards you have opened, but it lives in one browser and
        clearing site data wipes it.
      </p>

      <h2>What a solo board is not for</h2>
      <ul>
        <li>
          <strong>Long-term reference.</strong> Anything you will want in six
          months belongs in a notes app, not on a board with a deletion date.
        </li>
        <li>
          <strong>Habits and recurring chores.</strong> There are no repeating
          cards. A daily habit on a kanban board becomes a card you recreate
          every day, which is worse than a checklist.
        </li>
        <li>
          <strong>Anything sensitive.</strong> Passwords, account numbers and
          medical details should not go on a board; anyone with the link and the
          password can read all of it.
        </li>
      </ul>
      <p>
        For everything else — a job hunt, a house move, a side project, a
        dissertation — one board with four columns and an honest limit on Doing
        does most of what a heavier tool would, without an account.{" "}
        <Link href="/about">What the tool does and does not do</Link> is the
        short version.
      </p>
    </GuidePage>
  )
}
