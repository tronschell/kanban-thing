import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center">
      <p className="font-mono text-2xs uppercase tracking-wide text-subtle">
        404
      </p>
      <h1 className="mt-3 text-4xl font-semibold text-fg md:text-5xl">
        Nothing here
      </h1>
      <p className="mt-4 max-w-[62ch] text-md text-muted">
        This page does not exist, or the board it pointed at has expired. Boards
        are removed two months after they are created.
      </p>
      <Button asChild variant="primary" size="lg" className="mt-8">
        <Link href="/">Back to home</Link>
      </Button>
    </main>
  )
}
