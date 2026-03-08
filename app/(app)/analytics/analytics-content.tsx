"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, AreaChart, Area, ResponsiveContainer } from "recharts"
import type { Subject, StudySession } from "@/lib/types"
import { FOCUS_LEVEL_LABELS } from "@/lib/types"
import { format, parseISO, eachDayOfInterval, subDays } from "date-fns"

interface AnalyticsContentProps {
  subjects: Subject[]
  sessions: StudySession[]
}

function getSessionDurationMinutes(session: StudySession): number {
  const start = new Date(session.start_time)
  const end = new Date(session.end_time)
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60))
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

export function AnalyticsContent({ subjects, sessions }: AnalyticsContentProps) {
  // Calculate daily study data for last 30 days
  const today = new Date()
  const thirtyDaysAgo = subDays(today, 29)
  const allDays = eachDayOfInterval({ start: thirtyDaysAgo, end: today })

  const dailyData = allDays.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd")
    const daySessions = sessions.filter(
      (s) => format(parseISO(s.start_time), "yyyy-MM-dd") === dayStr
    )
    const totalMinutes = daySessions.reduce((acc, s) => acc + getSessionDurationMinutes(s), 0)
    return {
      date: format(day, "MMM d"),
      minutes: totalMinutes,
      hours: Math.round(totalMinutes / 60 * 10) / 10,
    }
  })

  // Calculate subject distribution
  const subjectMap: Record<string, { name: string; minutes: number; sessions: number }> = {}
  sessions.forEach((session) => {
    if (!subjectMap[session.subject]) {
      subjectMap[session.subject] = { name: session.subject, minutes: 0, sessions: 0 }
    }
    subjectMap[session.subject].minutes += getSessionDurationMinutes(session)
    subjectMap[session.subject].sessions += 1
  })

  const subjectData = Object.values(subjectMap)
    .filter((s) => s.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes)
    .map((s, i) => ({ ...s, color: CHART_COLORS[i % CHART_COLORS.length] }))

  // Calculate weekly comparison
  const thisWeekStart = subDays(today, 6)
  const lastWeekStart = subDays(today, 13)
  const lastWeekEnd = subDays(today, 7)

  const thisWeekSessions = sessions.filter(
    (s) => parseISO(s.start_time) >= thisWeekStart
  )
  const lastWeekSessions = sessions.filter(
    (s) => parseISO(s.start_time) >= lastWeekStart && parseISO(s.start_time) < lastWeekEnd
  )

  const thisWeekMinutes = thisWeekSessions.reduce((acc, s) => acc + getSessionDurationMinutes(s), 0)
  const lastWeekMinutes = lastWeekSessions.reduce((acc, s) => acc + getSessionDurationMinutes(s), 0)
  const weekChange = lastWeekMinutes > 0 
    ? Math.round(((thisWeekMinutes - lastWeekMinutes) / lastWeekMinutes) * 100)
    : thisWeekMinutes > 0 ? 100 : 0

  // Calculate focus level distribution
  const focusData = sessions.reduce((acc, session) => {
    const label = FOCUS_LEVEL_LABELS[session.focus_level]
    if (!acc[label]) {
      acc[label] = { level: label, count: 0, minutes: 0 }
    }
    acc[label].count += 1
    acc[label].minutes += getSessionDurationMinutes(session)
    return acc
  }, {} as Record<string, { level: string; count: number; minutes: number }>)

  const avgFocusLevel = sessions.length > 0
    ? (sessions.reduce((acc, s) => acc + s.focus_level, 0) / sessions.length).toFixed(1)
    : "0"

  // Total stats
  const totalMinutes = sessions.reduce((acc, s) => acc + getSessionDurationMinutes(s), 0)
  const totalSessions = sessions.length
  const avgSessionLength = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0

  // Task completion stats
  const totalTasksPlanned = sessions.reduce((acc, s) => acc + s.tasks_planned, 0)
  const totalTasksCompleted = sessions.reduce((acc, s) => acc + s.tasks_completed, 0)
  const taskCompletionRate = totalTasksPlanned > 0
    ? Math.round((totalTasksCompleted / totalTasksPlanned) * 100)
    : 0

  const chartConfig = {
    minutes: {
      label: "Study Time",
      color: "var(--chart-1)",
    },
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Analyze your study patterns from the last 30 days.</p>
      </div>

      {/* Summary Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Study Time</p>
            <p className="text-2xl font-bold text-card-foreground">{formatMinutes(totalMinutes)}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Sessions</p>
            <p className="text-2xl font-bold text-card-foreground">{totalSessions}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg Session Length</p>
            <p className="text-2xl font-bold text-card-foreground">{formatMinutes(avgSessionLength)}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg Focus Level</p>
            <p className="text-2xl font-bold text-card-foreground">{avgFocusLevel}/5</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Task Completion</p>
            <p className="text-2xl font-bold text-card-foreground">{taskCompletionRate}%</p>
            <p className="text-xs text-muted-foreground">{totalTasksCompleted}/{totalTasksPlanned} tasks</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Study Trend */}
        <Card className="border-border bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-card-foreground">Daily Study Time</CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">No study data yet. Start a session to see your trends!</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${Math.round(value / 60)}h`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatMinutes(Number(value))}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="minutes"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    fill="url(#colorMinutes)"
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Subject Distribution Pie Chart */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Subject Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {subjectData.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">No subject data yet.</p>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={subjectData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="minutes"
                    >
                      {subjectData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4">
                  {subjectData.map((subject) => (
                    <div key={subject.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: subject.color }}
                      />
                      <span className="text-sm text-card-foreground">{subject.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subject Breakdown Bar Chart */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Hours by Subject</CardTitle>
          </CardHeader>
          <CardContent>
            {subjectData.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">No subject data yet.</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <BarChart data={subjectData} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <XAxis type="number" tickFormatter={(value) => `${Math.round(value / 60)}h`} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatMinutes(Number(value))}
                      />
                    }
                  />
                  <Bar dataKey="minutes" radius={[0, 4, 4, 0]}>
                    {subjectData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
