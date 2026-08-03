import type { ReactNode } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { baseUrl, generateMetadata } from "@/lib/metadata"
import { Button } from "@/components/ui/button"
import { AgentDemo } from "@/components/agent-demo"
import { BrandCycle } from "@/components/brand-cycle"
import { BrandName, CLAUDE, CURSOR, OPENAI } from "@/components/brand-icons"
import { CliTable } from "@/components/cli-table"
import { CodeBlock } from "@/components/code-block"
import { McpClients } from "@/components/mcp-clients"
import { PageNav } from "@/components/page-nav"

export const metadata: Metadata = generateMetadata({
  title: "Kanban Board for AI Agents: Free MCP Server",
  description:
    "Give Claude, ChatGPT, Cursor or any MCP client a kanban board it can actually use. Free hosted MCP server, no account and no API key, plus an agent skill.",
  path: "/agents",
})

const FAQS = [
  {
    question: "Can an AI agent use a kanban board without an account?",
    answer:
      "With KanbanThing, yes. The MCP server at https://www.kanbanthing.com/mcp needs no account, no OAuth and no API key: an agent creates a board and gets back its id, share URL and password in a single call. Most task boards cannot be used this way, because they require a human to register, authorise an app and issue a token before anything can be written.",
  },
  {
    question: "What is the KanbanThing MCP server?",
    answer:
      "A hosted Model Context Protocol server that exposes eight tools for driving a board: create_board, get_board, list_columns, list_cards, create_card, move_card, update_card and delete_card. It speaks Streamable HTTP at https://www.kanbanthing.com/mcp and works with any MCP client, including Claude Code, Claude web and desktop, ChatGPT, Cursor and VS Code.",
  },
  {
    question: "How do I install the KanbanThing agent skill?",
    answer:
      "Download https://www.kanbanthing.com/skill.md into your harness's skill directory. For Claude Code that is ~/.claude/skills/kanbanthing/SKILL.md for every project, or .claude/skills/kanbanthing/SKILL.md for one. It is a plain markdown file with YAML frontmatter, so it also works as a Cursor rule or as a section of an AGENTS.md.",
  },
  {
    question: "Do I need the skill if I have already added the MCP server?",
    answer:
      "No, the tools work on their own. The skill adds judgement the tool descriptions cannot: when to reach for a board at all, that board ids must come from you rather than be guessed, to surface a generated password immediately because it cannot be read back, and to move cards to Done rather than deleting them.",
  },
  {
    question: "Is the board my agent creates the same board I see in a browser?",
    answer:
      "Yes. There is one board behind both. The agent gets a share URL back when it creates the board; open that URL, enter the password, and you are looking at the same cards the agent is moving. Reload to pick up changes, as the board does not push other people's edits onto your screen.",
  },
  {
    question: "Can an agent see boards I did not tell it about?",
    answer:
      "No. There is deliberately no tool to list or search boards, and every tool requires a board id the user supplied along with that board's password. An agent that has not been given a board link cannot reach any board.",
  },
]

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": `${baseUrl}/agents#mcp`,
      name: "KanbanThing MCP server",
      url: `${baseUrl}/agents`,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any",
      publisher: { "@id": `${baseUrl}/#organization` },
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description:
        "A hosted Model Context Protocol server that lets an AI agent create and run a kanban board with no account, no OAuth and no API key.",
      featureList: [
        "create_board",
        "get_board",
        "list_columns",
        "list_cards",
        "create_card",
        "move_card",
        "update_card",
        "delete_card",
      ],
    },
    {
      "@type": "HowTo",
      "@id": `${baseUrl}/agents#howto`,
      name: "How to give an AI agent a kanban board",
      description:
        "Connect the KanbanThing MCP server to an AI agent and install the agent skill, so the agent can create and run a shared kanban board.",
      totalTime: "PT2M",
      step: [
        {
          "@type": "HowToStep",
          name: "Add the MCP server",
          text: "Point your MCP client at https://www.kanbanthing.com/mcp over Streamable HTTP. In Claude Code that is: claude mcp add --transport http kanbanthing https://www.kanbanthing.com/mcp",
          url: `${baseUrl}/agents#connect-the-mcp-server`,
        },
        {
          "@type": "HowToStep",
          name: "Install the skill",
          text: "Save https://www.kanbanthing.com/skill.md as SKILL.md in your harness's skill directory, for example ~/.claude/skills/kanbanthing/SKILL.md",
          url: `${baseUrl}/agents#install-the-skill`,
        },
        {
          "@type": "HowToStep",
          name: "Ask for a board",
          text: "Ask the agent to make a kanban board for the work. It returns a share URL and a password you open in a browser.",
          url: `${baseUrl}/agents#ask-your-agent-for-a-board`,
        },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${baseUrl}/agents#faq`,
      mainEntity: FAQS.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
        {
          "@type": "ListItem",
          position: 2,
          name: "For AI agents",
          item: `${baseUrl}/agents`,
        },
      ],
    },
  ],
}

const TOOLS: [string, string][] = [
  [
    "create_board",
    "Create a board and return its id, share URL and password. Takes a name, and optionally a password, columns and lifespan_days.",
  ],
  ["get_board", "The board's name, expiry, columns and the card count in each."],
  ["list_columns", "The columns on a board, left to right, with their ids."],
  [
    "list_cards",
    "The cards on a board, or only those in one column. Returns the ids the write tools need.",
  ],
  [
    "create_card",
    "Add a card. Takes a title, and optionally a column, description, due_date and colour. Lands in Backlog with no column.",
  ],
  ["move_card", "Move a card to another column, at the end of it."],
  [
    "update_card",
    "Change a card's title, description, due date or colour. Pass null to clear a field.",
  ],
  ["delete_card", "Permanently delete a card. This cannot be undone."],
]

const PROMPTS: [string, string][] = [
  [
    "Make me a board",
    "Create a KanbanThing board called Q3 Migration with columns Spec, Building, Review and Done, then give me the link and password.",
  ],
  [
    "Plan onto a board",
    "Read the issues in this repo, then put one card on my KanbanThing board for each thing that has to happen before we can ship.",
  ],
  [
    "Keep it current",
    "Here is my board link and password. Before you start work, move the card you are picking up into In Progress, and move it to Done when the tests pass.",
  ],
  [
    "Catch up",
    "List everything on my board that is still in In Progress and tell me which cards have not moved since last week.",
  ],
]

export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <header className="border-b border-subtle">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
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

      <main className="mx-auto w-full max-w-5xl px-6 py-16">
        <h1 className="text-4xl font-semibold text-fg md:text-5xl">
          A kanban board for <BrandCycle /> AI agents
        </h1>
        <p className="mt-5 max-w-[62ch] text-md text-muted">
          KanbanThing has a hosted MCP server, so{" "}
          <BrandName icon={CLAUDE}>Claude</BrandName>,{" "}
          <BrandName icon={OPENAI}>ChatGPT</BrandName>,{" "}
          <BrandName icon={CURSOR}>Cursor</BrandName> or any other MCP client
          can create a board and move cards on it. No account, no OAuth, no API
          key. Open the share link in a browser and you are looking at the same
          board.
        </p>

        <AgentDemo />

        <div className="mt-12 gap-x-14 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-start">
          <PageNav />

          <div data-page-content>
            <Section title="Why agents cannot use most task boards">
              <p className="text-md text-muted">
                An agent cannot sign up for anything. Trello, Jira, Linear and
                Notion all want an account, an OAuth grant and an access token
                first — three things only a person can do.
              </p>
              <p className="mt-4 text-md text-muted">
                A KanbanThing board has no account behind it. Access is two
                strings, the board&apos;s id and its password, and{" "}
                <code className="font-mono text-fg">create_board</code> hands
                the agent both. Nothing to register, no key to rotate.
              </p>
            </Section>

            <Section title="Connect the MCP server">
              <p className="text-md text-muted">
                The server speaks Streamable HTTP at{" "}
                <code className="font-mono text-fg">
                  https://www.kanbanthing.com/mcp
                </code>
                . Pick your client:
              </p>

              <McpClients />
            </Section>

            <Section title="Install the skill">
              <p className="text-md text-muted">
                The tools work without it. The skill adds the judgement a tool
                schema cannot: never guess a board id, surface a generated
                password immediately because it cannot be read back, move
                finished cards to Done rather than deleting them. One markdown
                file, served at{" "}
                <a
                  href="/skill.md"
                  className="focus-ring rounded text-accent underline underline-offset-4"
                >
                  kanbanthing.com/skill.md
                </a>
                .
              </p>

              <h3 className="mt-10 text-lg font-semibold text-fg">
                Claude Code
              </h3>
              <CodeBlock>{`mkdir -p ~/.claude/skills/kanbanthing
curl -o ~/.claude/skills/kanbanthing/SKILL.md https://www.kanbanthing.com/skill.md`}</CodeBlock>
              <p className="mt-4 text-md text-muted">
                Drop the <code className="font-mono text-fg">~</code> to install
                it into the current project instead, and commit it.
              </p>

              <h3 className="mt-10 text-lg font-semibold text-fg">Cursor</h3>
              <CodeBlock>{`mkdir -p .cursor/rules
curl -o .cursor/rules/kanbanthing.mdc https://www.kanbanthing.com/skill.md`}</CodeBlock>

              <h3 className="mt-10 text-lg font-semibold text-fg">
                Anything else
              </h3>
              <p className="mt-2 text-md text-muted">
                Append it to whatever your harness already reads —{" "}
                <code className="font-mono text-fg">AGENTS.md</code>, a system
                prompt, a custom GPT&apos;s instructions. The frontmatter is
                inert if nothing parses it.
              </p>
              <CodeBlock>{`curl -s https://www.kanbanthing.com/skill.md >> AGENTS.md`}</CodeBlock>
            </Section>

            <Section title="Tools">
              <p className="text-md text-muted">
                Every tool takes a{" "}
                <code className="font-mono text-fg">board_id</code>{" "}
                &mdash; a board UUID or a full board URL &mdash; and the
                board&apos;s{" "}
                <code className="font-mono text-fg">password</code>. Columns can
                be named or given by id, so{" "}
                <code className="font-mono text-fg">&quot;In Progress&quot;</code>{" "}
                works as well as a UUID.
              </p>
              <CliTable heading="Tool" rows={TOOLS} filterLabel="Filter tools" />
              <p className="mt-3 text-xs text-subtle">
                There is deliberately no tool to list or search boards. An agent
                you have not given a board link to cannot reach any board.
              </p>
            </Section>

            <Section title="Ask your agent for a board">
              <p className="text-md text-muted">
                Once the server is connected, this is the whole interface. Paste
                the board link and password in when the board already exists.
              </p>
              <dl className="mt-6 divide-y divide-subtle border-y border-subtle">
                {PROMPTS.map(([label, prompt]) => (
                  <div key={label} className="py-4">
                    <dt className="text-sm font-medium text-fg">{label}</dt>
                    <dd className="mt-1.5 text-md text-muted">
                      &ldquo;{prompt}&rdquo;
                    </dd>
                  </div>
                ))}
              </dl>
            </Section>

            <Section title="Boards, passwords and expiry">
              <ul className="space-y-3 text-md text-muted">
                <li className="border-l border-subtle pl-4">
                  A board an agent creates is identical to one made in the
                  browser, expiry included — 60 days by default and also the
                  maximum, and it cannot be moved afterwards.
                </li>
                <li className="border-l border-subtle pl-4">
                  A generated password is returned exactly once and cannot be
                  read back. Save it when it appears; lose it and the board is
                  gone.
                </li>
                <li className="border-l border-subtle pl-4">
                  Treat a board as public to everyone holding its link. Keys and
                  customer data do not belong on one, and that goes double when
                  an agent is writing the cards.
                </li>
              </ul>
            </Section>

            <Section title="Or use the CLI">
              <p className="text-md text-muted">
                If your agent is happier shelling out than speaking MCP, the{" "}
                <Link
                  href="/cli"
                  className="focus-ring rounded text-accent underline underline-offset-4"
                >
                  kanbanthing CLI
                </Link>{" "}
                does the same job. Every command takes{" "}
                <code className="font-mono text-fg">--json</code>.
              </p>
              <CodeBlock>{`npm i -g kanbanthing
kanban ls --json`}</CodeBlock>
            </Section>

            <Section title="Questions">
              <dl className="divide-y divide-subtle border-y border-subtle">
                {FAQS.map(({ question, answer }) => (
                  <div key={question} className="py-5">
                    <dt className="text-md font-medium text-fg">{question}</dt>
                    <dd className="mt-2 text-md text-muted">{answer}</dd>
                  </div>
                ))}
              </dl>
            </Section>

            <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-subtle pt-8">
              <Button asChild variant="primary">
                <Link href="/onboarding">Create a board</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/">Back to home</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

  return (
    <section className="mb-14 last:mb-0">
      <h2 id={id} className="text-2xl font-semibold text-fg md:text-3xl">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}
