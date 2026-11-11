'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts'

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

const COLORS = ['#60B5FF', '#FF9149', '#FF9898', '#FF90BB', '#80D8C3', '#A19AD3']

const TECHNIQUE_LABELS: Record<string, string> = {
  rsvp: 'RSVP',
  chunk: 'Chunking',
  guided: 'Guided',
  highlight: 'Highlight',
}

export default function StatsCharts({ stats }: { stats: StatsData }) {
  const dailyData = (stats?.dailyStats ?? []).map((d: any) => ({
    ...(d ?? {}),
    date: (d?.date ?? '').substring(5) ?? '', // MM-DD
  }))

  const wpmData = stats?.wpmOverTime ?? []

  const techData = (stats?.techniqueStats ?? []).map((t: any) => ({
    ...(t ?? {}),
    name: TECHNIQUE_LABELS[t?.name ?? ''] ?? t?.name ?? '',
  }))

  const hasDailyData = (dailyData?.length ?? 0) > 0
  const hasWpmData = (wpmData?.length ?? 0) > 0
  const hasTechData = (techData?.length ?? 0) > 0

  if (!hasDailyData && !hasWpmData && !hasTechData) {
    return null
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Words Read Over Time */}
      {hasDailyData && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Words Read (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                    label={{ value: 'Words', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }}
                  />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Area
                    type="monotone"
                    dataKey="wordsRead"
                    stroke="#60B5FF"
                    fill="#60B5FF"
                    fillOpacity={0.2}
                    strokeWidth={2}
                    name="Words Read"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* WPM Over Time */}
      {hasWpmData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">WPM Progression</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={wpmData} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
                  <XAxis
                    dataKey="session"
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                    label={{ value: 'Session', position: 'insideBottom', offset: -15, style: { textAnchor: 'middle', fontSize: 11 } }}
                  />
                  <YAxis
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                    label={{ value: 'WPM', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }}
                  />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="wpm"
                    stroke="#FF9149"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#FF9149' }}
                    name="WPM"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technique Distribution */}
      {hasTechData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Technique Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={techData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="sessions"
                    nameKey="name"
                    label={({ name, percent }: any) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {(techData ?? []).map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % (COLORS?.length ?? 1)] ?? '#60B5FF'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Spent per Day */}
      {hasDailyData && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Daily Reading Time (minutes)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                    label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }}
                  />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Bar
                    dataKey="timeMinutes"
                    fill="#80D8C3"
                    radius={[4, 4, 0, 0]}
                    name="Minutes"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
