import { createClient } from "@/lib/supabase/server"
import { AnalyticsContent } from "./analytics-content"

export default async function AnalyticsPage() {
  const supabase = await createClient()
  
  // Get last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Fetch subjects
  const { data: subjects } = await supabase
    .from("subjects")
    .select("*")
    .order("name")

  // Fetch sessions from last 30 days
  const { data: sessions } = await supabase
    .from("study_sessions")
    .select("*")
    .gte("start_time", thirtyDaysAgo.toISOString())
    .order("start_time", { ascending: true })

  return (
    <AnalyticsContent
      subjects={subjects || []}
      sessions={sessions || []}
    />
  )
}
