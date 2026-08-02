import type { ReactNode } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { generateMetadata } from "@/lib/metadata"
import { Button } from "@/components/ui/button"
import { CliStats } from "@/components/cli-stats"

export const metadata: Metadata = generateMetadata({
  title: "KanbanThing CLI - Drive a Kanban Board From the Terminal",
  description:
    "kanbanthing is a command line client for KanbanThing. Create boards, add, list and move cards from a shell or a script, with --json output for AI agents.",
  path: "/cli",
})

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "kanbanthing",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Linux, macOS, Windows",
  softwareRequirements: "Node.js 20 or newer",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description:
    "A command line client for KanbanThing. Create boards, add, list and move cards from a terminal, with machine-readable JSON output for AI agents.",
  codeRepository: "https://github.com/tronschell/kanban-cli",
}

const COMMANDS: [string, string][] = [
  ["login <board-url>", "Sign in to a board and remember it on this machine"],
  ["logout", "Forget the stored credentials for a board"],
  ["boards", "List the boards you are signed in to"],
  ["use <alias|uuid>", "Set the board later commands run against"],
  ["create <name>", "Create a board and sign in to it"],
  ["board", "Show the current board: name, columns and expiry"],
  ["ls [column]", "List cards, optionally in one column"],
  ["add <title>", "Add a card"],
  ["mv <card> <column>", "Move a card to another column"],
  ["edit <card>", "Change a card's title, description, colour or due date"],
  ["rm <card>", "Delete a card"],
  ["columns", "List the columns on the board"],
  ["column add <name>", "Add a column"],
  ["column rename <col> <name>", "Rename a column"],
  ["column rm <col>", "Delete a column and the cards in it"],
  ["rename <name>", "Rename the board"],
  ["password", "Change the board password"],
  ["share", "Print the board's share link"],
  ["delete", "Delete the board"],
  ["version", "Print the CLI version"],
  ["help [command]", "Show usage for the CLI or one command"],
]

const FLAGS: [string, string][] = [
  ["--json", "Machine-readable output on every command"],
  ["--board <alias|uuid>", "Run this command against a board other than the default"],
  ["--no-color", "Plain output with no ANSI escapes"],
  ["--help", "Usage for the CLI, or for the command in front of it"],
  ["--version", "Print the version and exit"],
]

const EXIT_CODES: [string, string][] = [
  ["0", "Success"],
  ["1", "Error"],
  ["2", "Usage error"],
  ["3", "Authentication failure"],
  ["4", "Not found"],
]

export default function CliPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <header className="border-b border-subtle">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="focus-ring rounded text-sm font-semibold text-fg"
          >
            KanbanThing
          </Link>
          <Button asChild size="sm">
            <Link href="/onboarding">Create board</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-semibold text-fg md:text-5xl">
          The KanbanThing CLI
        </h1>
        <p className="mt-5 text-md text-muted">
          <code className="font-mono text-fg">kanbanthing</code> is a terminal
          client for a KanbanThing board. It signs in to a board with its link
          and password, then creates boards, lists, adds, edits and moves cards,
          and manages columns from a shell. Every command takes{" "}
          <code className="font-mono text-fg">--json</code>, so a script or an
          AI agent can drive the same board a person has open in a browser.
        </p>

        <CliStats />

        <Section title="Install">
          <p className="text-md text-muted">Requires Node 20 or newer.</p>
          <Code>npm i -g kanbanthing</Code>
          <p className="mt-4 text-md text-muted">
            The binary is called <code className="font-mono text-fg">kanban</code>.
            To run it without installing anything:
          </p>
          <Code>npx kanbanthing</Code>
        </Section>

        <Section title="Quickstart">
          <p className="text-md text-muted">
            Sign in with the board link you already share with your team. The
            board password is asked for once and kept on this machine.
          </p>
          <Code>{`kanban login https://kanbanthing.com/board?id=<board-id>
kanban add "Write the spec"
kanban ls
kanban mv "Write the spec" Done`}</Code>
        </Section>

        <Section title="Commands">
          <Table heading="Command" rows={COMMANDS} />
          <p className="mt-3 text-xs text-subtle">
            Every command runs against the board set by{" "}
            <code className="font-mono">use</code>, or the one named by{" "}
            <code className="font-mono">--board</code>.
          </p>
        </Section>

        <Section title="Global flags">
          <Table heading="Flag" rows={FLAGS} />
        </Section>

        <Section title="For AI agents">
          <p className="text-md text-muted">
            Add <code className="font-mono text-fg">--json</code> to any command
            and it prints a JSON object instead of formatted text. To sign in
            without a prompt, set{" "}
            <code className="font-mono text-fg">KANBAN_BOARD</code> to a board
            id or URL and{" "}
            <code className="font-mono text-fg">KANBAN_PASSWORD</code> to its
            password.
          </p>
          <Code>{`export KANBAN_BOARD=<board-id>
export KANBAN_PASSWORD=<board-password>
kanban ls --json`}</Code>
          <p className="mt-6 text-md text-muted">Exit codes:</p>
          <Table heading="Code" rows={EXIT_CODES} />
        </Section>

        <Section title="Source">
          <p className="text-md text-muted">
            The CLI is open source at{" "}
            <a
              href="https://github.com/tronschell/kanban-cli"
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring rounded text-accent underline underline-offset-4"
            >
              github.com/tronschell/kanban-cli
            </a>
            .
          </p>
        </Section>

        <Button asChild variant="ghost" className="mt-10">
          <Link href="/">Back to home</Link>
        </Button>
      </main>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="mt-14">
      <h2 className="text-2xl font-semibold text-fg md:text-3xl">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-4 overflow-x-auto rounded-panel border border-subtle bg-surface p-4 font-mono text-sm text-fg scrollbar-thin">
      {children}
    </pre>
  )
}

function Table({
  heading,
  rows,
}: {
  heading: string
  rows: [string, string][]
}) {
  return (
    <div className="mt-4 overflow-x-auto scrollbar-thin">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-subtle">
            <th className="py-2 pr-6 text-xs font-medium uppercase tracking-wide text-subtle">
              {heading}
            </th>
            <th className="py-2 text-xs font-medium uppercase tracking-wide text-subtle">
              Meaning
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-subtle">
          {rows.map(([name, description]) => (
            <tr key={name}>
              <td className="py-2.5 pr-6 align-top font-mono text-sm text-fg">
                {name}
              </td>
              <td className="py-2.5 align-top text-sm text-muted">
                {description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
