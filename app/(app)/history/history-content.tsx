"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2, Calendar, Clock } from "lucide-react"
import type { Subject, StudySession } from "@/lib/types"
import { FOCUS_LEVEL_LABELS } from "@/lib/types"
import { format, parseISO } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface HistoryContentProps {
  subjects: Subject[]
  initialSessions: StudySession[]
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

export function HistoryContent({ subjects, initialSessions }: HistoryContentProps) {
  const router = useRouter()
  const [sessions, setSessions] = useState(initialSessions)
  const [subjectFilter, setSubjectFilter] = useState<string>("all")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filteredSessions = subjectFilter === "all"
    ? sessions
    : sessions.filter((s) => s.subject === subjectFilter)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const supabase = createClient()

    const { error } = await supabase
      .from("study_sessions")
      .delete()
      .eq("id", id)

    setDeletingId(null)

    if (error) {
      console.error("Error deleting session:", error)
      return
    }

    setSessions((prev) => prev.filter((s) => s.id !== id))
    router.refresh()
  }

  // Group sessions by date
  const groupedSessions = filteredSessions.reduce((acc, session) => {
    const date = format(parseISO(session.start_time), "yyyy-MM-dd")
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(session)
    return acc
  }, {} as Record<string, StudySession[]>)

  const sortedDates = Object.keys(groupedSessions).sort((a, b) => b.localeCompare(a))

  // Get unique subjects from sessions
  const uniqueSubjects = [...new Set(sessions.map((s) => s.subject))]

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">History</h1>
          <p className="text-muted-foreground">View and manage your study session history.</p>
        </div>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {uniqueSubjects.map((subjectName) => (
              <SelectItem key={subjectName} value={subjectName}>
                {subjectName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredSessions.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No study sessions found. Start studying to build your history!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => {
            const daySessions = groupedSessions[date]
            const totalMinutes = daySessions.reduce((acc, s) => acc + getSessionDurationMinutes(s), 0)

            return (
              <Card key={date} className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-card-foreground">
                      {format(parseISO(date), "EEEE, MMMM d, yyyy")}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {formatMinutes(totalMinutes)} total
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Focus</TableHead>
                        <TableHead>Tasks</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {daySessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full bg-primary" />
                              <span className="font-medium">{session.subject}</span>
                            </div>
                          </TableCell>
                          <TableCell>{formatMinutes(getSessionDurationMinutes(session))}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(parseISO(session.start_time), "h:mm a")}
                            {" - "}
                            {format(parseISO(session.end_time), "h:mm a")}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {FOCUS_LEVEL_LABELS[session.focus_level]}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {session.tasks_completed}/{session.tasks_planned}
                          </TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Session</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this study session? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(session.id)}
                                    disabled={deletingId === session.id}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {deletingId === session.id ? "Deleting..." : "Delete"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
