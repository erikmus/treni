import { redirect } from "next/navigation"
import { Suspense } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { SearchProvider } from "@/components/search/search-provider"
import { StravaWelcome } from "@/components/dashboard/strava-welcome"
import { DistanceUnitWrapper } from "@/components/providers/distance-unit-wrapper"
import { createClient } from "@/lib/supabase/server"
import type { DistanceUnit } from "@/types/database"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // Get distance unit preference with fallback to km
  const distanceUnit = (profile?.distance_unit as DistanceUnit) || "km"

  return (
    <DistanceUnitWrapper unit={distanceUnit}>
      <SearchProvider>
        <SidebarProvider
          style={
            {
              "--sidebar-width": "calc(var(--spacing) * 72)",
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
        >
          <AppSidebar 
            variant="inset" 
            user={{
              name: profile?.full_name || null,
              email: profile?.email || user.email || null,
              avatar_url: profile?.avatar_url || null,
            }}
          />
          <SidebarInset>
            <SiteHeader userName={profile?.full_name || "daar"} locale={profile?.locale || "nl"} />
            <div className="flex flex-1 flex-col">
              <Suspense fallback={null}>
                <StravaWelcome />
              </Suspense>
              <div className="@container/main flex flex-1 flex-col gap-2">
                {children}
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </SearchProvider>
    </DistanceUnitWrapper>
  )
}
