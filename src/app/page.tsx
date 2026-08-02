import type { Metadata } from "next"
import { baseUrl, generateMetadata } from "@/lib/metadata"
import { FAQS } from "./faqs"
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

const organizationId = `${baseUrl}/#organization`

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: "KanbanThing",
      url: baseUrl,
      founder: {
        "@type": "Person",
        name: "Tron Schell",
        sameAs: "https://www.linkedin.com/in/tron-schell-aa0856181/",
      },
      sameAs: [
        "https://bsky.app/profile/kanbanthing.bsky.social",
        "https://twitter.com/kanbanthing",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      name: "KanbanThing",
      url: baseUrl,
      inLanguage: "en",
      publisher: { "@id": organizationId },
    },
    {
      "@type": ["SoftwareApplication", "WebApplication"],
      name: "KanbanThing",
      url: baseUrl,
      applicationCategory: "ProductivityApplication",
      operatingSystem: "Any",
      publisher: { "@id": organizationId },
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
        "Read-only share links",
        "Drag and drop interface",
        "Six interface themes",
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${baseUrl}/#faq`,
      mainEntity: FAQS.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    },
  ],
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HomeContent />
    </>
  )
}
