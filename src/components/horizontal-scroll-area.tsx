'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { IconButton } from '@/components/ui'
import { cn } from '@/lib/utils'

export interface HorizontalScrollState {
  canScrollLeft: boolean
  canScrollRight: boolean
}

export function getHorizontalScrollState(
  element: Pick<HTMLElement, 'clientWidth' | 'scrollLeft' | 'scrollWidth'>
): HorizontalScrollState {
  const maxScrollLeft = Math.max(0, element.scrollWidth - element.clientWidth)

  return {
    canScrollLeft: element.scrollLeft > 1,
    canScrollRight: element.scrollLeft < maxScrollLeft - 1,
  }
}

interface HorizontalScrollAreaProps {
  'aria-label': string
  children: ReactNode
  className?: string
  viewportClassName?: string
}

export function HorizontalScrollArea({
  'aria-label': ariaLabel,
  children,
  className,
  viewportClassName,
}: HorizontalScrollAreaProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [scrollState, setScrollState] = useState<HorizontalScrollState>({
    canScrollLeft: false,
    canScrollRight: false,
  })
  const hintId = `${useId().replace(/:/g, '')}-horizontal-scroll-hint`

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const updateScrollState = () => setScrollState(getHorizontalScrollState(viewport))
    updateScrollState()
    viewport.addEventListener('scroll', updateScrollState, { passive: true })

    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateScrollState)
    resizeObserver?.observe(viewport)

    const mutationObserver =
      typeof MutationObserver === 'undefined' ? null : new MutationObserver(updateScrollState)
    mutationObserver?.observe(viewport, { childList: true, subtree: true })

    return () => {
      viewport.removeEventListener('scroll', updateScrollState)
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()
    }
  }, [])

  const scrollBy = (direction: -1 | 1) => {
    const viewport = viewportRef.current
    if (!viewport) return

    viewport.scrollBy({
      left: direction * Math.max(viewport.clientWidth * 0.8, 280),
      behavior: 'smooth',
    })
  }

  const { canScrollLeft, canScrollRight } = scrollState
  const hasNavigation = canScrollLeft || canScrollRight

  return (
    <div className={cn('relative min-h-0 min-w-0 flex-1', className)}>
      <div
        ref={viewportRef}
        data-horizontal-scroll
        role="region"
        aria-label={ariaLabel}
        aria-describedby={hintId}
        tabIndex={0}
        className={cn(
          'h-full min-w-0 overflow-x-auto overscroll-x-contain scrollbar-thin',
          viewportClassName
        )}
      >
        {children}
      </div>

      <p id={hintId} className="sr-only">
        Scroll horizontally to see all columns. You can also use the previous and next controls
        when they are available.
      </p>

      {canScrollRight && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-canvas to-transparent"
        />
      )}

      {hasNavigation && (
        <div
          role="group"
          aria-label="Horizontal board navigation"
          className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex items-end justify-between"
        >
          {canScrollLeft ? (
            <IconButton
              label="Scroll board left"
              size="sm"
              variant="secondary"
              className="pointer-events-auto border border-subtle bg-surface-raised shadow-popover"
              icon={<ArrowLeft />}
              onClick={() => scrollBy(-1)}
            />
          ) : (
            <span aria-hidden />
          )}

          {canScrollRight ? (
            <div className="pointer-events-auto flex items-center gap-1 rounded-control border border-subtle bg-surface-raised p-1 shadow-popover">
              <span className="hidden px-1 text-xs text-muted max-sm:inline">More columns</span>
              <IconButton
                label="Scroll board right"
                size="sm"
                variant="secondary"
                icon={<ArrowRight />}
                onClick={() => scrollBy(1)}
              />
            </div>
          ) : (
            <span aria-hidden />
          )}
        </div>
      )}
    </div>
  )
}
