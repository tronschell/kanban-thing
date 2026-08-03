import { alpha, isDarkSurface, isHex, mix, normalizeHex, readableOn } from './contrast'

const THEME_STORAGE_KEY = 'kanbanthing.theme.v2'

interface ThemeStructure {
  cardChrome: 'box' | 'rule' | 'ruled-card' | 'glyph-frame'
  columnFrame: 'panel' | 'rule' | 'tab' | 'bar' | 'ascii'
  texture: 'none' | 'grid' | 'paper' | 'dither'
  emphasis: 'tint' | 'invert-badge' | 'invert-card'
}

export const FONT_STACKS = {
  geistSans: {
    label: 'Geist Sans',
    stack: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
  },
  system: {
    label: 'System UI',
    stack: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  serif: {
    label: 'Serif',
    stack: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif',
  },
  geistMono: {
    label: 'Geist Mono',
    stack: 'var(--font-geist-mono), ui-monospace, monospace',
  },
  systemMono: {
    label: 'System Mono',
    stack:
      'ui-monospace, "Cascadia Mono", "Cascadia Code", Consolas, "DejaVu Sans Mono", Menlo, "Liberation Mono", "Courier New", monospace',
  },
  typewriter: {
    label: 'Typewriter',
    stack: '"Courier New", Courier, "Nimbus Mono PS", ui-monospace, monospace',
  },
} as const

export type FontKey = keyof typeof FONT_STACKS

export interface ThemePreset {
  id: string
  name: string
  tagline: string
  structure: ThemeStructure
  /** Editable starting points. The full ramps live in `globals.css` under `[data-theme]`. */
  base: {
    canvas: string
    fg: string
    accent: string
    support: string
    radius: number
    weightBody: number
    weightHeading: number
    fontSans: FontKey
    fontMono: FontKey
  }
}

export const PRESETS: ThemePreset[] = [
  {
    id: 'broadsheet',
    name: 'Broadsheet',
    tagline: 'Cream editorial page. Hairlines and serif type, no card boxes.',
    structure: { cardChrome: 'rule', columnFrame: 'rule', texture: 'none', emphasis: 'tint' },
    base: {
      canvas: '#f7f4ec',
      fg: '#17140f',
      accent: '#26456e',
      support: '#7a4f00',
      radius: 2,
      weightBody: 400,
      weightHeading: 600,
      fontSans: 'geistSans',
      fontMono: 'geistMono',
    },
  },
  {
    id: 'instrument',
    name: 'Instrument Panel',
    tagline: 'Dark plotted grid, all mono, channel colours and WIP meters.',
    structure: { cardChrome: 'box', columnFrame: 'panel', texture: 'grid', emphasis: 'tint' },
    base: {
      canvas: '#0c1116',
      fg: '#dce6ee',
      accent: '#5cd9e8',
      support: '#f0b357',
      radius: 4,
      weightBody: 400,
      weightHeading: 600,
      fontSans: 'systemMono',
      fontMono: 'systemMono',
    },
  },
  {
    id: 'indexcard',
    name: 'Index Card Desk',
    tagline: 'Manila tabs and ruled cards on a woven desk.',
    structure: { cardChrome: 'ruled-card', columnFrame: 'tab', texture: 'paper', emphasis: 'tint' },
    base: {
      canvas: '#c2b398',
      fg: '#241f18',
      accent: '#33506e',
      support: '#5f451e',
      radius: 3,
      weightBody: 400,
      weightHeading: 600,
      fontSans: 'geistSans',
      fontMono: 'typewriter',
    },
  },
  {
    id: 'signalpress',
    name: 'Signal Press',
    tagline: 'Black on white, 2px rules, zero radius, one vermilion.',
    structure: { cardChrome: 'box', columnFrame: 'bar', texture: 'none', emphasis: 'invert-card' },
    base: {
      canvas: '#f1efea',
      fg: '#0a0a0a',
      accent: '#b02000',
      support: '#8c1a00',
      radius: 0,
      weightBody: 400,
      weightHeading: 700,
      fontSans: 'geistSans',
      fontMono: 'geistMono',
    },
  },
  {
    id: 'duskcalm',
    name: 'Dusk Calm',
    tagline: 'Borderless soft dark. Depth from three fills and one ring.',
    structure: { cardChrome: 'box', columnFrame: 'panel', texture: 'none', emphasis: 'tint' },
    base: {
      canvas: '#12141a',
      fg: '#e9ebf1',
      accent: '#9db4ff',
      support: '#a6d8b7',
      radius: 13,
      weightBody: 500,
      weightHeading: 700,
      fontSans: 'geistSans',
      fontMono: 'geistMono',
    },
  },
  {
    id: 'phosphor',
    name: 'Phosphor Bitmap',
    tagline: 'One amber phosphor, ordered dither, box-drawing frames.',
    structure: {
      cardChrome: 'glyph-frame',
      columnFrame: 'ascii',
      texture: 'dither',
      emphasis: 'invert-badge',
    },
    base: {
      canvas: '#0a0806',
      fg: '#ffc24a',
      accent: '#ffe9b8',
      support: '#c08a2e',
      radius: 0,
      weightBody: 400,
      weightHeading: 700,
      fontSans: 'systemMono',
      fontMono: 'systemMono',
    },
  },
]

export const DEFAULT_PRESET_ID = 'instrument'

export const presetById = (id: string) =>
  PRESETS.find((preset) => preset.id === id) ?? PRESETS.find((p) => p.id === DEFAULT_PRESET_ID)!

export interface ThemeOverrides {
  canvas?: string
  fg?: string
  accent?: string
  support?: string
  fontSans?: FontKey
  fontMono?: FontKey
  weightBody?: number
  weightHeading?: number
  radius?: number
}

export interface ThemeState {
  presetId: string
  overrides: ThemeOverrides
}

type Vars = Record<string, string>

const neutralVars = (canvas: string, fg: string): Vars => {
  const dark = isDarkSurface(canvas)
  const lift = (amount: number) => mix(canvas, '#ffffff', amount)
  const press = (amount: number) => mix(canvas, fg, amount)

  return {
    '--canvas': canvas,
    '--surface': dark ? lift(0.05) : lift(0.45),
    '--surface-raised': dark ? lift(0.09) : lift(0.9),
    '--surface-hover': dark ? lift(0.15) : press(0.06),
    '--surface-active': dark ? lift(0.21) : press(0.12),
    '--overlay': dark ? alpha('#000000', 0.68) : alpha(press(0.85), 0.4),
    '--fg': fg,
    '--fg-muted': mix(fg, canvas, 0.26),
    '--fg-subtle': mix(fg, canvas, 0.38),
    '--border-subtle': press(0.1),
    '--border': press(0.18),
    '--border-strong': press(0.34),
  }
}

const accentVars = (accent: string, canvas: string): Vars => ({
  '--accent': accent,
  '--accent-hover': mix(accent, isDarkSurface(canvas) ? '#ffffff' : '#000000', 0.18),
  '--accent-fg': readableOn(accent),
  '--accent-soft': alpha(accent, isDarkSurface(canvas) ? 0.16 : 0.1),
})

const supportVars = (support: string, canvas: string): Vars => ({
  '--support': support,
  '--support-fg': readableOn(support),
  '--support-soft': alpha(support, isDarkSurface(canvas) ? 0.16 : 0.12),
})

const radiusVars = (base: number): Vars => ({
  '--radius-tag': `${Math.round(base * 0.45)}px`,
  '--radius-control': `${Math.round(base * 0.7)}px`,
  '--radius-card': `${base}px`,
  '--radius-panel': `${Math.round(base * 1.4)}px`,
})

export function resolveVars(preset: ThemePreset, overrides: ThemeOverrides): Vars {
  const { base } = preset
  const canvas = normalizeHex(overrides.canvas ?? base.canvas)
  const fg = normalizeHex(overrides.fg ?? base.fg)
  let vars: Vars = {}

  if (overrides.canvas || overrides.fg) vars = { ...vars, ...neutralVars(canvas, fg) }
  if (overrides.accent) vars = { ...vars, ...accentVars(normalizeHex(overrides.accent), canvas) }
  if (overrides.support) vars = { ...vars, ...supportVars(normalizeHex(overrides.support), canvas) }
  if (overrides.radius !== undefined) vars = { ...vars, ...radiusVars(overrides.radius) }
  if (overrides.fontSans) vars['--font-sans'] = FONT_STACKS[overrides.fontSans].stack
  if (overrides.fontMono) vars['--font-mono'] = FONT_STACKS[overrides.fontMono].stack
  if (overrides.weightBody !== undefined) vars['--weight-body'] = String(overrides.weightBody)
  if (overrides.weightHeading !== undefined) {
    vars['--weight-heading'] = String(overrides.weightHeading)
  }

  return vars
}

/** The four colour tokens a warning can be raised against, resolved for the live preview. */
export function previewColors(preset: ThemePreset, overrides: ThemeOverrides) {
  const canvas = normalizeHex(overrides.canvas ?? preset.base.canvas)
  const fg = normalizeHex(overrides.fg ?? preset.base.fg)
  const accent = normalizeHex(overrides.accent ?? preset.base.accent)
  const support = normalizeHex(overrides.support ?? preset.base.support)
  return { canvas, fg, accent, support, surfaceRaised: neutralVars(canvas, fg)['--surface-raised'] }
}

export function applyTheme(state: ThemeState) {
  const preset = presetById(state.presetId)
  const root = document.documentElement
  const vars = resolveVars(preset, state.overrides)

  root.removeAttribute('style')
  root.setAttribute('data-theme', preset.id)
  root.setAttribute('data-card-chrome', preset.structure.cardChrome)
  root.setAttribute('data-column-frame', preset.structure.columnFrame)
  root.setAttribute('data-texture', preset.structure.texture)
  root.setAttribute('data-emphasis', preset.structure.emphasis)
  for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value)

  return vars
}

const sanitize = (overrides: unknown): ThemeOverrides => {
  const raw = (overrides ?? {}) as Record<string, unknown>
  const next: ThemeOverrides = {}
  for (const key of ['canvas', 'fg', 'accent', 'support'] as const) {
    const value = raw[key]
    if (typeof value === 'string' && isHex(value)) next[key] = value
  }
  for (const key of ['fontSans', 'fontMono'] as const) {
    const value = raw[key]
    if (typeof value === 'string' && value in FONT_STACKS) next[key] = value as FontKey
  }
  for (const key of ['weightBody', 'weightHeading', 'radius'] as const) {
    const value = raw[key]
    if (typeof value === 'number' && Number.isFinite(value)) next[key] = value
  }
  return next
}

export function loadTheme(): ThemeState {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    if (!raw) return { presetId: DEFAULT_PRESET_ID, overrides: {} }
    const parsed = JSON.parse(raw)
    return { presetId: presetById(parsed?.presetId).id, overrides: sanitize(parsed?.overrides) }
  } catch {
    return { presetId: DEFAULT_PRESET_ID, overrides: {} }
  }
}

export function saveTheme(state: ThemeState, vars: Vars) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ ...state, vars }))
  } catch {
    /* private mode, storage full: the theme still applies for this session */
  }
}

export function themeBootstrapScript() {
  const structures = Object.fromEntries(
    PRESETS.map(({ id, structure }) => [
      id,
      [structure.cardChrome, structure.columnFrame, structure.texture, structure.emphasis],
    ])
  )
  const attributes = ['data-card-chrome', 'data-column-frame', 'data-texture', 'data-emphasis']

  return `(function(){try{var S=${JSON.stringify(structures)},A=${JSON.stringify(attributes)},d=document.documentElement,s=null;try{s=JSON.parse(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}))}catch(e){}var i=s&&S[s.presetId]?s.presetId:${JSON.stringify(DEFAULT_PRESET_ID)};d.setAttribute("data-theme",i);for(var n=0;n<4;n++)d.setAttribute(A[n],S[i][n]);var v=s&&s.vars;if(v)for(var k in v)d.style.setProperty(k,v[k])}catch(e){}})()`
}
