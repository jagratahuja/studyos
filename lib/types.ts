export interface Subject {
  id: string
  name: string
  created_at: string
}

export type FocusLevel = 1 | 2 | 3 | 4 | 5

export const FOCUS_LEVEL_LABELS: Record<FocusLevel, string> = {
  1: "Extremely Low",
  2: "Low",
  3: "Medium",
  4: "High",
  5: "Extremely High",
}

export interface StudySession {
  id: string
  subject: string
  start_time: string
  end_time: string
  focus_level: FocusLevel
  tasks_planned: number
  tasks_completed: number
  efficiency_score: number | null
  created_at: string
  subjects?: Subject
}

export interface DailyStats {
  date: string
  total_minutes: number
  session_count: number
}

export interface SubjectStats {
  subject: string
  total_minutes: number
  session_count: number
}
