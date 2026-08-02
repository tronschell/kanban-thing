import { ImageResponse } from 'next/og'

export const alt = 'KanbanThing - Simple Free Kanban Board Tool'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const canvas = '#0c1116'
const surface = '#17212b'
const border = '#2a3844'
const fg = '#dce6ee'
const muted = '#9cacb9'
const accent = '#5cd9e8'
const support = '#f0b357'

const columns = [
  { name: 'To do', cards: 3, tint: accent },
  { name: 'Doing', cards: 2, tint: support },
  { name: 'Done', cards: 1, tint: muted },
]

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: canvas,
          backgroundImage: `linear-gradient(${border} 1px, transparent 1px), linear-gradient(90deg, ${border} 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 84, fontWeight: 700, color: fg }}>
            <span>Kanban</span>
            <span style={{ color: accent }}>Thing</span>
          </div>
          <div style={{ display: 'flex', marginTop: 20, fontSize: 34, color: muted }}>
            Simple, free kanban boards. No signup.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 28 }}>
          {columns.map((column) => (
            <div
              key={column.name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                gap: 14,
                padding: 22,
                background: surface,
                border: `1px solid ${border}`,
                borderRadius: 6,
              }}
            >
              <div style={{ display: 'flex', fontSize: 26, color: column.tint }}>{column.name}</div>
              {Array.from({ length: column.cards }, (_, index) => (
                <div
                  key={index}
                  style={{ display: 'flex', height: 34, background: border, borderRadius: 4 }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  )
}
