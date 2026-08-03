"use client"

import { useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface Heading {
  id: string
  text: string
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

export function PageNav() {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [active, setActive] = useState("")

  useEffect(() => {
    let nodes: HTMLElement[] = []

    const sync = () => {
      const atBottom =
        window.scrollY + window.innerHeight >= document.body.scrollHeight - 2
      if (atBottom) {
        setActive(nodes.at(-1)?.id ?? "")
        return
      }
      const passed = nodes.filter(
        (node) => node.getBoundingClientRect().top <= 96
      )
      setActive((passed.at(-1) ?? nodes[0])?.id ?? "")
    }

    const timer = setTimeout(() => {
      nodes = Array.from(
        document.querySelectorAll<HTMLElement>("[data-page-content] h2")
      )
      nodes.forEach((node) => {
        if (!node.id) node.id = slugify(node.textContent ?? "")
      })
      setHeadings(
        nodes.map((node) => ({ id: node.id, text: node.textContent ?? "" }))
      )

      const hash = window.location.hash.slice(1)
      if (hash) document.getElementById(hash)?.scrollIntoView()
      sync()
    }, 0)

    window.addEventListener("scroll", sync, { passive: true })
    return () => {
      clearTimeout(timer)
      window.removeEventListener("scroll", sync)
    }
  }, [])

  if (headings.length < 2) return null

  const links = headings.map((heading) => (
    <li key={heading.id}>
      <a
        href={`#${heading.id}`}
        className={cn(
          "focus-ring block rounded-r border-l py-1.5 pl-3 text-sm transition-colors duration-fast",
          heading.id === active
            ? "border-accent text-fg"
            : "border-transparent text-muted hover:text-fg"
        )}
      >
        {heading.text}
      </a>
    </li>
  ))

  return (
    <div className="mb-10 lg:sticky lg:top-8 lg:mb-0">
      <details className="group rounded-panel border border-subtle bg-surface lg:hidden">
        <summary className="focus-ring flex cursor-pointer list-none items-center justify-between rounded-panel px-4 py-3 text-sm font-medium text-fg">
          On this page
          <ChevronDown
            aria-hidden
            className="size-4 text-subtle transition-transform duration-fast group-open:rotate-180"
          />
        </summary>
        <ul className="border-t border-subtle p-3">{links}</ul>
      </details>

      <nav
        aria-label="On this page"
        className="hidden max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin lg:block"
      >
        <p className="mb-3 pl-3 text-xs font-medium uppercase tracking-wide text-subtle">
          On this page
        </p>
        <ul>{links}</ul>
      </nav>
    </div>
  )
}
