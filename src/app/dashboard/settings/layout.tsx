"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { User, Gift, Bell, Link2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const t = useTranslations();

  const settingsTabs: { titleKey: string; href: string; icon: LucideIcon }[] = [
    {
      titleKey: "nav.profile",
      href: "/dashboard/settings/profile",
      icon: User,
    },
    {
      titleKey: "nav.integrations",
      href: "/dashboard/settings/integrations",
      icon: Link2,
    },
    {
      titleKey: "settings.notifications.title",
      href: "/dashboard/settings/notifications",
      icon: Bell,
    },
    {
      titleKey: "nav.billing",
      href: "/dashboard/settings/billing",
      icon: Gift,
    },
  ];

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t("settings.title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("settings.preferences.title")}
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {settingsTabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {t(tab.titleKey)}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1">{children}</div>
    </div>
  );
}

