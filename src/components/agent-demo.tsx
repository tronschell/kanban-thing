"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { LABEL_COLORS } from "@/lib/colors"
import { cn } from "@/lib/utils"

const COLUMNS = ["To Do", "In Progress", "Done"]

interface Step {
  tool: string
  detail: string
  create?: { id: string; title: string; color: string }
  move?: { id: string; to: string }
}

const STEPS: Step[] = [
  { tool: "create_board", detail: 'name: "Website relaunch"' },
  {
    tool: "create_card",
    detail: 'title: "Cut onboarding to three fields"',
    create: { id: "onboarding", title: "Cut onboarding to three fields", color: LABEL_COLORS[3] },
  },
  {
    tool: "create_card",
    detail: 'title: "Rewrite the pricing FAQ"',
    create: { id: "pricing", title: "Rewrite the pricing FAQ", color: LABEL_COLORS[5] },
  },
  {
    tool: "create_card",
    detail: 'title: "Ship the mobile nav fix"',
    create: { id: "nav", title: "Ship the mobile nav fix", color: LABEL_COLORS[0] },
  },
  {
    tool: "move_card",
    detail: 'card: "Cut onboarding…" → In Progress',
    move: { id: "onboarding", to: "In Progress" },
  },
  {
    tool: "move_card",
    detail: 'card: "Ship the mobile…" → In Progress',
    move: { id: "nav", to: "In Progress" },
  },
  {
    tool: "move_card",
    detail: 'card: "Cut onboarding…" → Done',
    move: { id: "onboarding", to: "Done" },
  },
]

const STEP_MS = 1400
const REPLAY_MS = 3000

interface BoardCard {
  id: string
  title: string
  color: string
  column: string
}

const boardAfter = (taken: number) =>
  STEPS.slice(0, taken).reduce<BoardCard[]>((cards, step) => {
    if (step.create) return [...cards, { ...step.create, column: COLUMNS[0] }]
    if (step.move) {
      const { id, to } = step.move
      return cards.map((card) => (card.id === id ? { ...card, column: to } : card))
    }
    return cards
  }, [])

export function AgentDemo() {
  const reduceMotion = useReducedMotion()
  const [taken, setTaken] = useState(0)

  useEffect(() => {
    if (reduceMotion) return
    const finished = taken >= STEPS.length
    const timer = setTimeout(
      () => setTaken(finished ? 0 : taken + 1),
      finished ? REPLAY_MS : STEP_MS
    )
    return () => clearTimeout(timer)
  }, [taken, reduceMotion])

  const done = reduceMotion ? STEPS.length : taken
  const cards = boardAfter(done)

  return (
    <figure
      role="img"
      aria-label="An AI agent calling create_board, then create_card three times, then move_card, while the same cards appear and move across a kanban board."
      className="mt-10 overflow-hidden rounded-panel border border-subtle bg-surface"
    >
      <div className="flex items-center gap-2 border-b border-subtle bg-surface-raised px-3 py-2.5">
        <span aria-hidden className="flex items-center gap-1.5">
          {[LABEL_COLORS[0], LABEL_COLORS[2], LABEL_COLORS[3]].map((color) => (
            <span
              key={color}
              className="size-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
          ))}
        </span>
        <span className="ml-1 truncate font-mono text-2xs text-subtle">
          kanbanthing · mcp
        </span>
      </div>

      <div aria-hidden className="grid md:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]">
        <Transcript done={done} />
        <Board name={done > 0 ? "Website relaunch" : null} cards={cards} animate={!reduceMotion} />
      </div>
    </figure>
  )
}

function Transcript({ done }: { done: number }) {
  return (
    <ol className="min-h-[13rem] border-b border-subtle p-4 font-mono text-2xs md:min-h-[21rem] md:border-b-0 md:border-r">
      <AnimatePresence initial={false}>
        {STEPS.slice(0, done).map((step, index) => (
          <motion.li
            key={step.tool + index}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2.5 last:mb-0"
          >
            <p className="text-fg">
              <span className="text-accent">▸</span> {step.tool}
            </p>
            <p className="truncate pl-3 text-subtle">{step.detail}</p>
          </motion.li>
        ))}
      </AnimatePresence>
      {done < STEPS.length && (
        <li className="text-accent motion-safe:animate-pulse">▸</li>
      )}
    </ol>
  )
}

function Board({
  name,
  cards,
  animate,
}: {
  name: string | null
  cards: BoardCard[]
  animate: boolean
}) {
  return (
    <div className="p-4">
      <p
        className={cn(
          "mb-3 truncate text-xs transition-colors duration-slow",
          name ? "text-muted" : "text-subtle"
        )}
      >
        {name ?? "No board yet"}
      </p>

      <div className="grid grid-cols-3 gap-2">
        {COLUMNS.map((column) => (
          <div
            key={column}
            className="flex min-h-[9rem] flex-col rounded-panel border border-subtle bg-surface p-2 md:min-h-[16rem]"
          >
            <p className="mb-2 truncate text-2xs font-medium uppercase tracking-wide text-subtle">
              {column}
            </p>
            <ul className="flex flex-col gap-2">
              {cards
                .filter((card) => card.column === column)
                .map((card) => (
                  <motion.li
                    key={card.id}
                    layout={animate}
                    layoutId={animate ? card.id : undefined}
                    initial={animate ? { opacity: 0, scale: 0.94 } : false}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
                    className="relative rounded-card border border-subtle bg-surface-raised px-2 py-1.5"
                  >
                    <span
                      className="absolute inset-y-1 left-0 w-[3px] rounded-full"
                      style={{ backgroundColor: card.color }}
                    />
                    <p className="line-clamp-2 pl-1.5 text-2xs text-fg">{card.title}</p>
                  </motion.li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
