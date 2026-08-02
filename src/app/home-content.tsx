"use client"

import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import {
  CalendarRange,
  Columns3,
  Link2,
  Lock,
  MousePointerClick,
  Palette,
} from "lucide-react"
import { siBluesky, siX } from "simple-icons"
import { Button } from "@/components/ui/button"
import { DemoBoard } from "@/components/demo-board"
import { readLibrary } from "@/lib/board-library"
import { FONT_STACKS, PRESETS } from "@/lib/themes"

const structuredData = {
  "@context": "https://schema.org",
  "@type": ["SoftwareApplication", "WebApplication"],
  name: "KanbanThing",
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description:
    "A free, no-signup Kanban board application/tool built to make you extraordinarily productive. The easiest way to organize your work.",
  featureList: [
    "No sign-up required",
    "Always free",
    "Boards last up to 60 days",
    "Shareable board links",
    "Drag and drop interface",
    "Six interface themes",
  ],
  author: {
    "@type": "Person",
    name: "Tron Schell",
    sameAs: "https://www.linkedin.com/in/tron-schell-aa0856181/",
  },
  sameAs: [
    "https://bsky.app/profile/kanbanthing.bsky.social",
    "https://twitter.com/kanbanthing",
  ],
}

export default function HomeContent() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Appearances />
        <Features />
        <Lifespan />
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
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
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

function Hero() {
  return (
    <section className="pb-16 pt-14 md:pt-20">
      <div className="mx-auto w-full max-w-4xl px-6">
        <h1 className="text-4xl font-semibold text-fg md:text-5xl">
          A shared kanban board, without the sign-up
        </h1>
        <p className="mt-5 max-w-[58ch] text-md text-muted">
          Name a board, set a password, get a link. Send the link to anyone and
          they open the same board and drag the same cards. No account, no
          email, no install, no trial.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild variant="primary" size="lg">
            <Link href="/onboarding">Create a board</Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/about">What it does</Link>
          </Button>
        </div>
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
            Three steps, one link
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
  return (
    <section aria-labelledby="appearances" className="border-t border-subtle">
      <div className="mx-auto w-full max-w-4xl px-6 py-16">
        <Reveal>
          <h2
            id="appearances"
            className="text-2xl font-semibold text-fg md:text-3xl"
          >
            Six interfaces for the same board
          </h2>
          <p className="mt-4 max-w-[62ch] text-md text-muted">
            The board above is drawn by whichever of these you pick, from
            Appearance in the board menu. Each one changes the type, the colour,
            the corner radius and the shape of the cards and columns. Tune the
            colours and fonts afterwards if you want to. The choice is kept in
            your browser.
          </p>
          <ul className="mt-10 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {PRESETS.map((preset) => (
              <li key={preset.id}>
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
                <p className="mt-3 text-sm text-muted">{preset.tagline}</p>
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
            Enough board to be useful, and no more
          </h2>
          <p className="mt-4 max-w-[62ch] text-md text-muted">
            KanbanThing is a utility, not a platform. It does the handful of
            things a board has to do and stays out of the way for the rest.
          </p>
          <dl className="mt-10 grid gap-8 sm:grid-cols-2">
            <Feature icon={<Link2 />} title="Share by link">
              Anyone holding the link and the password works on the same board.
              There is nobody to invite and no seat to pay for.
            </Feature>
            <Feature icon={<MousePointerClick />} title="Drag and drop">
              Move cards between columns by dragging, or move them from the card
              menu when a pointer is not an option.
            </Feature>
            <Feature icon={<Columns3 />} title="Columns and a backlog">
              Add, rename and reorder columns. Park everything that is not
              scheduled yet in the backlog, the first panel on the board.
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
            Sixty days, then the board is deleted
          </h2>
          <p className="mt-4 max-w-[62ch] text-md text-muted">
            Every board is removed 60 days after it is created. That is the
            longest a board can live and there is no way to push it back, so
            export anything you still need as JSON or CSV from the board menu,
            or start a fresh board and carry the cards over.
          </p>
        </div>
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
          <FooterLink href="/about">About</FooterLink>
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
