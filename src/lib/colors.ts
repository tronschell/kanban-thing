export const LABEL_COLORS = [
  '#e5484d',
  '#f76b15',
  '#f5b800',
  '#30a46c',
  '#3e63dd',
  '#8e4ec6',
  '#d6409f',
] as const

export const LABEL_COLOR_NAMES: Record<(typeof LABEL_COLORS)[number], string> = {
  '#e5484d': 'Red',
  '#f76b15': 'Orange',
  '#f5b800': 'Amber',
  '#30a46c': 'Green',
  '#3e63dd': 'Blue',
  '#8e4ec6': 'Violet',
  '#d6409f': 'Pink',
}

export const randomLabelColor = () =>
  LABEL_COLORS[Math.floor(Math.random() * LABEL_COLORS.length)]
