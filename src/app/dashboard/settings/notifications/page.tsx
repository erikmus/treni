import { Bell, Mail, Smartphone, Calendar } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default async function NotificationsPage() {
  const t = await getTranslations("settings.notifications");

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <p className="text-muted-foreground text-sm">
          {t("subtitle")}
        </p>
      </div>

      <div className="space-y-8">
        {/* Email Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium">{t("email")}</h3>
          </div>
          
          <div className="space-y-4 pl-7">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-workout">{t("workoutReminders")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("workoutRemindersDesc")}
                </p>
              </div>
              <Switch id="email-workout" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-weekly">{t("weeklySummary")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("weeklySummaryDesc")}
                </p>
              </div>
              <Switch id="email-weekly" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-tips">{t("tipsAndUpdates")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("tipsAndUpdatesDesc")}
                </p>
              </div>
              <Switch id="email-tips" />
            </div>
          </div>
        </div>

        {/* Push Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium">{t("push")}</h3>
          </div>
          
          <div className="space-y-4 pl-7">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-workout">{t("pushWorkoutReminders")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("pushWorkoutRemindersDesc")}
                </p>
              </div>
              <Switch id="push-workout" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-achievements">{t("achievements")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("achievementsDesc")}
                </p>
              </div>
              <Switch id="push-achievements" defaultChecked />
            </div>
          </div>
        </div>

        {/* Calendar Sync */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium">{t("calendarIntegration")}</h3>
          </div>
          
          <div className="space-y-4 pl-7">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="calendar-sync">{t("syncWithCalendar")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("syncWithCalendarDesc")}
                </p>
              </div>
              <Switch id="calendar-sync" />
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground pt-4 border-t">
          {t("autoSave")}
        </p>
      </div>
    </div>
  );
}
