'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Check } from 'lucide-react'
import { Badge, Button, Modal, ModalFooter, Select, fieldClass } from '@/components/ui'
import { AA_BODY, AA_LARGE, contrastRatio, isHex } from '@/lib/contrast'
import {
  FONT_STACKS,
  PRESETS,
  applyTheme,
  loadTheme,
  presetById,
  previewColors,
  saveTheme,
  type FontKey,
  type ThemeOverrides,
  type ThemeState,
} from '@/lib/themes'
import { cn } from '@/lib/utils'

const WEIGHTS = [300, 400, 500, 600, 700, 800]
const SANS_KEYS: FontKey[] = ['geistSans', 'system', 'serif', 'geistMono', 'systemMono']
const MONO_KEYS: FontKey[] = ['geistMono', 'systemMono', 'typewriter']

const labelClass = 'block text-xs font-medium text-muted mb-1.5'

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (next: string) => void
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(fieldClass, 'h-8 w-10 shrink-0 cursor-pointer p-1')}
        />
        <input
          aria-label={`${label} hex value`}
          value={value}
          onChange={(e) => isHex(e.target.value) && onChange(e.target.value)}
          className={cn(fieldClass, 'h-8 px-2.5 font-mono text-xs')}
        />
      </div>
    </div>
  )
}

function ContrastCheck({
  label,
  foreground,
  background,
  minimum,
}: {
  label: string
  foreground: string
  background: string
  minimum: number
}) {
  const ratio = contrastRatio(foreground, background)
  const passes = ratio >= minimum

  return (
    <li className="flex items-center gap-2 text-xs">
      {passes ? (
        <Check aria-hidden className="size-3.5 shrink-0 text-accent" />
      ) : (
        <AlertTriangle aria-hidden className="size-3.5 shrink-0 text-danger" />
      )}
      <span className={cn('min-w-0 flex-1', passes ? 'text-muted' : 'text-danger')}>{label}</span>
      <span className="font-mono tabular-nums text-subtle">
        {ratio.toFixed(2)}:1 / {minimum}:1
      </span>
    </li>
  )
}

export function ThemePicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [state, setState] = useState<ThemeState>({ presetId: PRESETS[1].id, overrides: {} })

  useEffect(() => setState(loadTheme()), [])

  const update = (next: ThemeState) => {
    setState(next)
    saveTheme(next, applyTheme(next))
  }

  const setOverride = <K extends keyof ThemeOverrides>(key: K, value: ThemeOverrides[K]) =>
    update({ ...state, overrides: { ...state.overrides, [key]: value } })

  const preset = presetById(state.presetId)
  const value = <K extends keyof ThemeOverrides>(key: K) =>
    (state.overrides[key] ?? preset.base[key]) as NonNullable<ThemeOverrides[K]>
  const colors = previewColors(preset, state.overrides)
  const hasOverrides = Object.keys(state.overrides).length > 0

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Appearance"
      description="Pick an interface, then tune it. Saved to this browser."
      size="lg"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PRESETS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => update({ presetId: option.id, overrides: {} })}
              aria-pressed={option.id === state.presetId}
              className={cn(
                'focus-ring flex items-center gap-3 rounded-card border p-2.5 text-left transition-colors duration-fast ease-out',
                option.id === state.presetId
                  ? 'border-accent bg-accent-soft'
                  : 'border-subtle hover:bg-surface-hover'
              )}
            >
              <span
                aria-hidden
                className="flex size-9 shrink-0 items-center justify-center gap-1 rounded-tag border border-subtle"
                style={{ backgroundColor: option.base.canvas }}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: option.base.accent }}
                />
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: option.base.support }}
                />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-fg">{option.name}</span>
                <span className="block text-xs text-subtle">{option.tagline}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ColorField
            id="theme-accent"
            label="Accent"
            value={colors.accent}
            onChange={(next) => setOverride('accent', next)}
          />
          <ColorField
            id="theme-support"
            label="Secondary"
            value={colors.support}
            onChange={(next) => setOverride('support', next)}
          />
          <ColorField
            id="theme-canvas"
            label="Background"
            value={colors.canvas}
            onChange={(next) => setOverride('canvas', next)}
          />
          <ColorField
            id="theme-fg"
            label="Text"
            value={colors.fg}
            onChange={(next) => setOverride('fg', next)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="theme-font-sans" className={labelClass}>
              Body font
            </label>
            <Select
              id="theme-font-sans"
              value={value('fontSans')}
              onChange={(e) => setOverride('fontSans', e.target.value as FontKey)}
            >
              {SANS_KEYS.map((key) => (
                <option key={key} value={key}>
                  {FONT_STACKS[key].label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="theme-font-mono" className={labelClass}>
              Mono font
            </label>
            <Select
              id="theme-font-mono"
              value={value('fontMono')}
              onChange={(e) => setOverride('fontMono', e.target.value as FontKey)}
            >
              {MONO_KEYS.map((key) => (
                <option key={key} value={key}>
                  {FONT_STACKS[key].label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="theme-weight-body" className={labelClass}>
              Body weight
            </label>
            <Select
              id="theme-weight-body"
              value={value('weightBody')}
              onChange={(e) => setOverride('weightBody', Number(e.target.value))}
            >
              {WEIGHTS.map((weight) => (
                <option key={weight} value={weight}>
                  {weight}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="theme-weight-heading" className={labelClass}>
              Heading weight
            </label>
            <Select
              id="theme-weight-heading"
              value={value('weightHeading')}
              onChange={(e) => setOverride('weightHeading', Number(e.target.value))}
            >
              {WEIGHTS.map((weight) => (
                <option key={weight} value={weight}>
                  {weight}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <label htmlFor="theme-radius" className={labelClass}>
            Corner radius
            <span className="ml-1.5 font-mono tabular-nums text-subtle">{value('radius')}px</span>
          </label>
          <input
            id="theme-radius"
            type="range"
            min={0}
            max={20}
            step={1}
            value={value('radius')}
            onChange={(e) => setOverride('radius', Number(e.target.value))}
            className="focus-ring h-8 w-full accent-accent"
          />
        </div>

        <div className="rounded-card border border-subtle bg-surface p-3">
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <Button variant="primary" size="sm">
              Primary
            </Button>
            <Button size="sm">Secondary</Button>
            <Badge>Tag</Badge>
            <Badge variant="danger">Overdue</Badge>
          </div>
          <ul className="space-y-1.5">
            <ContrastCheck
              label="Body text on cards"
              foreground={colors.fg}
              background={colors.surfaceRaised}
              minimum={AA_BODY}
            />
            <ContrastCheck
              label="Body text on the board background"
              foreground={colors.fg}
              background={colors.canvas}
              minimum={AA_BODY}
            />
            <ContrastCheck
              label="Accent focus ring and borders"
              foreground={colors.accent}
              background={colors.canvas}
              minimum={AA_LARGE}
            />
            <ContrastCheck
              label="Secondary colour against the board"
              foreground={colors.support}
              background={colors.canvas}
              minimum={AA_LARGE}
            />
          </ul>
        </div>
      </div>

      <ModalFooter>
        <Button
          variant="ghost"
          disabled={!hasOverrides}
          onClick={() => update({ presetId: state.presetId, overrides: {} })}
        >
          Reset to {preset.name}
        </Button>
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      </ModalFooter>
    </Modal>
  )
}
