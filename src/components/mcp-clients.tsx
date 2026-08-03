"use client"

import { useState, type ReactNode } from "react"
import {
  BrandGlyph,
  CLAUDE,
  CURSOR,
  OPENAI,
  VS_CODE,
  type BrandIcon,
} from "@/components/brand-icons"
import { CodeBlock } from "@/components/code-block"
import { cn } from "@/lib/utils"

const MCP_URL = "https://www.kanbanthing.com/mcp"

const CLIENTS: {
  id: string
  label: string
  icon: BrandIcon
  panel: ReactNode
}[] = [
  {
    id: "claude-code",
    label: "Claude Code",
    icon: CLAUDE,
    panel: (
      <>
        <CodeBlock>{`claude mcp add --transport http kanbanthing ${MCP_URL}`}</CodeBlock>
        <p className="mt-3 text-md text-muted">
          Add <code className="font-mono text-fg">--scope user</code> to make it
          available in every project instead of only this one.
        </p>
      </>
    ),
  },
  {
    id: "claude",
    label: "Claude web & desktop",
    icon: CLAUDE,
    panel: (
      <>
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
          <strong className="font-medium text-fg">Add custom connector</strong>,
          and paste the URL below. Custom connectors work on Free, Pro, Max, Team
          and Enterprise; on Team and Enterprise an owner adds them from Admin
          settings &rarr; Connectors.
        </p>
        <CodeBlock>{MCP_URL}</CodeBlock>
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
      </>
    ),
  },
  {
    id: "chatgpt",
    label: "ChatGPT",
    icon: OPENAI,
    panel: (
      <>
        <p className="text-md text-muted">
          MCP servers are added in developer mode, on the web only. Turn it on
          under Settings &rarr; Apps &rarr; Advanced settings, then go to Apps
          &rarr; Create and give it the endpoint below. Full read and write MCP
          support is a beta limited to Business, Enterprise and Edu plans; Pro
          can connect a server with read-only permissions.
        </p>
        <CodeBlock>{MCP_URL}</CodeBlock>
      </>
    ),
  },
  {
    id: "cursor",
    label: "Cursor",
    icon: CURSOR,
    panel: (
      <>
        <p className="text-md text-muted">
          Put this in{" "}
          <code className="font-mono text-fg">.cursor/mcp.json</code> for one
          project, or <code className="font-mono text-fg">~/.cursor/mcp.json</code>{" "}
          for all of them.
        </p>
        <CodeBlock>{`{
  "mcpServers": {
    "kanbanthing": {
      "url": "${MCP_URL}"
    }
  }
}`}</CodeBlock>
      </>
    ),
  },
  {
    id: "vs-code",
    label: "VS Code",
    icon: VS_CODE,
    panel: (
      <>
        <p className="text-md text-muted">
          Put this in <code className="font-mono text-fg">.vscode/mcp.json</code>,
          or run{" "}
          <strong className="font-medium text-fg">MCP: Add Server</strong> from
          the command palette.
        </p>
        <CodeBlock>{`{
  "servers": {
    "kanbanthing": {
      "type": "http",
      "url": "${MCP_URL}"
    }
  }
}`}</CodeBlock>
      </>
    ),
  },
]

export function McpClients() {
  const [current, setCurrent] = useState(CLIENTS[0].id)
  const active = CLIENTS.find((client) => client.id === current) ?? CLIENTS[0]

  return (
    <div className="mt-6">
      <div
        role="tablist"
        aria-label="MCP clients"
        className="flex flex-wrap gap-1 rounded-panel border border-subtle bg-surface p-1"
      >
        {CLIENTS.map((client) => (
          <button
            key={client.id}
            type="button"
            role="tab"
            id={`mcp-tab-${client.id}`}
            aria-selected={client.id === current}
            aria-controls="mcp-panel"
            onClick={() => setCurrent(client.id)}
            className={cn(
              "focus-ring flex items-center gap-2 rounded-control px-3 py-2 text-sm transition-colors duration-fast",
              client.id === current
                ? "bg-surface-active text-fg"
                : "text-muted hover:text-fg"
            )}
          >
            <BrandGlyph icon={client.icon} className="size-4 shrink-0" />
            {client.label}
          </button>
        ))}
      </div>

      <div
        id="mcp-panel"
        role="tabpanel"
        aria-labelledby={`mcp-tab-${active.id}`}
        className="mt-5"
      >
        {active.panel}
      </div>
    </div>
  )
}
