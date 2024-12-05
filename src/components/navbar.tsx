'use client'

import { useState } from 'react'
import { Copy, Check, X, Menu, Home, Calendar, Clock, Settings, LinkIcon } from 'lucide-react'
import Link from 'next/link'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NavbarProps {
  boardId?: string
}

const mainNav = [

]

export default function Navbar({ boardId }: NavbarProps) {
  const [copied, setCopied] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  
  const url = boardId ? `${window.location.origin}/board?id=${boardId}` : ''
  const compactUrl = url ? url.replace(/^https?:\/\//, '').slice(0, 30) + '...' : ''

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
      <div className="container mx-auto">
        <div className="mx-4 my-2 flex h-12 items-center rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden ml-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:w-[280px]">
              <div className="flex flex-col gap-4">
                <Link 
                  href="/"
                  className="flex items-center gap-2 text-lg font-semibold"
                >
                  KanbanThing
                </Link>
                <nav className="flex flex-col gap-2">
                  {mainNav.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 text-sm font-medium text-muted-foreground rounded-lg hover:text-primary hover:bg-accent px-3 py-2 transition-colors",
                        item.href === '/board' && "text-primary bg-accent"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </Link>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo/Brand */}
          <Link 
            href="/"
            className="mx-4 flex items-center gap-2 text-lg font-semibold"
          >
            KanbanThing
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {mainNav.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium text-muted-foreground rounded-lg hover:text-primary hover:bg-accent px-3 py-2 transition-colors",
                  item.href === '/board' && "text-primary bg-accent"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            ))}
          </nav>

          {/* Share Section */}
          {boardId && (
            <div className="flex items-center gap-2 mr-2">
              {isExpanded ? (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
                  <div className="relative group">
                    <input
                      type="text"
                      value={url}
                      readOnly
                      className="w-[240px] text-sm bg-background/50 dark:bg-gray-900/50 px-2 py-1.5 rounded-lg border border-gray-200/50 dark:border-gray-700/50 pr-8"
                      onClick={(e) => e.currentTarget.select()}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleCopy}
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsExpanded(false)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setIsExpanded(true)}
                  className="gap-2 rounded-lg bg-white/50 dark:bg-gray-800/50"
                >
                  <LinkIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">{compactUrl}</span>
                  <span className="sm:hidden">Share</span>
                </Button>
              )}
            </div>
          )}
        </div>
    </div>
  )
}