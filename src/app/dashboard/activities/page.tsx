import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  Activity,
  Plus,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { UploadTCXDialog, TrainingLog } from "@/components/activities";

export default async function ActivitiesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all activities for this user
  const { data: activities } = await supabase
    .from("activities")
    .select("id, title, activity_type, started_at, distance_meters, duration_seconds, feeling")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false });

  // Check if user has Strava connected
  const { data: profile } = await supabase
    .from("profiles")
    .select("strava_athlete_id, strava_access_token")
    .eq("id", user.id)
    .single();
  
  const isStravaConnected = !!(profile?.strava_athlete_id && profile?.strava_access_token);

  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Trainingslog</h1>
            <p className="text-muted-foreground mt-1">
              Je voltooide trainingen en activiteiten
            </p>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-1 items-center justify-center py-16">
          <div className="text-center px-4">
            <div className="rounded-full bg-primary/10 w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Activity className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Nog geen activiteiten</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Voeg handmatig een activiteit toe of importeer een TCX bestand van Garmin Connect.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <UploadTCXDialog
                trigger={
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    TCX uploaden
                  </Button>
                }
              />
              <Button asChild>
                <Link href="/dashboard/activities/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Activiteit toevoegen
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate totals for header
  const totalActivities = activities.length;
  const totalDistanceM = activities.reduce((sum, a) => sum + (Number(a.distance_meters) || 0), 0);

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trainingslog</h1>
          <p className="text-muted-foreground mt-1">
            {totalActivities} activiteit{totalActivities !== 1 ? "en" : ""} • {(totalDistanceM / 1000).toFixed(1)} km totaal
          </p>
        </div>
        <div className="flex items-center gap-2">
          <UploadTCXDialog
            trigger={
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                TCX uploaden
              </Button>
            }
          />
          <Button asChild>
            <Link href="/dashboard/activities/new">
              <Plus className="mr-2 h-4 w-4" />
              Toevoegen
            </Link>
          </Button>
        </div>
      </div>

      {/* Training Log Calendar View */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <TrainingLog activities={activities} weeksToShow={52} />
      </div>

      {/* Strava Connection CTA */}
      {!isStravaConnected && (
        <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-xl border border-orange-500/20 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-500/20">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold">Koppel je Strava account</h3>
                <p className="text-sm text-muted-foreground">
                  Synchroniseer automatisch je trainingen vanuit Strava.
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard/settings/integrations">
                Koppelen
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
