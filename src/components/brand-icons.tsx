import type { ReactNode } from "react"
import { siClaude, siOpenai } from "simple-icons"
import { cn } from "@/lib/utils"

export interface BrandIcon {
  viewBox: string
  path: string
  evenOdd?: boolean
}

export const CLAUDE: BrandIcon = { viewBox: "0 0 24 24", path: siClaude.path }

export const OPENAI: BrandIcon = { viewBox: "0 0 24 24", path: siOpenai.path }

export const CURSOR: BrandIcon = {
  viewBox: "0 0 24 24",
  evenOdd: true,
  path: "M22.106 5.68L12.5.135a.998.998 0 00-.998 0L1.893 5.68a.84.84 0 00-.419.726v11.186c0 .3.16.577.42.727l9.607 5.547a.999.999 0 00.998 0l9.608-5.547a.84.84 0 00.42-.727V6.407a.84.84 0 00-.42-.726zm-.603 1.176L12.228 22.92c-.063.108-.228.064-.228-.061V12.34a.59.59 0 00-.295-.51l-9.11-5.26c-.107-.062-.063-.228.062-.228h18.55c.264 0 .428.286.296.514z",
}

export const VS_CODE: BrandIcon = {
  viewBox: "0 0 128 128",
  evenOdd: true,
  path: "M90.767 127.126a7.968 7.968 0 0 0 6.35-.244l26.353-12.681a8 8 0 0 0 4.53-7.209V21.009a8 8 0 0 0-4.53-7.21L97.117 1.12a7.97 7.97 0 0 0-9.093 1.548l-50.45 46.026L15.6 32.013a5.328 5.328 0 0 0-6.807.302l-7.048 6.411a5.335 5.335 0 0 0-.006 7.888L20.796 64 1.74 81.387a5.336 5.336 0 0 0 .006 7.887l7.048 6.411a5.327 5.327 0 0 0 6.807.303l21.974-16.68 50.45 46.025a7.96 7.96 0 0 0 2.743 1.793Zm5.252-92.183L57.74 64l38.28 29.058V34.943Z",
}

export function BrandGlyph({
  icon,
  className,
}: {
  icon: BrandIcon
  className?: string
}) {
  return (
    <svg
      aria-hidden
      viewBox={icon.viewBox}
      fillRule={icon.evenOdd ? "evenodd" : undefined}
      className={cn("fill-current", className)}
    >
      <path d={icon.path} />
    </svg>
  )
}

export function BrandName({
  icon,
  children,
}: {
  icon: BrandIcon
  children: ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <BrandGlyph icon={icon} className="size-[0.9em] shrink-0" />
      {children}
    </span>
  )
}
