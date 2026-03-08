import { createClient } from "@/lib/supabase/server"
import { HistoryContent } from "./history-content"

export default async function HistoryPage() {
  const supabase = await createClient()

  // Fetch subjects
  const { data: subjects } = await supabase
    .from("subjects")
    .select("*")
    .order("name")

  // Fetch all sessions (most recent first)
  const { data: sessions } = await supabase
    .from("study_sessions")
    .select("*")
    .order("start_time", { ascending: false })
    .limit(100)

  return (
    <HistoryContent
      subjects={subjects || []}
      initialSessions={sessions || []}
    />
  )
}
