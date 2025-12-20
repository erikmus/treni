"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { PlusCircle, type LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export function NavMain({
  items,
  quickActions,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
  }[]
  quickActions?: {
    name: string
    url: string
    icon?: LucideIcon
  }[]
}) {
  const pathname = usePathname()
  const primaryAction = quickActions?.[0]

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {primaryAction && (
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              <SidebarMenuButton
                asChild
                tooltip={primaryAction.name}
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
              >
                <Link href={primaryAction.url}>
                  <PlusCircle className="h-4 w-4" />
                  <span>{primaryAction.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url || 
              (item.url !== "/dashboard" && pathname.startsWith(item.url))
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  tooltip={item.title}
                  className={cn(
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                >
                  <Link href={item.url}>
                    {item.icon && <item.icon className="h-4 w-4" />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
