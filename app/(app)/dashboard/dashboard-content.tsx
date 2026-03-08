"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, BookOpen, Target, TrendingUp } from "lucide-react"
import type { Subject, StudySession } from "@/lib/types"
import { FOCUS_LEVEL_LABELS } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

interface DashboardContentProps {
  subjects: Subject[]
  todaySessions: StudySession[]
  weekSessions: StudySession[]
  recentSessions: StudySession[]
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

export function DashboardContent({
  subjects,
  todaySessions,
  weekSessions,
  recentSessions,
}: DashboardContentProps) {
  const todayMinutes = todaySessions.reduce((acc, s) => acc + getSessionDurationMinutes(s), 0)
  const weekMinutes = weekSessions.reduce((acc, s) => acc + getSessionDurationMinutes(s), 0)
  const avgMinutesPerDay = weekSessions.length > 0 ? Math.round(weekMinutes / 7) : 0

  // Group week sessions by subject
  const subjectStats = weekSessions.reduce((acc, session) => {
    const subjectName = session.subject
    if (subjectName) {
      if (!acc[subjectName]) {
        acc[subjectName] = { name: subjectName, minutes: 0, count: 0 }
      }
      acc[subjectName].minutes += getSessionDurationMinutes(session)
      acc[subjectName].count += 1
    }
    return acc
  }, {} as Record<string, { name: string; minutes: number; count: number }>)

  const topSubjects = Object.values(subjectStats)
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 5)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here&apos;s your study overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{formatMinutes(todayMinutes)}</div>
            <p className="text-xs text-muted-foreground">{todaySessions.length} sessions</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{formatMinutes(weekMinutes)}</div>
            <p className="text-xs text-muted-foreground">{weekSessions.length} sessions</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Daily Average</CardTitle>
            <Target className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{formatMinutes(avgMinutesPerDay)}</div>
            <p className="text-xs text-muted-foreground">per day this week</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{subjects.length}</div>
            <p className="text-xs text-muted-foreground">active subjects</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Sessions */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sessions yet. Start studying!</p>
            ) : (
              <div className="space-y-4">
                {recentSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-primary" />
                      <div>
                        <p className="text-sm font-medium text-card-foreground">
                          {session.subject}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(session.start_time), { addSuffix: true })}
                          {" · "}
                          {FOCUS_LEVEL_LABELS[session.focus_level]} focus
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-card-foreground">
                      {formatMinutes(getSessionDurationMinutes(session))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Subjects This Week */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Top Subjects This Week</CardTitle>
          </CardHeader>
          <CardContent>
            {topSubjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No study data this week.</p>
            ) : (
              <div className="space-y-4">
                {topSubjects.map(({ name, minutes, count }, index) => {
                  const maxMinutes = topSubjects[0]?.minutes || 1
                  const percentage = (minutes / maxMinutes) * 100
                  // Use chart colors for visual variety
                  const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]
                  const color = colors[index % colors.length]
                  return (
                    <div key={name}>
                      <div className="mb-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-sm font-medium text-card-foreground">{name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatMinutes(minutes)} ({count} sessions)
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${percentage}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
