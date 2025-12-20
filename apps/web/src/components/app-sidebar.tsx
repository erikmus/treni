"use client"

import * as React from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import {
  Calendar,
  ChartLine,
  Dumbbell,
  Home,
  MapPin,
  Settings,
  HelpCircle,
  Search,
  Target,
  Activity,
  Watch,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string | null
    email: string | null
    avatar_url: string | null
  }
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const t = useTranslations()
  
  const navMain = [
    {
      title: t("nav.dashboard"),
      url: "/dashboard",
      icon: Home,
    },
    {
      title: t("nav.trainingPlan"),
      url: "/dashboard/plan",
      icon: Calendar,
    },
    {
      title: t("nav.workouts"),
      url: "/dashboard/workouts",
      icon: Dumbbell,
    },
    {
      title: t("nav.activities"),
      url: "/dashboard/activities",
      icon: Activity,
    },
    {
      title: t("nav.statistics"),
      url: "/dashboard/stats",
      icon: ChartLine,
    },
  ]

  const navSecondary = [
    {
      title: t("nav.settings"),
      url: "/dashboard/settings",
      icon: Settings,
    },
    {
      title: t("common.help"),
      url: "/help",
      icon: HelpCircle,
    },
    {
      title: t("common.search"),
      url: "#",
      icon: Search,
    },
  ]

  const quickActions = [
    {
      name: t("nav.newPlan"),
      url: "/dashboard/plan/new",
      icon: Target,
    },
  ]

  const displayUser = user ? {
    name: user.name || t("common.user"),
    email: user.email || "",
    avatar: user.avatar_url || "",
  } : {
    name: t("common.user"),
    email: "",
    avatar: "",
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/dashboard">
                <div className="relative w-5 h-5">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded rotate-6" />
                  <div className="absolute inset-0.5 bg-sidebar rounded flex items-center justify-center">
                    <span className="text-primary font-bold text-xs">T</span>
                  </div>
                </div>
                <span className="text-base font-semibold">{t("common.appName")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} quickActions={quickActions} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={displayUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
