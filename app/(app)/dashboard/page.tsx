import { createClient } from "@/lib/supabase/server"
import { DashboardContent } from "./dashboard-content"

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Get today's date range
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Get this week's date range
  const weekStart = new Date(today)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())

  // Fetch subjects
  const { data: subjects } = await supabase
    .from("subjects")
    .select("*")
    .order("name")

  // Fetch today's sessions
  const { data: todaySessions } = await supabase
    .from("study_sessions")
    .select("*")
    .gte("start_time", today.toISOString())
    .lt("start_time", tomorrow.toISOString())
    .order("start_time", { ascending: false })

  // Fetch this week's sessions
  const { data: weekSessions } = await supabase
    .from("study_sessions")
    .select("*")
    .gte("start_time", weekStart.toISOString())
    .order("start_time", { ascending: false })

  // Fetch recent sessions
  const { data: recentSessions } = await supabase
    .from("study_sessions")
    .select("*")
    .order("start_time", { ascending: false })
    .limit(5)

  return (
    <DashboardContent
      subjects={subjects || []}
      todaySessions={todaySessions || []}
      weekSessions={weekSessions || []}
      recentSessions={recentSessions || []}
    />
  )
}
