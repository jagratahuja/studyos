import { createClient } from "@/lib/supabase/server"
import { SettingsContent } from "./settings-content"

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: subjects } = await supabase
    .from("subjects")
    .select("*")
    .order("name")

  return <SettingsContent initialSubjects={subjects || []} />
}
