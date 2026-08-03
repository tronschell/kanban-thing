"use client"

import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import {
  ArrowRight,
  CalendarRange,
  Columns3,
  Link2,
  Lock,
  MousePointerClick,
  Palette,
} from "lucide-react"
import { siBluesky, siX } from "simple-icons"
import { Button } from "@/components/ui/button"
import { BrandCycle } from "@/components/brand-cycle"
import { CliBanner } from "@/components/cli-banner"
import { DemoBoard } from "@/components/demo-board"
import { readLibrary } from "@/lib/board-library"
import {
  applyTheme,
  DEFAULT_PRESET_ID,
  FONT_STACKS,
  loadTheme,
  PRESETS,
  saveTheme,
} from "@/lib/themes"
import { FAQS } from "./faqs"

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]

export default function HomeContent() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <SiteHeader />
      <CliBanner />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Appearances />
        <Features />
        <Lifespan />
        <Faq />
        <ClosingCta />
      </main>
      <SiteFooter />
    </div>
  )
}

function Reveal({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-64px" }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  )
}

function SiteHeader() {
  const [savedBoards, setSavedBoards] = useState(0)

  useEffect(() => setSavedBoards(readLibrary().entries.length), [])

  return (
    <header className="border-b border-subtle">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="focus-ring rounded text-sm font-semibold text-fg"
        >
          KanbanThing
        </Link>
        <nav aria-label="Main" className="flex items-center gap-4">
          {savedBoards > 0 && (
            <Link
              href="/boards"
              className="focus-ring whitespace-nowrap rounded text-sm text-muted transition-colors duration-fast hover:text-fg"
            >
              My boards{" "}
              <span className="font-mono tabular-nums text-subtle">({savedBoards})</span>
            </Link>
          )}
          <Link
            href="/guides"
            className="focus-ring hidden rounded text-sm text-muted transition-colors duration-fast hover:text-fg sm:inline"
          >
            Guides
          </Link>
          <Link
            href="/agents"
            className="focus-ring hidden rounded text-sm text-muted transition-colors duration-fast hover:text-fg sm:inline"
          >
            AI agents
          </Link>
          <Link
            href="/about"
            className="focus-ring hidden rounded text-sm text-muted transition-colors duration-fast hover:text-fg sm:inline"
          >
            About
          </Link>
          <Button asChild size="sm">
            <Link href="/onboarding">Create board</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}

function MarkedWord({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion()

  const cycle = (scaleX: number[], times: number[]) =>
    reduceMotion
      ? {}
      : {
          initial: { scaleX: 0 },
          animate: { scaleX },
          transition: {
            duration: 9,
            times,
            repeat: Infinity,
            ease: EASE_OUT,
          },
        }

  return (
    <span className="relative inline-block whitespace-nowrap">
      <motion.span
        aria-hidden
        className="absolute inset-x-[-0.12em] bottom-[0.02em] top-[0.12em] origin-left rounded-[0.08em] bg-support opacity-30"
        {...cycle([0, 0, 1, 1, 0], [0, 0.33, 0.38, 0.95, 1])}
      />
      <motion.span
        aria-hidden
        className="absolute inset-x-[-0.12em] bottom-0 h-[0.07em] origin-left rounded-full bg-support"
        {...cycle(
          [0, 1, 1, 0, 0, 1, 1, 0],
          [0, 0.05, 0.28, 0.33, 0.66, 0.71, 0.95, 1]
        )}
      />
      <span className="relative">{children}</span>
    </span>
  )
}

function Hero() {
  return (
    <section className="pb-16 pt-14 md:pt-20">
      <div className="mx-auto w-full max-w-4xl px-6">
        <h1 className="text-4xl font-semibold text-fg md:text-5xl">
          A <MarkedWord>free</MarkedWord> online kanban board, without the
          sign-up
        </h1>
        <p className="mt-5 max-w-[58ch] text-md text-muted">
          Name a board, set a password, get a link. Send the link to anyone and
          they open the same board and drag the same cards. No login, no
          registration, no email, no install.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild variant="primary" size="lg">
            <Link href="/onboarding">Create a board</Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/about">What it does</Link>
          </Button>
        </div>

        <Link
          href="/agents"
          className="focus-ring group mt-6 inline-flex items-start gap-2 rounded text-sm text-subtle transition-colors duration-fast hover:text-fg"
        >
          <BrandCycle className="size-4 shrink-0 translate-y-0.5" />
          <span>
            Works with Claude Code, Cursor, ChatGPT and any MCP client
            <ArrowRight
              aria-hidden
              className="ml-1.5 inline size-3.5 align-[-0.15em] transition-transform duration-fast group-hover:translate-x-0.5"
            />
          </span>
        </Link>
      </div>

      <div className="mt-12 md:mt-16">
        <DemoBoard />
      </div>

      <UsageCounts />
    </section>
  )
}

type Stats = {
  boardsCreated: number
  cardsCreated: number
  cardsMoved: number
}

function UsageCounts() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch("/api/stats")
      .then((response) => response.json())
      .then((data) => {
        if (typeof data.boardsCreated === "number") setStats(data)
      })
      .catch(() => {})
  }, [])

  if (!stats) return null

  return (
    <p className="mx-auto mt-8 w-full max-w-4xl px-6 text-xs text-subtle">
      <Count value={stats.boardsCreated} /> boards created,{" "}
      <Count value={stats.cardsCreated} /> cards written,{" "}
      <Count value={stats.cardsMoved} /> cards moved so far.
    </p>
  )
}

function Count({ value }: { value: number }) {
  return (
    <span className="font-mono tabular-nums text-muted">
      {value.toLocaleString()}
    </span>
  )
}

function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works" className="border-t border-subtle">
      <div className="mx-auto grid w-full max-w-4xl gap-8 px-6 py-16 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-12">
        <Reveal>
          <h2
            id="how-it-works"
            className="text-2xl font-semibold text-fg md:text-3xl"
          >
            How to make a shared kanban board, in three steps
          </h2>
          <p className="mt-3 text-sm text-muted">
            About ten seconds from an empty tab to a board your team can open.
          </p>
        </Reveal>
        <Reveal>
          <ol className="divide-y divide-subtle border-y border-subtle">
            <Step number={1} title="Name the board">
              A board name and a password is the whole setup. Nothing is asked
              of you that you would have to remember later.
            </Step>
            <Step number={2} title="Send the link">
              Every board lives at its own address. Copy it out of the board
              header and paste it wherever your team already talks.
            </Step>
            <Step number={3} title="Move cards">
              To Do, In Progress and Done are there from the start. Rename them,
              add columns, drag cards across, and keep going.
            </Step>
          </ol>
        </Reveal>
      </div>
    </section>
  )
}

function Step({
  number,
  title,
  children,
}: {
  number: number
  title: string
  children: ReactNode
}) {
  return (
    <li className="flex gap-4 py-5">
      <span className="mt-0.5 font-mono text-2xs tabular-nums text-subtle">
        {number}
      </span>
      <div>
        <h3 className="text-md font-medium text-fg">{title}</h3>
        <p className="mt-1 max-w-[62ch] text-sm text-muted">{children}</p>
      </div>
    </li>
  )
}

function Appearances() {
  const [presetId, setPresetId] = useState(DEFAULT_PRESET_ID)

  useEffect(() => setPresetId(loadTheme().presetId), [])

  const choose = (id: string) => {
    const state = { presetId: id, overrides: {} }
    saveTheme(state, applyTheme(state))
    setPresetId(id)
  }

  return (
    <section aria-labelledby="appearances" className="border-t border-subtle">
      <div className="mx-auto w-full max-w-4xl px-6 py-16">
        <Reveal>
          <h2
            id="appearances"
            className="text-2xl font-semibold text-fg md:text-3xl"
          >
            Six interfaces for the same kanban board
          </h2>
          <p className="mt-4 max-w-[62ch] text-md text-muted">
            Pick one and this page changes with it, board above included. Each
            one changes the type, the colour, the corner radius and the shape of
            the cards and columns. Tune the colours and fonts afterwards from
            Appearance in the board menu. The choice is kept in your browser and
            carries over to every board you open.
          </p>
          <ul className="mt-10 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {PRESETS.map((preset) => (
              <li key={preset.id}>
                <button
                  type="button"
                  onClick={() => choose(preset.id)}
                  aria-pressed={preset.id === presetId}
                  className={`focus-ring w-full rounded-panel text-left ${
                    preset.id === presetId
                      ? "ring-2 ring-accent ring-offset-4 ring-offset-canvas"
                      : ""
                  }`}
                >
                  <span
                    className="flex h-24 flex-col justify-between border border-subtle p-3"
                    style={{
                      backgroundColor: preset.base.canvas,
                      borderRadius: `${preset.base.radius + 2}px`,
                    }}
                  >
                    <span
                      className="text-md"
                      style={{
                        color: preset.base.fg,
                        fontFamily: FONT_STACKS[preset.base.fontSans].stack,
                        fontWeight: preset.base.weightHeading,
                      }}
                    >
                      {preset.name}
                    </span>
                    <span aria-hidden className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-14"
                        style={{
                          backgroundColor: preset.base.accent,
                          borderRadius: `${preset.base.radius}px`,
                        }}
                      />
                      <span
                        className="h-2 w-7"
                        style={{
                          backgroundColor: preset.base.support,
                          borderRadius: `${preset.base.radius}px`,
                        }}
                      />
                    </span>
                  </span>
                  <span className="mt-3 block text-sm text-muted">
                    {preset.tagline}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section aria-labelledby="features" className="border-t border-subtle">
      <div className="mx-auto w-full max-w-4xl px-6 py-16">
        <Reveal>
          <h2
            id="features"
            className="text-2xl font-semibold text-fg md:text-3xl"
          >
            What a kanban board needs, and nothing else
          </h2>
          <p className="mt-4 max-w-[62ch] text-md text-muted">
            KanbanThing is a utility, not a platform. It does the handful of
            things a board has to do and stays out of the way for the rest.
          </p>
          <dl className="mt-10 grid gap-8 sm:grid-cols-2">
            <Feature icon={<Link2 />} title="Share by link">
              The board lives at its own address rather than in your browser, so
              anyone holding the link and the password works on the same board,
              or a{" "}
              <Link
                href="/guides/read-only-board-links"
                className="focus-ring rounded underline underline-offset-4 hover:text-fg"
              >
                read-only link
              </Link>{" "}
              shares it without the password. There is nobody to invite and no
              seat to pay for.
            </Feature>
            <Feature icon={<MousePointerClick />} title="Drag and drop">
              Move cards between columns by dragging, or move them from the card
              menu when a pointer is not an option.
            </Feature>
            <Feature icon={<Columns3 />} title="Columns and a backlog">
              Add, rename and{" "}
              <Link
                href="/guides/kanban-columns"
                className="focus-ring rounded underline underline-offset-4 hover:text-fg"
              >
                reorder columns
              </Link>
              . Park everything that is not scheduled yet in the backlog, the
              first panel on the board.
            </Feature>
            <Feature icon={<CalendarRange />} title="Calendar and timeline">
              The same cards on a calendar by due date, or on a timeline by
              most recent activity, when you need to see what lands when.
            </Feature>
            <Feature icon={<Lock />} title="Password on every board">
              Boards are not listed or searchable, and the password is set at
              creation, so a leaked link alone is not enough.
            </Feature>
            <Feature icon={<Palette />} title="Six interfaces">
              Switch the whole board between six looks, then change the
              colours, fonts, weights and corner radius to taste.
            </Feature>
          </dl>
        </Reveal>
      </div>
    </section>
  )
}

function Feature({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  return (
    <div className="flex gap-3">
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-control border border-subtle bg-surface text-muted [&_svg]:size-4"
      >
        {icon}
      </span>
      <div>
        <dt className="text-md font-medium text-fg">{title}</dt>
        <dd className="mt-1 text-sm text-muted">{children}</dd>
      </div>
    </div>
  )
}

function Lifespan() {
  return (
    <section aria-labelledby="lifespan" className="border-t border-subtle">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-6 py-16 sm:flex-row sm:items-baseline sm:gap-10">
        <p
          aria-hidden
          className="font-mono text-5xl leading-none tabular-nums text-fg"
        >
          60
        </p>
        <div>
          <h2
            id="lifespan"
            className="text-2xl font-semibold text-fg md:text-3xl"
          >
            How long a board lasts: up to 60 days
          </h2>
          <p className="mt-4 max-w-[62ch] text-md text-muted">
            Every board is removed up to 60 days after it is created. That is
            the longest a board can live and there is no way to push it back, so
            export anything you still need as JSON or CSV from the board menu,
            or start a fresh board and carry the cards over.
          </p>
        </div>
      </div>
    </section>
  )
}

function Faq() {
  return (
    <section aria-labelledby="faq" className="border-t border-subtle">
      <div className="mx-auto w-full max-w-4xl px-6 py-16">
        <Reveal>
          <h2 id="faq" className="text-2xl font-semibold text-fg md:text-3xl">
            Common questions
          </h2>
          <dl className="mt-10 divide-y divide-subtle border-y border-subtle">
            {FAQS.map(({ question, answer }) => (
              <div key={question} className="py-5">
                <dt className="text-md font-medium text-fg">{question}</dt>
                <dd className="mt-2 max-w-[70ch] text-sm text-muted">
                  {answer}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  )
}

function ClosingCta() {
  return (
    <section aria-labelledby="get-started" className="border-t border-subtle">
      <div className="mx-auto w-full max-w-4xl px-6 py-16">
        <Reveal className="rounded-panel border border-subtle bg-surface px-6 py-10 md:px-10">
          <h2
            id="get-started"
            className="text-2xl font-semibold text-fg md:text-3xl"
          >
            Free, and it stays free
          </h2>
          <p className="mt-4 max-w-[62ch] text-md text-muted">
            There is no paid tier to upgrade to and nothing to sign. Open a
            board, send the link, and copy out anything you want to keep before
            the 60 days are up.
          </p>
          <Button asChild variant="primary" size="lg" className="mt-8">
            <Link href="/onboarding">Create a board</Link>
          </Button>
        </Reveal>
      </div>
    </section>
  )
}

function SiteFooter() {
  return (
    <footer className="border-t border-subtle">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-subtle">
          Built by{" "}
          <a
            href="https://www.linkedin.com/in/tron-schell-aa0856181/"
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring rounded text-muted underline underline-offset-4 transition-colors duration-fast hover:text-fg"
          >
            Tron Schell
          </a>
        </p>
        <nav aria-label="Footer" className="flex items-center gap-5">
          <FooterLink href="/guides">Guides</FooterLink>
          <FooterLink href="/about">About</FooterLink>
          <FooterLink href="/cli">CLI</FooterLink>
          <FooterLink href="/agents">AI agents</FooterLink>
          <FooterLink href="/terms">Terms</FooterLink>
          <FooterLink href="/privacy">Privacy</FooterLink>
          <SocialLink
            href="https://bsky.app/profile/kanbanthing.bsky.social"
            label="KanbanThing on Bluesky"
            path={siBluesky.path}
          />
          <SocialLink
            href="https://twitter.com/kanbanthing"
            label="KanbanThing on X"
            path={siX.path}
          />
        </nav>
      </div>
    </footer>
  )
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="focus-ring rounded text-xs text-muted transition-colors duration-fast hover:text-fg"
    >
      {children}
    </Link>
  )
}

function SocialLink({
  href,
  label,
  path,
}: {
  href: string
  label: string
  path: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="focus-ring rounded text-muted transition-colors duration-fast hover:text-fg"
    >
      <svg aria-hidden viewBox="0 0 24 24" className="size-4 fill-current">
        <path d={path} />
      </svg>
    </a>
  )
}
