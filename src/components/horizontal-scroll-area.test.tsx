import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { getHorizontalScrollState, HorizontalScrollArea } from './horizontal-scroll-area'

describe('getHorizontalScrollState', () => {
  it('offers a next affordance while content remains beyond the viewport', () => {
    expect(getHorizontalScrollState({ clientWidth: 390, scrollLeft: 0, scrollWidth: 900 })).toEqual({
      canScrollLeft: false,
      canScrollRight: true,
    })
  })

  it('does not report navigation once the viewport reaches either edge', () => {
    expect(getHorizontalScrollState({ clientWidth: 390, scrollLeft: 510, scrollWidth: 900 })).toEqual({
      canScrollLeft: true,
      canScrollRight: false,
    })
  })
})

describe('HorizontalScrollArea', () => {
  it('describes a keyboard-focusable horizontal region', () => {
    render(
      <HorizontalScrollArea aria-label="Board columns">
        <div>Column</div>
      </HorizontalScrollArea>
    )

    const region = screen.getByRole('region', { name: 'Board columns' })
    expect(region.getAttribute('tabindex')).toBe('0')
    expect(screen.getByText(/scroll horizontally to see all columns/i)).toBeTruthy()
  })
})
