import { beforeEach, describe, expect, it } from 'vitest'
import { AA_LARGE, contrastRatio, isHex, normalizeHex } from './contrast'
import {
  DEFAULT_PRESET_ID,
  PRESETS,
  presetById,
  previewColors,
  resolveVars,
  saveTheme,
  themeBootstrapScript,
} from './themes'

const preset = PRESETS[0]

const runBootstrap = () => new Function(themeBootstrapScript())()

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

  it.each(PRESETS)('$name keeps secondary colour at the large-text threshold', (option) => {
    expect(contrastRatio(option.base.support, option.base.canvas)).toBeGreaterThanOrEqual(AA_LARGE)
  })
})

describe('theme bootstrap', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('style')
  })

  it('ignores pre-fix storage holding bare hex vars', () => {
    localStorage.setItem(
      'kanbanthing.theme.v1',
      JSON.stringify({
        version: 1,
        presetId: 'duskcalm',
        overrides: { canvas: '1a1a1a', fg: 'eeeeee' },
        vars: { '--canvas': '1a1a1a', '--fg': 'eeeeee', '--surface': '#2f2f2f' },
      })
    )

    runBootstrap()

    expect(document.documentElement.getAttribute('style')).toBe(null)
    expect(document.documentElement.getAttribute('data-theme')).toBe(DEFAULT_PRESET_ID)
  })

  it('applies vars saved by the current version', () => {
    const state = { presetId: 'duskcalm', overrides: { canvas: '1a1a1a' } }
    saveTheme(state, resolveVars(presetById(state.presetId), state.overrides))

    runBootstrap()

    const { style } = document.documentElement
    expect(style.getPropertyValue('--canvas')).toBe('#1a1a1a')
    expect(document.documentElement.getAttribute('data-theme')).toBe('duskcalm')
  })
})
