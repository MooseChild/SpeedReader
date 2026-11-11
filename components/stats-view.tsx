'use client'

import { useState, useEffect } from 'react'
import { AppHeader } from '@/components/app-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate'
import { BookOpen, Clock, Zap, BarChart3, FileText, TrendingUp } from 'lucide-react'
import dynamic from 'next/dynamic'

const StatsCharts = dynamic(() => import('@/components/stats-charts'), { ssr: false })

interface StatsData {
  totalSessions: number
  totalWordsRead: number
  totalTimeMinutes: number
  avgWpm: number
  techniqueStats: Array<{
    name: string
    sessions: number
    wordsRead: number
    timeMinutes: number
  }>
  dailyStats: Array<{
    date: string
    wordsRead: number
    timeMinutes: number
    sessions: number
  }>
  wpmOverTime: Array<{
    session: number
    wpm: number
    technique: string
    date: string
  }>
  documentCount: number
}

function AnimatedCounter({ value, suffix }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const target = value ?? 0
    if (target === 0) { setDisplay(0); return }
    const step = Math.max(1, Math.floor(target / 40))
    let current = 0
    const timer = setInterval(() => {
      current += step
      if (current >= target) {
        setDisplay(target)
        clearInterval(timer)
      } else {
        setDisplay(current)
      }
    }, 30)
    return () => clearInterval(timer)
  }, [value])

  return (
    <span className="font-mono text-2xl font-bold tracking-tight">
      {display.toLocaleString()}{suffix ?? ''}
    </span>
  )
}

export function StatsView() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats')
        if (res?.ok) {
          const data = await res.json()
          setStats(data ?? null)
        }
      } catch (e: any) {
        console.error('Failed to fetch stats:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const metricCards = [
    {
      label: 'Total Words Read',
      value: stats?.totalWordsRead ?? 0,
      icon: BookOpen,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Reading Time',
      value: stats?.totalTimeMinutes ?? 0,
      suffix: ' min',
      icon: Clock,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Average WPM',
      value: stats?.avgWpm ?? 0,
      icon: Zap,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Sessions',
      value: stats?.totalSessions ?? 0,
      icon: BarChart3,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Documents',
      value: stats?.documentCount ?? 0,
      icon: FileText,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-[1200px] px-4 py-8">
        <FadeIn>
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Reading <span className="text-primary">Statistics</span>
            </h1>
            <p className="mt-1 text-muted-foreground">
              Track your speed reading progress and performance over time.
            </p>
          </div>
        </FadeIn>

        {/* Metric cards */}
        <Stagger staggerDelay={0.05}>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 mb-8">
            {(metricCards ?? []).map((card: any, i: number) => {
              const Icon = card?.icon ?? TrendingUp
              return (
                <StaggerItem key={card?.label ?? i}>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card?.bgColor ?? ''}`}>
                          <Icon className={`h-4 w-4 ${card?.color ?? ''}`} />
                        </div>
                      </div>
                      <AnimatedCounter value={card?.value ?? 0} suffix={card?.suffix} />
                      <p className="text-xs text-muted-foreground mt-1">{card?.label ?? ''}</p>
                    </CardContent>
                  </Card>
                </StaggerItem>
              )
            })}
          </div>
        </Stagger>

        {/* Charts */}
        {!loading && stats && (
          <FadeIn delay={0.3}>
            <StatsCharts stats={stats} />
          </FadeIn>
        )}

        {!loading && !stats && (
          <FadeIn>
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="font-display text-xl font-semibold">No data yet</h2>
              <p className="text-muted-foreground mt-2">Start reading to see your statistics here.</p>
            </div>
          </FadeIn>
        )}
      </main>
    </div>
  )
}
