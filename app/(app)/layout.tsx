import { AppSidebar } from "@/components/app-sidebar"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="ml-64 flex-1 bg-background">
        {children}
      </main>
    </div>
  )
}
