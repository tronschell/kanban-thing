import type { ReactNode } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { generateMetadata } from "@/lib/metadata"
import { Button } from "@/components/ui/button"
import { CliStats } from "@/components/cli-stats"
import { CliTable } from "@/components/cli-table"
import { CopyButton } from "@/components/copy-button"

export const metadata: Metadata = generateMetadata({
  title: "KanbanThing CLI and MCP Server - Drive a Kanban Board From the Terminal",
  description:
    "kanbanthing is a command line client for KanbanThing. Create boards, add, list and move cards from a shell or a script, or connect Claude, ChatGPT, Cursor and VS Code to the hosted MCP server at kanbanthing.com/mcp.",
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
  ["use <alias>", "Set the board later commands run against"],
  ["create <name>", "Create a board and sign in to it"],
  ["board", "Show the current board: name, columns and expiry"],
  ["ls [--column <name>] [--all]", "List cards, optionally in one column"],
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

const MCP_TOOLS: [string, string][] = [
  ["create_board", "Create a board and return its id, share URL and password"],
  ["get_board", "The board's name, expiry, columns and card counts"],
  ["list_columns", "The columns on a board, left to right, with their ids"],
  ["list_cards", "The cards on a board, or only those in one column"],
  ["create_card", "Add a card to a column"],
  ["move_card", "Move a card to another column"],
  ["update_card", "Change a card's title, description, due date or colour"],
  ["delete_card", "Delete a card"],
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
          <Code>{`kanban login https://www.kanbanthing.com/board?id=<board-id>
kanban add "Write the spec"
kanban ls
kanban mv "Write the spec" Done`}</Code>
        </Section>

        <Section title="Use it from an AI agent">
          <p className="text-md text-muted">
            KanbanThing also hosts an MCP server, so an agent can drive a board
            without the CLI. It speaks Streamable HTTP at{" "}
            <code className="font-mono text-fg">
              https://www.kanbanthing.com/mcp
            </code>
            , needs no account and no API key, and works with any MCP client.
            Every tool takes a board id or board URL: there is deliberately no
            way to list or search boards, so paste the board link into the chat
            and keep the password to hand.
          </p>

          <Subsection title="Claude Code">
            <Code>{`claude mcp add --transport http kanbanthing https://www.kanbanthing.com/mcp`}</Code>
            <p className="mt-3 text-md text-muted">
              Add <code className="font-mono text-fg">--scope user</code> to make
              it available in every project instead of only this one.
            </p>
          </Subsection>

          <Subsection title="Claude web and desktop">
            <p className="text-md text-muted">
              Open{" "}
              <a
                href="https://claude.ai/customize/connectors"
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring rounded text-accent underline underline-offset-4"
              >
                Customize &rarr; Connectors
              </a>
              , click <strong className="font-medium text-fg">+</strong>, choose{" "}
              <strong className="font-medium text-fg">
                Add custom connector
              </strong>
              , and paste the URL below. Custom connectors work on Free, Pro,
              Max, Team and Enterprise; on Team and Enterprise an owner adds them
              from Admin settings &rarr; Connectors.
            </p>
            <Code>https://www.kanbanthing.com/mcp</Code>
            <p className="mt-3 text-md text-muted">
              Or open{" "}
              <a
                href="https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=KanbanThing&connectorUrl=https%3A%2F%2Fwww.kanbanthing.com%2Fmcp"
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring rounded text-accent underline underline-offset-4"
              >
                this install link
              </a>
              , which fills the form in for you. You still confirm the connector
              yourself.
            </p>
          </Subsection>

          <Subsection title="ChatGPT">
            <p className="text-md text-muted">
              MCP servers are added in developer mode, on the web only. Turn it
              on under Settings &rarr; Apps &rarr; Advanced settings, then go to
              Apps &rarr; Create and give it the endpoint below. Full read and
              write MCP support is a beta limited to Business, Enterprise and Edu
              plans; Pro can connect a server with read-only permissions.
            </p>
            <Code>https://www.kanbanthing.com/mcp</Code>
          </Subsection>

          <Subsection title="Cursor">
            <p className="text-md text-muted">
              Put this in <code className="font-mono text-fg">.cursor/mcp.json</code>{" "}
              for one project, or{" "}
              <code className="font-mono text-fg">~/.cursor/mcp.json</code> for
              all of them.
            </p>
            <Code>{`{
  "mcpServers": {
    "kanbanthing": {
      "url": "https://www.kanbanthing.com/mcp"
    }
  }
}`}</Code>
          </Subsection>

          <Subsection title="VS Code">
            <p className="text-md text-muted">
              Put this in <code className="font-mono text-fg">.vscode/mcp.json</code>,
              or run <strong className="font-medium text-fg">MCP: Add Server</strong>{" "}
              from the command palette.
            </p>
            <Code>{`{
  "servers": {
    "kanbanthing": {
      "type": "http",
      "url": "https://www.kanbanthing.com/mcp"
    }
  }
}`}</Code>
          </Subsection>

          <Subsection title="Tools">
            <CliTable heading="Tool" rows={MCP_TOOLS} />
          </Subsection>
        </Section>

        <Section title="Commands">
          <CliTable heading="Command" rows={COMMANDS} filterLabel="Filter commands" />
          <p className="mt-3 text-xs text-subtle">
            Every command runs against the board set by{" "}
            <code className="font-mono">use</code>, or the one named by{" "}
            <code className="font-mono">--board</code>.
          </p>
        </Section>

        <Section title="Global flags">
          <CliTable heading="Flag" rows={FLAGS} />
        </Section>

        <Section title="Scripting the CLI">
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
          <CliTable heading="Code" rows={EXIT_CODES} />
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

function Subsection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-fg">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  )
}

function Code({ children }: { children: string }) {
  return (
    <div className="relative mt-4">
      <pre className="overflow-x-auto rounded-panel border border-subtle bg-surface p-4 pr-12 font-mono text-sm text-fg scrollbar-thin">
        {children}
      </pre>
      <CopyButton value={children} className="absolute right-2 top-2" />
    </div>
  )
}
