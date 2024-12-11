'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { GradientBackground } from '@/components/ui/gradient-background'

const quirkySayings = [
  "Oops! This board has floated away into the digital void 🌌",
  "Looks like this task got lost in the backlog 📝",
  "404: Board not found in any of our columns 🤔",
  "Even the best Kanban boards sometimes go missing 🎯",
  "This ticket must be in another sprint 🏃‍♂️"
]

export default function NotFound() {
  // Get a random quirky saying
  const randomSaying = quirkySayings[Math.floor(Math.random() * quirkySayings.length)]

  return (
    <motion.div 
      className="fixed inset-0 flex items-center justify-center px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background layers */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="absolute inset-0">
        <GradientBackground />
      </div>

      {/* Content layer */}
      <div className="relative z-10 text-center">
        <h1 className="text-8xl font-bold text-white mb-4">404</h1>
        <p className="text-xl text-white/90 mb-8">
          {randomSaying}
        </p>
        <Link 
          href="/"
          className="inline-block bg-white text-gray-950 px-8 py-3 rounded-lg hover:bg-white/70 transition-colors font-medium"
        >
          Back to Home 🏠
        </Link>
      </div>
    </motion.div>
  )
} 