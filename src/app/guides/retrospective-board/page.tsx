import type { Metadata } from "next"
import Link from "next/link"
import { generateMetadata } from "@/lib/metadata"
import { GuidePage } from "../guide-page"

export const metadata: Metadata = generateMetadata({
  title: "How to Run a Retrospective on a Kanban Board",
  description:
    "A practical setup for a sprint retrospective on a shared board: which columns to use, how to gather input before the meeting, and how to end with owned actions.",
  path: "/guides/retrospective-board",
  type: "article",
})

export default function RetrospectiveBoardGuide() {
  return (
    <GuidePage
      title="How to run a retrospective on a shared board"
      breadcrumb="Retrospective board"
      path="/guides/retrospective-board"
      published="2026-08-02"
      lead="A retrospective is one meeting with a short shelf life, which makes it an awkward fit for a permanent project tool and a very good fit for a board you can throw away afterwards. Here is a setup that takes about a minute."
    >
      <h2>What the meeting is for</h2>
      <p>
        The twelfth principle behind the{" "}
        <a
          href="https://agilemanifesto.org/principles.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          Agile Manifesto
        </a>{" "}
        is that a team should stop at regular intervals to reflect on how to
        become more effective, and then adjust how it works. The{" "}
        <a
          href="https://scrumguides.org/scrum-guide.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          Scrum Guide
        </a>{" "}
        makes that a named event, the Sprint Retrospective, whose purpose is to
        plan ways to increase quality and effectiveness, and which it timeboxes
        to at most three hours for a one-month sprint (for shorter sprints, it
        says, the event is usually shorter).
      </p>
      <p>
        The practical consequences of that are the two things most
        retrospectives get wrong. It is timeboxed, so gathering the raw material
        during the meeting wastes most of the box. And the output is a change to
        how the team works, so a retrospective that ends with a list of feelings
        and no owned actions has not finished.
      </p>

      <h2>Setting up the retrospective board</h2>
      <p>
        Create a board, name it after the sprint or the date, and pick a
        14-day lifespan rather than the 60-day default. That is not a
        limitation to work around; it is the useful part. The board deletes
        itself long before it becomes a graveyard nobody remembers agreeing to,
        and there is no cleanup task afterwards.
      </p>
      <p>
        A new board arrives with To Do, In Progress and Done. Rename them from
        each column menu and add a fourth. Four columns that work:
      </p>
      <ul>
        <li>
          <strong>Went well</strong> — keep doing this
        </li>
        <li>
          <strong>Did not go well</strong> — the observations, not the blame
        </li>
        <li>
          <strong>Ideas</strong> — anything somebody wants to try
        </li>
        <li>
          <strong>Actions</strong> — the only column that survives the meeting
        </li>
      </ul>
      <p>
        Start / Stop / Continue and Mad / Sad / Glad are the same shape with
        different labels, and both work fine here. What matters is that the
        final column is for committed actions and nothing else, so that at the
        end of the hour you can look at one column and know what changed. More
        on the general principle in the{" "}
        <Link href="/guides/kanban-columns">guide to choosing columns</Link>.
      </p>

      <h2>Gather the material before the meeting, not during it</h2>
      <p>
        Send the link and the password two days ahead and ask everyone to add
        cards as things occur to them. This is the single biggest improvement
        available to most retrospectives: the quiet half of the team gets to
        think, and the meeting starts with material instead of silence.
      </p>
      <p>
        If people send you notes instead, open Create, choose{" "}
        <em>Paste a list</em>, pick a column and paste them one per line. Bullet
        characters, numbering and checkbox markers are stripped, so a pasted
        chunk of meeting notes turns into cards without editing. Up to 200 lines
        go in at once.
      </p>
      <p>
        Because there are no accounts, nobody has to be invited and nobody
        signs up to contribute. Anyone with the link and the board password can
        add cards, which is the right level of ceremony for a meeting that lasts
        an hour. It also means everyone can edit everything, so if that is a
        problem for your group, read on to the sharing section.
      </p>
      <p>
        One thing to know before the meeting: the board does not push other
        people&apos;s changes to your screen as they happen. If several people
        have it open at once, reload to pick up what everyone else added. In
        practice this only matters during the silent reading phase, and one
        reload at the start of the discussion is enough.
      </p>

      <h3>Grouping without a whiteboard</h3>
      <p>
        Cards take a colour from a set of seven, or a custom hex value. Use it
        for themes rather than for sentiment, since the columns already carry
        the sentiment: one colour for deployment pain, one for meetings, one for
        anything about the codebase. Once ten cards are up, the colours make the
        clustering obvious without anyone having to physically move stickies
        around.
      </p>

      <h2>Running the hour</h2>
      <ol>
        <li>
          <strong>Read in silence for five minutes.</strong> Everyone has the
          board open. No discussion yet.
        </li>
        <li>
          <strong>Group and dedupe.</strong> One person drags near-identical
          cards together and deletes the duplicates while the others talk.
        </li>
        <li>
          <strong>Discuss the top few themes only.</strong> A timebox forces
          this. Three themes discussed properly beats eleven mentioned.
        </li>
        <li>
          <strong>Write the actions as you go.</strong> A card in the Actions
          column, one owner named in the title, a due date set on the card. If
          it has no owner and no date it is an idea, and it belongs in the Ideas
          column where it can be honest about itself.
        </li>
      </ol>
      <p>
        For an action with several steps, put them in the card description as
        markdown checklist lines — <code>- [ ] draft the runbook</code> — and
        they render as tickable boxes with a progress count, so you can see how
        far an action got before the next retrospective.
      </p>

      <h2>Sharing the outcome without letting anyone rewrite it</h2>
      <p>
        A manager or a neighbouring team usually wants to see what came out of
        the meeting, and usually should not be able to edit it. Copy a view-only
        link from the Share menu instead of the edit link: it needs no password,
        opens the same columns and cards read-only, and can be revoked later.
        The differences are covered in{" "}
        <Link href="/guides/read-only-board-links">
          the guide to edit links and read-only links
        </Link>
        .
      </p>

      <h2>Keeping the record</h2>
      <p>
        The board expires and cannot be extended, so before it does, export it.
        JSON and CSV are both in the board menu; CSV is the one to use if the
        actions are going into a spreadsheet or a ticket tracker, since each
        card becomes a row with its column, title, description, colour and due
        date.
      </p>
      <p>
        For the next retrospective, duplicate the board with{" "}
        <em>Include cards</em> switched off. You get the same four columns and
        the same password on an empty board, which saves renaming three columns
        again. Note that a duplicate always starts a 60-day lifespan and there
        is no way to shorten it, so if you want the 14-day expiry back, create
        the next board from scratch instead.
      </p>

      <h2>Things that reliably go wrong</h2>
      <ul>
        <li>
          <strong>One person typing.</strong> If the facilitator is the only one
          with the board open, you have run a meeting with extra steps. The
          link and password exist so that everybody has it open.
        </li>
        <li>
          <strong>Actions with no owner.</strong> A card titled{" "}
          <em>improve testing</em> is a wish. A card titled{" "}
          <em>Priya: add a smoke test to the deploy job</em> with a date on it
          is an action.
        </li>
        <li>
          <strong>Carrying everything forward.</strong> Most cards in{" "}
          <em>Did not go well</em> are meant to be read once and dropped. Only
          the Actions column deserves to survive, and letting the board expire
          enforces that better than good intentions do.
        </li>
        <li>
          <strong>Putting sensitive material on the board.</strong> Anyone with
          the link and password can read all of it, and performance
          conversations about named individuals do not belong there.
        </li>
      </ul>
    </GuidePage>
  )
}
