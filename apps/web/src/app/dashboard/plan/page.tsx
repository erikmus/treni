import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { CalendarView, DeletePlanButton } from "@/components/plan";
import { createClient } from "@/lib/supabase/server";

export default async function PlanOverviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const t = await getTranslations("plans");

  if (!user) {
    redirect("/login");
  }

  // Fetch active training plan (most recent if multiple)
  const { data: activePlans } = await supabase
    .from("training_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1);
  
  const activePlan = activePlans?.[0] || null;

  // Fetch workouts if there's an active plan
  const { data: workouts } = activePlan
    ? await supabase
        .from("workouts")
        .select("*")
        .eq("plan_id", activePlan.id)
        .order("scheduled_date")
    : { data: [] };

  if (!activePlan) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <div className="text-center px-4">
          <div className="rounded-full bg-primary/10 w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🏃</span>
          </div>
          <h1 className="text-2xl font-bold mb-4">{t("empty.title")}</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            {t("empty.description")}
          </p>
          <Button asChild size="lg">
            <Link href="/dashboard/plan/new">
              <Plus className="mr-2 h-5 w-5" />
              {t("empty.cta")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{activePlan.name}</h1>
          <p className="text-muted-foreground mt-1">
            {activePlan.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DeletePlanButton planId={activePlan.id} planName={activePlan.name} />
          <Button variant="outline" asChild>
            <Link href="/dashboard/plan/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("newPlan")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Calendar View */}
      <CalendarView plan={activePlan} workouts={workouts || []} />
    </div>
  );
}
