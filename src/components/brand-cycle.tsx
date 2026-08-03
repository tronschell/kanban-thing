"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import {
  BrandGlyph,
  CLAUDE,
  CURSOR,
  OPENAI,
  VS_CODE,
} from "@/components/brand-icons"
import { cn } from "@/lib/utils"

const ICONS = [CLAUDE, OPENAI, CURSOR, VS_CODE]

const HOLD_MS = 2200

export function BrandCycle({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (reduceMotion) return
    const timer = setInterval(
      () => setIndex((current) => (current + 1) % ICONS.length),
      HOLD_MS
    )
    return () => clearInterval(timer)
  }, [reduceMotion])

  return (
    <span
      aria-hidden
      className={cn("relative inline-block size-[0.8em] align-[-0.06em]", className)}
    >
      <AnimatePresence initial={false}>
        <motion.span
          key={index}
          initial={{ opacity: 0, y: "0.2em" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "-0.2em" }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          className="absolute inset-0"
        >
          <BrandGlyph icon={ICONS[index]} className="size-full" />
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
