import type { Metadata } from "next"
import { baseUrl, generateMetadata } from "@/lib/metadata"
import { FAQS } from "./faqs"
import HomeContent from "./home-content"

const title = "Free Online Kanban Board — No Sign Up, No Login"

export const metadata: Metadata = {
  ...generateMetadata({
    title,
    description:
      "Create a shared kanban board online — no login, no sign up, no registration, no install. Name a board, send the link, drag the cards. Free, and it stays free.",
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
      description:
        "KanbanThing makes a free online kanban board you share by link, with no account, no registration and nothing to install.",
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
      "@id": `${baseUrl}/#app`,
      name: "KanbanThing",
      url: baseUrl,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any",
      publisher: { "@id": organizationId },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description:
        "A free online kanban board you share by link. No login, no registration and no install: name a board, set a password, send the link, and everyone drags the same cards.",
      featureList: [
        "No login, registration or sign-up required",
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
