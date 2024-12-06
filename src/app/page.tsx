import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { UserOnboarding } from "@/components";
import { GradientBackground } from "@/components/ui/gradient-background";
import { PreviewCard } from "@/components/ui/preview-card";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-950 overflow-x-hidden">
      <GradientBackground />

      {/* Hero Section */}
      <main className="relative flex-1 flex flex-col p-4 md:p-20">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl md:text-8xl font-bold text-white mb-6 md:mb-8 tracking-tight">
            KanbanThing
          </h1>
          <p className="text-lg md:text-2xl text-white/90 mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed px-2">
            Built to make you extraordinarily productive.
            <br className="hidden sm:block" />
            The easiest way to organize your work.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center px-1">
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 text-base md:text-lg font-medium text-gray-900 bg-white rounded-xl hover:bg-white/90 transition-colors shadow-lg backdrop-blur-sm"
            >
              Create New Board
              <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
            </Link>
          </div>

          {/* App Preview */}
          <div className="mt-8 sm:mt-20 relative px-1">
            <PreviewCard>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl" />
              <div className="relative bg-gray-900/40 backdrop-blur border border-white/10 rounded-2xl p-2 sm:p-4 shadow-2xl">
                {/* Window Controls */}
                <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-4 px-2 sm:px-1">
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
                        <div className="text-white/80 text-xs sm:text-sm font-medium mb-2 sm:mb-3">
                          To Do
                        </div>
                        <div className="space-y-1 sm:space-y-2">
                          <div className="bg-gray-800/70 p-1.5 sm:p-2 rounded-md">
                            <div className="h-1.5 sm:h-2 bg-purple-400/30 w-12 rounded mb-1 sm:mb-2" />
                            <div className="h-2 sm:h-3 bg-gray-600/50 w-2/3 rounded" />
                          </div>
                        </div>
                      </div>

                      {/* In Progress Column */}
                      <div className="flex-1 bg-gray-700/50 rounded-lg p-2 sm:p-3">
                        <div className="text-white/80 text-xs sm:text-sm font-medium mb-2 sm:mb-3">
                          In Progress
                        </div>
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
                        <div className="text-white/80 text-xs sm:text-sm font-medium mb-2 sm:mb-3">
                          Done
                        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mt-12 md:mt-20 px-1">
            {/* No Sign-up Card */}
            <div className="group relative overflow-hidden p-6 rounded-2xl bg-gray-900/40 backdrop-blur border border-white/10 transition-all duration-300 hover:bg-gray-900/50 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    No Sign-up Required
                  </h3>
                </div>
                <p className="text-white/80 text-sm leading-relaxed text-left">
                  Start organizing instantly. Create a board and share the link
                  with your team. No email required.
                </p>
              </div>
            </div>
            {/* Always Free Card */}
            <div className="group relative overflow-hidden p-6 rounded-2xl bg-gray-900/40 backdrop-blur border border-white/10 transition-all duration-300 hover:bg-gray-900/50 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    Always Free
                  </h3>
                </div>
                <p className="text-white/80 text-sm leading-relaxed text-left">
                  KanbanThing is completely free to use and will always remain
                  free.
                </p>
              </div>
            </div>
            {/* Board Lifespan Card */}
            <div className="group relative overflow-hidden p-6 rounded-2xl bg-gray-900/40 backdrop-blur border border-white/10 transition-all duration-300 hover:bg-gray-900/50 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    Board Lifespan
                  </h3>
                </div>
                <p className="text-white/80 text-sm leading-relaxed text-left">
                  Boards automatically expire after 2 months, keeping your
                  workspace clean and focused on active projects.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative py-4 md:py-6 text-center text-white/60 px-1">
        <div className="flex flex-col gap-2">
          <p>
            Built by{" "}
            <a
              href="https://www.linkedin.com/in/tron-schell-aa0856181/"
              className="text-blue-500"
            >
              Tron Schell
            </a>
          </p>
          <div className="flex justify-center gap-4 text-sm">
            <Link href="/about" className="hover:text-white transition-colors">
              About
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link
              href="/privacy"
              className="hover:text-white transition-colors"
            >
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
