export const AA_BODY = 4.5
export const AA_LARGE = 3

export const isHex = (value: string) => /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim())

function parseHex(hex: string): [number, number, number] {
  const raw = hex.trim().replace('#', '')
  const full = raw.length === 3 ? raw.replace(/./g, (c) => c + c) : raw
  const int = Number.parseInt(full, 16)
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255]
}

function toHex(channels: number[]) {
  const byte = (value: number) =>
    Math.round(Math.min(255, Math.max(0, value)))
      .toString(16)
      .padStart(2, '0')
  return `#${channels.map(byte).join('')}`
}

function relativeLuminance(hex: string) {
  const [r, g, b] = parseHex(hex).map((channel) => {
    const s = channel / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a: string, b: string) {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

export function mix(a: string, b: string, amount: number) {
  const from = parseHex(a)
  const to = parseHex(b)
  return toHex(from.map((channel, i) => channel + (to[i] - channel) * amount))
}

export function alpha(hex: string, opacity: number) {
  const [r, g, b] = parseHex(hex)
  return `rgb(${r} ${g} ${b} / ${opacity})`
}

export const isDarkSurface = (hex: string) => relativeLuminance(hex) < 0.35

export const readableOn = (background: string) =>
  contrastRatio(background, '#ffffff') >= contrastRatio(background, '#0b0b0b') ? '#ffffff' : '#0b0b0b'
