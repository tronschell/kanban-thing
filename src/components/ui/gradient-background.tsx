'use client'

import { useEffect, useRef } from 'react'

// Define muted color palette
const MUTED_COLORS = [
  { r: 245, g: 224, b: 203 }, // Muted tan
  { r: 230, g: 210, b: 211 }, // Soft pink
  { r: 206, g: 212, b: 218 }, // Light gray blue
  { r: 221, g: 214, b: 204 }, // Warm beige
  { r: 213, g: 219, b: 207 }, // Sage green
  { r: 225, g: 216, b: 222 }, // Dusty lavender
]

export function GradientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true, antialias: true }) as CanvasRenderingContext2D
    if (!ctx) return

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      
      ctx.scale(dpr, dpr)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Animation variables
    let animationFrame: number
    let rotation = 0
    const rotationSpeed = 0.0003

    // Color transition variables
    let currentColorIndex = 0
    let nextColorIndex = 1
    let colorTransition = 0
    const colorTransitionSpeed = 0.002

    // Function to interpolate between colors
    const interpolateColor = (color1: typeof MUTED_COLORS[0], color2: typeof MUTED_COLORS[0], progress: number) => {
      return {
        r: color1.r + (color2.r - color1.r) * progress,
        g: color1.g + (color2.g - color1.g) * progress,
        b: color1.b + (color2.b - color1.b) * progress,
      }
    }

    // Create gradient for main blob with color transition
    const createMainGradient = (x: number, y: number, currentColor: { r: number, g: number, b: number }) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 800) // Increased size
      
      // Create random offset for gradient center
      const offsetX = Math.cos(rotation * 2) * 100
      const offsetY = Math.sin(rotation * 2) * 100
      
      gradient.addColorStop(0, `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, 0.4)`)
      gradient.addColorStop(0.3, `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, 0.3)`)
      gradient.addColorStop(0.5, `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, 0.2)`)
      gradient.addColorStop(0.7, `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, 0.1)`)
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      return gradient
    }

    // Create gradient for secondary blobs
    const createSecondaryGradient = (x: number, y: number, colors: string[]) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 500)
      gradient.addColorStop(0, colors[0])
      gradient.addColorStop(0.3, colors[1])
      gradient.addColorStop(0.6, colors[2])
      gradient.addColorStop(0.8, colors[3])
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      return gradient
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2
      const radius = 400 // Increased center blob size
      const orbitRadius = 500

      // Update color transition
      colorTransition += colorTransitionSpeed
      if (colorTransition >= 1) {
        colorTransition = 0
        currentColorIndex = nextColorIndex
        nextColorIndex = (nextColorIndex + 1) % MUTED_COLORS.length
      }

      // Interpolate between current and next color
      const currentColor = interpolateColor(
        MUTED_COLORS[currentColorIndex],
        MUTED_COLORS[nextColorIndex],
        colorTransition
      )

      // Draw main blob with color transition
      ctx.beginPath()
      ctx.fillStyle = createMainGradient(centerX, centerY, currentColor)
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fill()

      // Draw rotating blobs
      const x1 = centerX + Math.cos(rotation) * orbitRadius
      const y1 = centerY + Math.sin(rotation) * orbitRadius
      ctx.beginPath()
      ctx.fillStyle = createSecondaryGradient(
        x1, y1, [
          'rgba(168, 85, 247, 0.25)',
          'rgba(168, 85, 247, 0.2)',
          'rgba(139, 92, 246, 0.15)',
          'rgba(139, 92, 246, 0.1)'
        ]
      )
      ctx.arc(x1, y1, radius * 0.8, 0, Math.PI * 2)
      ctx.fill()

      const x2 = centerX + Math.cos(rotation + Math.PI) * orbitRadius
      const y2 = centerY + Math.sin(rotation + Math.PI) * orbitRadius
      ctx.beginPath()
      ctx.fillStyle = createSecondaryGradient(
        x2, y2, [
          'rgba(52, 211, 153, 0.25)',
          'rgba(52, 211, 153, 0.2)',
          'rgba(16, 185, 129, 0.15)',
          'rgba(16, 185, 129, 0.1)'
        ]
      )
      ctx.arc(x2, y2, radius * 0.8, 0, Math.PI * 2)
      ctx.fill()

      rotation += rotationSpeed
      animationFrame = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrame)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ 
        filter: 'blur(120px) saturate(1.1)', // Reduced saturation for muted colors
        willChange: 'transform'
      }}
    />
  )
} 