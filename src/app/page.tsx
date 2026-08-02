import type { Metadata } from "next"
import { generateMetadata } from "@/lib/metadata"
import HomeContent from "./home-content"

const title = "KanbanThing - Simple Free Kanban Board Tool"

export const metadata: Metadata = {
  ...generateMetadata({
    title,
    description:
      "A simple, no-signup, and free Kanban board application designed to help individuals and teams organize their work effectively. KanbanThing can be used for project management, team collaboration, or as a simple task list.",
    path: "/",
  }),
  title: { absolute: title },
}

export default function Home() {
  return <HomeContent />
}
