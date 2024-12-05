import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 md:p-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Simple Kanban Boards
          </h1>
          <p className="text-lg md:text-xl mb-8 text-gray-600 dark:text-gray-300">
            Create and share Kanban boards instantly. No sign-up required.
            Collaborate with anyone, anywhere.
          </p>
          
          <Link 
            href="/board/new"
            className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 4v16m8-8H4" 
              />
            </svg>
            Create New Board
          </Link>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-semibold mb-3">No Sign-up Required</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Start organizing instantly. Create a board and share the link.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-semibold mb-3">Real-time Updates</h3>
              <p className="text-gray-600 dark:text-gray-300">
                See changes instantly as you and your team collaborate.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-semibold mb-3">Mobile Friendly</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Access your boards from any device, anywhere.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-600 dark:text-gray-300">
        <p>Built with Next.js and Tailwind CSS</p>
      </footer>
    </div>
  );
}
