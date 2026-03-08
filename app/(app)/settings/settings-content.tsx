"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Plus, Trash2, BookOpen } from "lucide-react"
import type { Subject } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface SettingsContentProps {
  initialSubjects: Subject[]
}

export function SettingsContent({ initialSubjects }: SettingsContentProps) {
  const router = useRouter()
  const [subjects, setSubjects] = useState(initialSubjects)
  const [newSubjectName, setNewSubjectName] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return

    setIsAdding(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("subjects")
      .insert({
        name: newSubjectName.trim(),
      })
      .select()
      .single()

    setIsAdding(false)

    if (error) {
      console.error("Error adding subject:", error)
      return
    }

    setSubjects((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    setNewSubjectName("")
    router.refresh()
  }

  const handleDeleteSubject = async (id: string) => {
    setDeletingId(id)
    const supabase = createClient()

    const { error } = await supabase
      .from("subjects")
      .delete()
      .eq("id", id)

    setDeletingId(null)

    if (error) {
      console.error("Error deleting subject:", error)
      return
    }

    setSubjects((prev) => prev.filter((s) => s.id !== id))
    router.refresh()
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your subjects and preferences.</p>
      </div>

      <div className="mx-auto max-w-2xl space-y-6">
        {/* Add New Subject */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Add New Subject</CardTitle>
            <CardDescription>Create a new subject to track your study sessions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="subject-name">Subject Name</Label>
                <Input
                  id="subject-name"
                  placeholder="e.g., Mathematics"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSubject()}
                />
              </div>
              <Button
                onClick={handleAddSubject}
                disabled={!newSubjectName.trim() || isAdding}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {isAdding ? "Adding..." : "Add Subject"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Existing Subjects */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Your Subjects</CardTitle>
            <CardDescription>Manage your existing subjects.</CardDescription>
          </CardHeader>
          <CardContent>
            {subjects.length === 0 ? (
              <p className="text-center text-muted-foreground">No subjects yet. Add one above!</p>
            ) : (
              <div className="space-y-3">
                {subjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <span className="font-medium text-card-foreground">{subject.name}</span>
                    </div>
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
                          <AlertDialogTitle>Delete Subject</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;{subject.name}&quot;? This will not delete existing study sessions for this subject.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteSubject(subject.id)}
                            disabled={deletingId === subject.id}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deletingId === subject.id ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* App Info */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">About StudyOS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>StudyOS is a personal study analytics system to help you track and optimize your learning.</p>
            <p>Version 1.1.0 - Now with Manual Entry Mode</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
