"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui"

export function CliTable({
  heading,
  rows,
  filterLabel,
}: {
  heading: string
  rows: [string, string][]
  filterLabel?: string
}) {
  const [query, setQuery] = useState("")

  const needle = query.trim().toLowerCase()
  const visible = needle
    ? rows.filter(([name, description]) =>
        `${name} ${description}`.toLowerCase().includes(needle)
      )
    : rows

  return (
    <div className="mt-4">
      {filterLabel && (
        <div className="relative mb-3">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={filterLabel}
            aria-label={filterLabel}
            className="pl-8"
          />
        </div>
      )}

      {visible.length === 0 ? (
        <p className="py-3 text-sm text-subtle">
          Nothing matches <span className="font-mono text-muted">{query}</span>.
        </p>
      ) : (
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-subtle">
                <th className="py-2 pr-6 text-xs font-medium uppercase tracking-wide text-subtle">
                  {heading}
                </th>
                <th className="py-2 text-xs font-medium uppercase tracking-wide text-subtle">
                  Meaning
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {visible.map(([name, description]) => (
                <tr key={name}>
                  <td className="py-2.5 pr-6 align-top font-mono text-sm text-fg">
                    {name}
                  </td>
                  <td className="py-2.5 align-top text-sm text-muted">
                    {description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
