import { CopyButton } from "@/components/copy-button"

export function CodeBlock({ children }: { children: string }) {
  return (
    <div className="relative mt-4">
      <pre className="overflow-x-auto rounded-panel border border-subtle bg-surface p-4 pr-12 font-mono text-sm text-fg scrollbar-thin">
        {children}
      </pre>
      <CopyButton value={children} className="absolute right-2 top-2" />
    </div>
  )
}
