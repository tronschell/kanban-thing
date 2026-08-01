import { Suspense } from "react"
import type { Metadata } from "next"
import { generateMetadata } from "@/lib/metadata"
import { UserOnboarding } from "@/components"
import { Spinner } from "@/components/ui"

export const metadata: Metadata = generateMetadata({
  title: "Create a Board - KanbanThing",
  description:
    "Create a free kanban board in seconds. Name it, set a password, and share the link. No sign-up required.",
  path: "/onboarding",
})

export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-6 py-16">
      <Suspense fallback={<Spinner size="lg" />}>
        <UserOnboarding />
      </Suspense>
    </main>
  )
}
