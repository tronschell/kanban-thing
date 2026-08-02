import type { Metadata } from "next"
import Link from "next/link"
import { generateMetadata } from "@/lib/metadata"
import { GuidePage } from "../guide-page"

export const metadata: Metadata = generateMetadata({
  title: "Share a Kanban Board: Edit Links vs Read-Only Links",
  description:
    "The difference between an editable board link and a read-only share link, what each one lets the holder do, and how to take access back from someone.",
  path: "/guides/read-only-board-links",
  type: "article",
})

export default function ReadOnlyBoardLinksGuide() {
  return (
    <GuidePage
      title="Sharing a board: edit links, read-only links and passwords"
      breadcrumb="Read-only board links"
      path="/guides/read-only-board-links"
      lead="There are no accounts here, so there are no roles either. Access is a property of the link somebody is holding. There are exactly two kinds, they behave very differently, and it is worth knowing which one you just pasted into a group chat."
    >
      <h2>The two links</h2>
      <p>
        Both are copied from the <strong>Share</strong> menu in the board
        header.
      </p>
      <h3>The edit link</h3>
      <p>
        This is the address the board is already open at, and it contains the
        board id. Opening it prompts for the board password. Once past that
        prompt the holder can do everything: add, edit, move and delete cards,
        add and rename and delete columns, rename the board, export it,
        duplicate it, change or remove the password, and delete the board
        outright.
      </p>
      <p>
        There is no lesser tier. Anyone with the edit link and the password is,
        for practical purposes, an owner. Treat handing it out the way you would
        treat handing out a shared account, because that is what it is.
      </p>

      <h3>The read-only link</h3>
      <p>
        A different address carrying a share token instead of the board id.
        Anyone who opens it sees the board in a read-only mode, with a banner
        saying so. It shows:
      </p>
      <ul>
        <li>the board name and how long the board has left before it expires</li>
        <li>the backlog and every column, in order, with a card count</li>
        <li>
          every card&apos;s title, colour and due date, with the same red badge
          on anything due within two days, and the first couple of lines of the
          description
        </li>
      </ul>
      <p>
        It does not offer anything else. There is no card editor, no drag and
        drop, no calendar, timeline or pulse view, no terminal, no export, and
        no board menu. Nothing on the page writes.
      </p>
      <p>
        Two things about it are worth knowing precisely. First,{" "}
        <strong>a read-only link needs no password</strong> — that is the point
        of it, and it is also the risk, so it is as shareable as the group you
        paste it into. Second, the URL does not contain the board id at all,
        only the share token. A holder of a read-only link cannot work backwards
        to the editable address; they would need the board id and the password,
        and the link gives them neither.
      </p>

      <h2>Which one to send</h2>
      <ul>
        <li>
          <strong>People doing the work</strong> get the edit link and the
          password.
        </li>
        <li>
          <strong>People who need to watch</strong> — a manager, a client, a
          neighbouring team, a stakeholder who wants a status update on Friday —
          get the read-only link and nothing else. It is the difference between
          reporting and inviting.
        </li>
        <li>
          <strong>Anywhere public</strong> — a wiki page, an email thread that
          gets forwarded, a shared channel — read-only, always, and expect it to
          travel further than you intended.
        </li>
      </ul>
      <p>
        A worked example of both in one meeting is in{" "}
        <Link href="/guides/retrospective-board">
          the retrospective guide
        </Link>
        : the team edits, the manager reads.
      </p>

      <h2>Taking access back</h2>
      <h3>Revoking the read-only link</h3>
      <p>
        <strong>Revoke view-only link</strong> in the Share menu invalidates the
        share token. Every read-only link you have already sent stops working
        immediately, everywhere, for everyone. The next one you copy uses a new
        address, so revoking is all-or-nothing: you cannot cut off one recipient
        and keep another.
      </p>
      <p>
        Until you revoke, copying the read-only link repeatedly gives you the
        same address. There is no way to issue two different read-only links
        with different lifetimes.
      </p>

      <h3>There is no revoking an edit link</h3>
      <p>
        The edit link is just the board address and it cannot be invalidated.
        What you can do is change what the address costs: open{" "}
        <strong>Board password</strong> from the board menu, enter the current
        password and set a new one. The next time anyone opens the board they
        are asked for the password again and the old one no longer works, so
        anyone you did not tell the new password to is out.
      </p>
      <p>
        The same dialog will remove the password entirely if you leave the new
        password empty. Do not do this on a board that matters. With no
        password, the link alone is full edit access, and links leak.
      </p>

      <h2>Where the password actually lives</h2>
      <p>
        The password you typed is kept in your own browser, in plain text, so
        that you are not asked for it every time you open the board. Two
        consequences follow.
      </p>
      <p>
        It is not recoverable from the site. Nobody can reset a board password
        for you, because there is no account to prove anything against. If
        everyone forgets it, the board is gone as far as you are concerned and
        will delete itself on schedule.
      </p>
      <p>
        And it is not in the board list export. The list of boards at{" "}
        <Link href="/boards">/boards</Link> can be exported to a JSON file so
        you can move it to another browser or keep a copy, but board passwords
        are deliberately left out of that file. Store them wherever you keep
        other shared credentials.
      </p>

      <h2>When one link is not enough</h2>
      <p>
        Because access is per board rather than per person, the answer to
        &quot;these five people should see everything and these three should see
        only part of it&quot; is two boards, not one board with permissions.
        Duplicating is quick — same columns, same password, fresh lifespan, and
        an <em>Include cards</em> toggle if you want the layout without the
        contents — so splitting a board is a smaller job than it sounds.
      </p>
      <p>
        Splitting well is mostly a question of drawing the boundary in the
        columns, which is covered in{" "}
        <Link href="/guides/kanban-columns">the guide to choosing columns</Link>
        .
      </p>

      <h2>What a shared link is not</h2>
      <ul>
        <li>
          <strong>Not permanent.</strong> Every board is deleted at the end of
          the lifespan it was created with, up to a maximum of 60 days, and the
          date cannot be moved. Both kinds of link die with it. If somebody
          needs the contents after that, export the board to JSON or CSV and
          send them the file.
        </li>
        <li>
          <strong>Not an audit trail.</strong> There are no users, so there is
          no record of who moved a card. The board knows a card moved from one
          column to another and when — that is what the timeline and pulse views
          read — but not by whom.
        </li>
        <li>
          <strong>Not a place for secrets.</strong> Anyone with a link and the
          password reads everything on the board. Credentials, personal data and
          anything you would not put in a group chat do not belong there. The{" "}
          <Link href="/terms">terms</Link> say the same thing in fewer words.
        </li>
        <li>
          <strong>Not live.</strong> The board does not push other
          people&apos;s changes onto your screen as they happen. If two of you
          are working at the same time, reload to see what the other one did.
        </li>
      </ul>
      <p>
        For the full picture of what is and is not here, see{" "}
        <Link href="/about">the about page</Link>.
      </p>
    </GuidePage>
  )
}
