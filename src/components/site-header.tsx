"use client"

import { useTranslations } from "next-intl"
import { Search } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { NotificationsDropdown } from "@/components/notifications"

interface SiteHeaderProps {
  userName?: string
  locale?: string
}

export function SiteHeader({ userName = "", locale = "nl" }: SiteHeaderProps) {
  const t = useTranslations()

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">
          {t("dashboard.welcome", { name: userName })}
        </h1>
        <div className="ml-auto flex items-center gap-2">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t("common.searchPlaceholder")}
              className="pl-8 w-48 lg:w-64"
            />
          </div>
          
          {/* Notifications */}
          <NotificationsDropdown locale={locale} />
        </div>
      </div>
    </header>
  )
}
