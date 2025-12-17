import { Watch, Activity, Link2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile to check Garmin connection
  const { data: profile } = await supabase
    .from("profiles")
    .select("garmin_user_id, garmin_access_token")
    .eq("id", user.id)
    .single();

  const isGarminConnected = !!(profile?.garmin_user_id && profile?.garmin_access_token);

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Integraties</h2>
        <p className="text-muted-foreground text-sm">
          Koppel externe diensten om je trainingsdata te synchroniseren
        </p>
      </div>

      <div className="space-y-4">
        {/* Garmin Connect */}
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Watch className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Garmin Connect</h3>
                {isGarminConnected ? (
                  <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Gekoppeld
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    <XCircle className="h-3 w-3 mr-1" />
                    Niet gekoppeld
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                Synchroniseer activiteiten en stuur workouts naar je Garmin horloge
              </p>
              
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Automatisch activiteiten importeren
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Workouts naar horloge sturen
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Hartslag zones synchroniseren
                </li>
              </ul>

              <div className="mt-4">
                {isGarminConnected ? (
                  <Button variant="outline" size="sm">
                    Ontkoppelen
                  </Button>
                ) : (
                  <Button size="sm">
                    <Link2 className="h-4 w-4 mr-2" />
                    Koppelen met Garmin
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Strava */}
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-orange-500/10">
              <Activity className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Strava</h3>
                <Badge variant="outline" className="text-muted-foreground">
                  <XCircle className="h-3 w-3 mr-1" />
                  Niet gekoppeld
                </Badge>
                <Badge variant="secondary" className="text-xs">Binnenkort</Badge>
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                Importeer activiteiten automatisch vanuit Strava
              </p>
              
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Automatisch activiteiten importeren
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Segmenten en kudos
                </li>
              </ul>

              <div className="mt-4">
                <Button size="sm" disabled>
                  <Link2 className="h-4 w-4 mr-2" />
                  Binnenkort beschikbaar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Import */}
        <div className="bg-muted/30 border border-dashed rounded-xl p-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Geen Garmin of Strava? Je kunt altijd{" "}
              <a href="/dashboard/activities" className="text-primary hover:underline">
                TCX/GPX bestanden handmatig importeren
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

