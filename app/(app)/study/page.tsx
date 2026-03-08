import { createClient } from "@/lib/supabase/server"
import { StudySessionContent } from "./study-session-content"

export default async function StudyPage() {
  const supabase = await createClient()
  
  const { data: subjects } = await supabase
    .from("subjects")
    .select("*")
    .order("name")

  return <StudySessionContent subjects={subjects || []} />
}
