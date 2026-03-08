"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Play, Pause, Square, Save, Clock, PenLine, AlertTriangle, CheckCircle } from "lucide-react"
import type { Subject, FocusLevel } from "@/lib/types"
import { FOCUS_LEVEL_LABELS } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface StudySessionContentProps {
  subjects: Subject[]
}

type TimerState = "idle" | "running" | "paused"

export function StudySessionContent({ subjects }: StudySessionContentProps) {
  const router = useRouter()
  
  // Timer mode state
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [timerState, setTimerState] = useState<TimerState>("idle")
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [startedAt, setStartedAt] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [timerFocusLevel, setTimerFocusLevel] = useState<FocusLevel>(3)
  const [timerTasksPlanned, setTimerTasksPlanned] = useState(0)
  const [timerTasksCompleted, setTimerTasksCompleted] = useState(0)

  // Manual entry state
  const [manualSubject, setManualSubject] = useState<string>("")
  const [manualStartTime, setManualStartTime] = useState("")
  const [manualEndTime, setManualEndTime] = useState("")
  const [manualFocusLevel, setManualFocusLevel] = useState<FocusLevel>(3)
  const [manualTasksPlanned, setManualTasksPlanned] = useState(0)
  const [manualTasksCompleted, setManualTasksCompleted] = useState(0)
  const [manualError, setManualError] = useState<string | null>(null)
  const [manualWarning, setManualWarning] = useState<string | null>(null)
  const [manualSuccess, setManualSuccess] = useState(false)
  const [isManualSaving, setIsManualSaving] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (timerState === "running") {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerState])

  const formatTime = useCallback((seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }, [])

  const handleStart = () => {
    if (!selectedSubject) return
    setStartedAt(new Date())
    setTimerState("running")
  }

  const handlePause = () => {
    setTimerState("paused")
  }

  const handleResume = () => {
    setTimerState("running")
  }

  const handleStop = async () => {
    if (elapsedSeconds < 60) {
      resetSession()
      return
    }
    await saveTimerSession()
  }

  const saveTimerSession = async () => {
    if (!startedAt || !selectedSubject) return

    setIsSaving(true)
    const supabase = createClient()
    const endedAt = new Date()

    const efficiencyScore = timerTasksPlanned > 0 
      ? Math.round((timerTasksCompleted / timerTasksPlanned) * 100) 
      : 0

    const { error } = await supabase.from("study_sessions").insert({
      subject: selectedSubject,
      start_time: startedAt.toISOString(),
      end_time: endedAt.toISOString(),
      focus_level: timerFocusLevel,
      tasks_planned: timerTasksPlanned,
      tasks_completed: timerTasksCompleted,
      efficiency_score: efficiencyScore,
    })

    setIsSaving(false)

    if (error) {
      console.error("Error saving session:", error)
      return
    }

    resetSession()
    router.refresh()
  }

  const resetSession = () => {
    setTimerState("idle")
    setElapsedSeconds(0)
    setStartedAt(null)
    setTimerFocusLevel(3)
    setTimerTasksPlanned(0)
    setTimerTasksCompleted(0)
  }

  // Manual entry handlers
  const validateManualEntry = (): boolean => {
    setManualError(null)
    setManualWarning(null)

    if (!manualSubject) {
      setManualError("Please select a subject.")
      return false
    }

    if (!manualStartTime || !manualEndTime) {
      setManualError("Please enter both start and end times.")
      return false
    }

    const start = new Date(manualStartTime)
    const end = new Date(manualEndTime)

    if (end <= start) {
      setManualError("End time must be after start time.")
      return false
    }

    if (manualTasksPlanned < 0) {
      setManualError("Tasks planned must be 0 or greater.")
      return false
    }

    if (manualTasksCompleted < 0) {
      setManualError("Tasks completed must be 0 or greater.")
      return false
    }

    // Check if session is longer than 6 hours
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    if (durationHours > 6) {
      setManualWarning("This session is longer than 6 hours. Please confirm the entry is correct.")
    }

    return true
  }

  const handleManualSubmit = async () => {
    if (!validateManualEntry()) return

    setIsManualSaving(true)
    setManualSuccess(false)
    
    const supabase = createClient()
    const start = new Date(manualStartTime)
    const end = new Date(manualEndTime)
    
    const efficiencyScore = manualTasksPlanned > 0 
      ? Math.round((manualTasksCompleted / manualTasksPlanned) * 100) 
      : 0

    const { error } = await supabase.from("study_sessions").insert({
      subject: manualSubject,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      focus_level: manualFocusLevel,
      tasks_planned: manualTasksPlanned,
      tasks_completed: manualTasksCompleted,
      efficiency_score: efficiencyScore,
    })

    setIsManualSaving(false)

    if (error) {
      console.error("Error saving manual session:", error)
      setManualError("Failed to save session. Please try again.")
      return
    }

    // Reset form
    setManualSubject("")
    setManualStartTime("")
    setManualEndTime("")
    setManualFocusLevel(3)
    setManualTasksPlanned(0)
    setManualTasksCompleted(0)
    setManualWarning(null)
    setManualSuccess(true)
    
    router.refresh()

    // Hide success message after 3 seconds
    setTimeout(() => setManualSuccess(false), 3000)
  }

  const selectedSubjectData = subjects.find((s) => s.name === selectedSubject)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Study Session</h1>
        <p className="text-muted-foreground">Start a focused study session or log a completed one.</p>
      </div>

      <div className="mx-auto max-w-2xl">
        <Tabs defaultValue="timer" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-2">
            <TabsTrigger value="timer" className="gap-2">
              <Clock className="h-4 w-4" />
              Timer Mode
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <PenLine className="h-4 w-4" />
              Manual Entry
            </TabsTrigger>
          </TabsList>

          {/* Timer Mode */}
          <TabsContent value="timer">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-center text-card-foreground">Focus Timer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Subject Selection */}
                <div className="space-y-2">
                  <Label className="text-card-foreground">Subject</Label>
                  <Select
                    value={selectedSubject}
                    onValueChange={setSelectedSubject}
                    disabled={timerState !== "idle"}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.name}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Timer Display */}
                <div className="flex flex-col items-center">
                  {selectedSubjectData && (
                    <div className="mb-4">
                      <span className="text-lg font-medium text-card-foreground">
                        {selectedSubjectData.name}
                      </span>
                    </div>
                  )}
                  <div
                    className="mb-8 font-mono text-7xl font-bold tabular-nums tracking-tight text-foreground"
                    style={{
                      color: timerState === "running" ? "var(--primary)" : undefined,
                    }}
                  >
                    {formatTime(elapsedSeconds)}
                  </div>

                  {/* Timer Controls */}
                  <div className="flex gap-4">
                    {timerState === "idle" && (
                      <Button
                        size="lg"
                        onClick={handleStart}
                        disabled={!selectedSubject}
                        className="gap-2"
                      >
                        <Play className="h-5 w-5" />
                        Start Session
                      </Button>
                    )}

                    {timerState === "running" && (
                      <>
                        <Button size="lg" variant="secondary" onClick={handlePause} className="gap-2">
                          <Pause className="h-5 w-5" />
                          Pause
                        </Button>
                        <Button size="lg" variant="destructive" onClick={handleStop} className="gap-2">
                          <Square className="h-5 w-5" />
                          Stop
                        </Button>
                      </>
                    )}

                    {timerState === "paused" && (
                      <>
                        <Button size="lg" onClick={handleResume} className="gap-2">
                          <Play className="h-5 w-5" />
                          Resume
                        </Button>
                        <Button
                          size="lg"
                          variant="secondary"
                          onClick={handleStop}
                          disabled={isSaving}
                          className="gap-2"
                        >
                          <Save className="h-5 w-5" />
                          {isSaving ? "Saving..." : "Save & End"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Session Details (shown when timer is active or paused) */}
                {timerState !== "idle" && (
                  <div className="space-y-4 rounded-lg border border-border bg-secondary/50 p-4">
                    <h3 className="text-sm font-medium text-card-foreground">Session Details</h3>
                    
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Focus Level</Label>
                        <Select
                          value={String(timerFocusLevel)}
                          onValueChange={(v) => setTimerFocusLevel(Number(v) as FocusLevel)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {([1, 2, 3, 4, 5] as FocusLevel[]).map((level) => (
                              <SelectItem key={level} value={String(level)}>
                                {FOCUS_LEVEL_LABELS[level]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Tasks Planned</Label>
                        <Input
                          type="number"
                          min={0}
                          value={timerTasksPlanned}
                          onChange={(e) => setTimerTasksPlanned(Math.max(0, parseInt(e.target.value) || 0))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Tasks Completed</Label>
                        <Input
                          type="number"
                          min={0}
                          value={timerTasksCompleted}
                          onChange={(e) => setTimerTasksCompleted(Math.max(0, parseInt(e.target.value) || 0))}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Session Info */}
                {elapsedSeconds > 0 && (
                  <div className="rounded-lg bg-secondary p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      You&apos;ve been studying for{" "}
                      <span className="font-medium text-card-foreground">
                        {Math.floor(elapsedSeconds / 60)} minutes
                      </span>
                    </p>
                    {elapsedSeconds >= 1500 && (
                      <p className="mt-1 text-xs text-primary">Great focus! Keep it up!</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manual Entry Mode */}
          <TabsContent value="manual">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-center text-card-foreground">Log Completed Session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Success Message */}
                {manualSuccess && (
                  <div className="flex items-center gap-2 rounded-lg bg-success/10 p-4 text-success">
                    <CheckCircle className="h-5 w-5" />
                    <span>Study session logged successfully.</span>
                  </div>
                )}

                {/* Error Message */}
                {manualError && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-4 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    <span>{manualError}</span>
                  </div>
                )}

                {/* Warning Message */}
                {manualWarning && !manualError && (
                  <div className="flex items-center gap-2 rounded-lg bg-warning/10 p-4 text-warning">
                    <AlertTriangle className="h-5 w-5" />
                    <span>{manualWarning}</span>
                  </div>
                )}

                {/* Subject Selection */}
                <div className="space-y-2">
                  <Label className="text-card-foreground">Subject</Label>
                  <Select value={manualSubject} onValueChange={setManualSubject}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.name}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Time Selection */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-card-foreground">Start Time</Label>
                    <Input
                      type="datetime-local"
                      value={manualStartTime}
                      onChange={(e) => setManualStartTime(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-card-foreground">End Time</Label>
                    <Input
                      type="datetime-local"
                      value={manualEndTime}
                      onChange={(e) => setManualEndTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* Focus Level */}
                <div className="space-y-2">
                  <Label className="text-card-foreground">Focus Level</Label>
                  <Select
                    value={String(manualFocusLevel)}
                    onValueChange={(v) => setManualFocusLevel(Number(v) as FocusLevel)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {([1, 2, 3, 4, 5] as FocusLevel[]).map((level) => (
                        <SelectItem key={level} value={String(level)}>
                          {FOCUS_LEVEL_LABELS[level]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tasks */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-card-foreground">Tasks Planned</Label>
                    <Input
                      type="number"
                      min={0}
                      value={manualTasksPlanned}
                      onChange={(e) => setManualTasksPlanned(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-card-foreground">Tasks Completed</Label>
                    <Input
                      type="number"
                      min={0}
                      value={manualTasksCompleted}
                      onChange={(e) => setManualTasksCompleted(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Duration Preview */}
                {manualStartTime && manualEndTime && (
                  <div className="rounded-lg bg-secondary p-4 text-center">
                    {(() => {
                      const start = new Date(manualStartTime)
                      const end = new Date(manualEndTime)
                      if (end > start) {
                        const durationMs = end.getTime() - start.getTime()
                        const hours = Math.floor(durationMs / (1000 * 60 * 60))
                        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
                        return (
                          <p className="text-sm text-muted-foreground">
                            Session duration:{" "}
                            <span className="font-medium text-card-foreground">
                              {hours > 0 ? `${hours}h ` : ""}{minutes}m
                            </span>
                          </p>
                        )
                      }
                      return null
                    })()}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={handleManualSubmit}
                  disabled={isManualSaving}
                >
                  <Save className="h-5 w-5" />
                  {isManualSaving ? "Saving..." : "Log Session"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
