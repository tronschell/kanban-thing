import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { UserOnboarding } from '@/components'
import { GradientBackground } from '@/components/ui/gradient-background'
import { PreviewCard } from "@/components/ui/preview-card";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-950 overflow-auto">
      <GradientBackground />

      {/* Hero Section */}
      <main className="relative flex-1 flex flex-col p-8 md:p-20">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 tracking-tight">
            KanbanThing
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
            Built to make you extraordinarily productive.
            <br />
            The easiest way to organize your work.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/onboarding"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-gray-900 bg-white rounded-xl hover:bg-white/90 transition-colors shadow-lg backdrop-blur-sm"
            >
              Create New Board
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>

          {/* App Preview */}
          <div className="mt-12 sm:mt-20 relative">
            <PreviewCard>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl" />
              <div className="relative bg-gray-900/40 backdrop-blur border border-white/10 rounded-2xl p-2 sm:p-4 shadow-2xl">
                {/* Window Controls */}
                <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-4 px-2 sm:px-4">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500" />
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500" />
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500" />
                </div>
                
                {/* App Content Preview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4">
                  <div className="col-span-full bg-gray-800/50 rounded-lg p-2 sm:p-4 h-[200px] sm:h-[300px]">
                    {/* Main content area */}
                    <div className="flex gap-2 sm:gap-4 h-full">
                      {/* Todo Column */}
                      <div className="flex-1 bg-gray-700/50 rounded-lg p-2 sm:p-3">
                        <div className="text-white/80 text-xs sm:text-sm font-medium mb-2 sm:mb-3">To Do</div>
                        <div className="space-y-1 sm:space-y-2">
                          
                          <div className="bg-gray-800/70 p-1.5 sm:p-2 rounded-md">
                            <div className="h-1.5 sm:h-2 bg-purple-400/30 w-12 rounded mb-1 sm:mb-2" />
                            <div className="h-2 sm:h-3 bg-gray-600/50 w-2/3 rounded" />
                          </div>
                        </div>
                      </div>

                      {/* In Progress Column */}
                      <div className="flex-1 bg-gray-700/50 rounded-lg p-2 sm:p-3">
                        <div className="text-white/80 text-xs sm:text-sm font-medium mb-2 sm:mb-3">In Progress</div>
                        <div className="space-y-1 sm:space-y-2">
                          <div className="bg-gray-800/70 p-1.5 sm:p-2 rounded-md">
                            <div className="h-1.5 sm:h-2 bg-yellow-400/30 w-12 rounded mb-1 sm:mb-2" />
                            <div className="h-2 sm:h-3 bg-gray-600/50 w-4/5 rounded" />
                          </div>
                          <div className="bg-gray-800/70 p-1.5 sm:p-2 rounded-md">
                            <div className="h-1.5 sm:h-2 bg-blue-400/30 w-12 rounded mb-1 sm:mb-2" />
                            <div className="h-2 sm:h-3 bg-gray-600/50 w-3/4 rounded" />
                          </div>
                        </div>
                      </div>

                      {/* Done Column */}
                      <div className="flex-1 bg-gray-700/50 rounded-lg p-2 sm:p-3">
                        <div className="text-white/80 text-xs sm:text-sm font-medium mb-2 sm:mb-3">Done</div>
                        <div className="space-y-1 sm:space-y-2">
                          <div className="bg-gray-800/70 p-1.5 sm:p-2 rounded-md">
                            <div className="h-1.5 sm:h-2 bg-pink-400/30 w-12 rounded mb-1 sm:mb-2" />
                            <div className="h-2 sm:h-3 bg-gray-600/50 w-3/5 rounded" />
                          </div>
                          <div className="bg-gray-800/70 p-1.5 sm:p-2 rounded-md">
                            <div className="h-1.5 sm:h-2 bg-orange-400/30 w-12 rounded mb-1 sm:mb-2" />
                            <div className="h-2 sm:h-3 bg-gray-600/50 w-2/3 rounded" />
                          </div>
                          <div className="bg-gray-800/70 p-1.5 sm:p-2 rounded-md">
                            <div className="h-1.5 sm:h-2 bg-green-400/30 w-12 rounded mb-1 sm:mb-2" />
                            <div className="h-2 sm:h-3 bg-gray-600/50 w-1/2 rounded" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Sidebar */}
                  <div className="col-span-full bg-gray-800/50 rounded-lg p-2 sm:p-4">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="h-3 sm:h-4 bg-gray-700/50 rounded w-3/4" />
                      <div className="h-3 sm:h-4 bg-gray-700/50 rounded w-1/2" />
                      <div className="h-3 sm:h-4 bg-gray-700/50 rounded w-2/3" />
                    </div>
                  </div>
                </div>
              </div>
            </PreviewCard>
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <div className="p-6 rounded-xl bg-gray-900/50 backdrop-blur border border-white/10">
              <h3 className="text-xl font-semibold mb-3 text-white">No Sign-up Required</h3>
              <p className="text-white/80">
                Start organizing instantly. Create a board and share the link.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-gray-900/50 backdrop-blur border border-white/10">
              <h3 className="text-xl font-semibold mb-3 text-white">Board Lifespan</h3>
              <p className="text-white/80">
                Boards only live for 2 months, so make the most of your time!
              </p>
            </div>
            <div className="p-6 rounded-xl bg-gray-900/50 backdrop-blur border border-white/10">
              <h3 className="text-xl font-semibold mb-3 text-white">Mobile Friendly</h3>
              <p className="text-white/80">
                Access your boards from any device, anywhere.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative py-6 text-center text-white/60">
        <div className="flex flex-col gap-2">
          <p>Built with Next.js and Tailwind CSS by <a href="https://www.linkedin.com/in/tron-schell-aa0856181/" className="text-blue-500">Tron Schell</a></p>
          <div className="flex justify-center gap-4 text-sm">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
