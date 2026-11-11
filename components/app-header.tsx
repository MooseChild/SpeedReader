'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Library, BarChart3, Zap, StickyNote, Settings } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

export function AppHeader() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Library', icon: Library },
    { href: '/notes', label: 'Notes', icon: StickyNote },
    { href: '/stats', label: 'Stats', icon: BarChart3 },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-3 sm:px-4">
        <Link href="/" className="flex items-center gap-2 group touch-manipulation">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="h-4 w-4" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">SpeedRead</span>
        </Link>

        <nav className="flex items-center gap-1">
          {(navItems ?? []).map((item: any) => {
            const Icon = item?.icon ?? BookOpen
            const isActive = pathname === item?.href
            return (
              <Link
                key={item?.href ?? ''}
                href={item?.href ?? '/'}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors touch-manipulation min-h-[44px]',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent/80'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item?.label ?? ''}</span>
              </Link>
            )
          })}
          <div className="ml-1 sm:ml-2">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  )
}
