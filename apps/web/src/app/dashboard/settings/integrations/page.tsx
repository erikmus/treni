import { Watch, Activity, Link2, CheckCircle2, XCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StravaActions } from "./strava-actions";

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const t = await getTranslations("settings.integrations");

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile to check connections
  const { data: profile } = await supabase
    .from("profiles")
    .select("strava_athlete_id, strava_access_token")
    .eq("id", user.id)
    .single();

  const isStravaConnected = !!(profile?.strava_athlete_id && profile?.strava_access_token);

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <p className="text-muted-foreground text-sm">
          {t("subtitle")}
        </p>
      </div>

      <div className="space-y-4">
        {/* Strava */}
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-orange-500/10">
              <Activity className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{t("strava.title")}</h3>
                {isStravaConnected ? (
                  <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {t("strava.connected")}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    <XCircle className="h-3 w-3 mr-1" />
                    {t("strava.notConnected")}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                {t("strava.description")}
              </p>
              
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {t("strava.features.import")}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {t("strava.features.segments")}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {t("strava.features.heartRate")}
                </li>
              </ul>

              <StravaActions isConnected={isStravaConnected} />
            </div>
          </div>
        </div>

        {/* Garmin Connect */}
        <div className="bg-card border rounded-xl p-6 opacity-75">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Watch className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{t("garmin.title")}</h3>
                <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                  {t("garmin.comingSoon")}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                {t("garmin.description")}
              </p>
              
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <XCircle className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <span className="text-muted-foreground/70">{t("garmin.features.import")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {t("garmin.features.export")}
                </li>
                <li className="flex items-center gap-2">
                  <XCircle className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <span className="text-muted-foreground/70">{t("garmin.features.heartRate")}</span>
                </li>
              </ul>

              <p className="mt-3 text-xs text-muted-foreground">
                {t("garmin.exportHint")}
              </p>

              <div className="mt-4">
                <Button size="sm" disabled>
                  <Link2 className="h-4 w-4 mr-2" />
                  {t("garmin.comingSoon")}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Import */}
        <div className="bg-muted/30 border border-dashed rounded-xl p-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {t("manual.hint")}{" "}
              <a href="/dashboard/activities" className="text-primary hover:underline">
                {t("manual.importLink")}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
