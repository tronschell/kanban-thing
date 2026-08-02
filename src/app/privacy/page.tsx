import type { Metadata } from "next"
import Link from "next/link"
import { baseUrl, generateMetadata } from "@/lib/metadata"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = generateMetadata({
  title: "Privacy Policy",
  description:
    "Our privacy policy explains how we handle your data at KanbanThing, including board data, analytics, and cookie usage.",
  path: "/privacy",
})

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "KanbanThing Privacy Policy",
  url: `${baseUrl}/privacy`,
  publisher: {
    "@type": "Organization",
    name: "KanbanThing",
    url: baseUrl,
  },
}

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>

        <div className="prose mt-8">
          <p>
            KanbanThing has no accounts, so we never ask for your name, email
            address, or any other identifying detail. This page explains what is
            stored anyway, and who else can see it.
          </p>

          <h2>What we store</h2>
          <ul>
            <li>
              The boards you create: the board name, its columns, and the cards
              on it, including any text, colors and due dates you enter.
            </li>
            <li>
              The board password, stored as a hash so it cannot be read back.
            </li>
            <li>
              Aggregate counts of boards created, cards created and cards moved.
              These are totals only and are not linked to a board or a person.
            </li>
          </ul>
          <p>
            Board content is stored with Supabase, which hosts our database.
            Anything you type onto a card is stored as you typed it, so do not
            put passwords, payment details, or other sensitive information on a
            board.
          </p>

          <h2>What your browser stores</h2>
          <p>
            KanbanThing keeps the id of your board and the password you entered
            in your browser&apos;s local storage, so you are not asked for it
            again on the same device. Clearing your browser data removes it, and
            you will need the board link and password to get back in.
          </p>

          <h2>Who can see your board</h2>
          <p>
            Anyone with the board link and the board password can read and
            change the whole board. Boards are not listed anywhere and are not
            indexed by search engines, so sharing the link is the only way to
            give access. Treat the link and password as the access control they
            are.
          </p>

          <h2>How long we keep it</h2>
          <p>
            Boards are deleted 60 days after they are created, along with their
            columns and cards. There is no way to recover a board after that, so
            copy out anything you want to keep.
          </p>

          <h2>Analytics and advertising</h2>
          <p>
            We use Google Analytics to understand how the site is used, such as
            which pages are visited and how many boards get created. We use
            Google AdSense and AdMaven to show advertising, which pays for
            running the site. These third parties set their own cookies and may
            use your IP address, device information and browsing activity to
            measure or personalize the ads you see. Their own privacy policies
            govern that processing, and Google&apos;s advertising settings let
            you control ad personalization across sites that use Google.
          </p>

          <h2>What we do not do</h2>
          <p>
            We do not sell your data, we do not build advertising profiles
            ourselves, and we do not read your boards for anything other than
            operating the service.
          </p>

          <h2>Changes and contact</h2>
          <p>
            This policy may be updated as the site changes. If you have a
            question about it, reach us at{" "}
            <a
              href="https://bsky.app/profile/kanbanthing.bsky.social"
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring rounded"
            >
              @kanbanthing on Bluesky
            </a>
            .
          </p>
        </div>

        <Button asChild variant="ghost" className="mt-10">
          <Link href="/">Back to home</Link>
        </Button>
      </main>
    </div>
  )
}
