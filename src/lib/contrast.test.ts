import { describe, expect, it } from 'vitest'
import { isHex, normalizeHex } from './contrast'
import { PRESETS, previewColors, resolveVars } from './themes'

const preset = PRESETS[0]

describe('hex normalisation', () => {
  it('accepts a pasted hex without the hash', () => {
    expect(isHex('1a1a1a')).toBe(true)
  })

  it('canonicalises bare and shorthand hex', () => {
    expect(normalizeHex('1a1a1a')).toBe('#1a1a1a')
    expect(normalizeHex(' #ABC ')).toBe('#aabbcc')
    expect(normalizeHex('#1a1a1a')).toBe('#1a1a1a')
  })
})

describe('theme variables', () => {
  it('never writes a raw hex into a custom property', () => {
    const vars = resolveVars(preset, {
      canvas: '1a1a1a',
      fg: 'eeeeee',
      accent: '3366ff',
      support: 'abc',
    })
    expect(vars['--canvas']).toBe('#1a1a1a')
    expect(vars['--fg']).toBe('#eeeeee')
    expect(vars['--accent']).toBe('#3366ff')
    expect(vars['--support']).toBe('#aabbcc')
  })

  it('feeds the colour inputs canonical values', () => {
    expect(previewColors(preset, { canvas: '1a1a1a', accent: '3366ff' })).toMatchObject({
      canvas: '#1a1a1a',
      accent: '#3366ff',
    })
  })
})
