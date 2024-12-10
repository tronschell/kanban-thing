'use client'

import { Suspense } from 'react'
import { UserOnboarding } from '@/components'
import { LoadingSpinner } from '@/components/ui'
import { motion } from "framer-motion"

export default function OnboardingPage() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="min-h-screen flex flex-col bg-gray-950"
    >
      <Suspense fallback={<LoadingSpinner />}>
        <UserOnboarding />
      </Suspense>
    </motion.div>
  )
} 