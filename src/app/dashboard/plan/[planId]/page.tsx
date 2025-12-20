import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { nl, enUS } from "date-fns/locale";
import { getTranslations, getLocale } from "next-intl/server";
import { Calendar, Target, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarView } from "@/components/plan/calendar-view";
import { createClient } from "@/lib/supabase/server";
import type { TrainingPlan, Workout } from "@/types/database";

interface PlanDetailPageProps {
  params: Promise<{
    planId: string;
  }>;
}

export default async function PlanDetailPage({ params }: PlanDetailPageProps) {
  const { planId } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const t = await getTranslations("plans");
  const locale = await getLocale();
  const dateLocale = locale === "nl" ? nl : enUS;

  if (!user) {
    redirect("/login");
  }

  // Fetch the training plan
  const { data: plan, error: planError } = await supabase
    .from("training_plans")
    .select("*")
    .eq("id", planId)
    .eq("user_id", user.id)
    .single();

  if (planError || !plan) {
    notFound();
  }

  // Fetch workouts for this plan
  const { data: workouts } = await supabase
    .from("workouts")
    .select("*")
    .eq("plan_id", planId)
    .order("scheduled_date");

  // Calculate stats
  const completedWorkouts = workouts?.filter(w => w.status === "completed").length || 0;
  const totalWorkouts = workouts?.length || 0;
  const progressPercent = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;

  // Calculate total distance
  const totalDistanceKm = workouts?.reduce((sum, w) => sum + (Number(w.target_distance_km) || 0), 0) || 0;

  const formatTargetTime = (minutes: number | null): string => {
    if (!minutes) return t("detail.noTargetTime");
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}`;
    }
    return `${mins} ${locale === "nl" ? "minuten" : "minutes"}`;
  };

  const goalKey = plan.goal_type as "5k" | "10k" | "15k" | "half_marathon" | "marathon" | "fitness" | "custom";
  const goalLabel = t.has(`goals.${goalKey}`) ? t(`goals.${goalKey}`) : plan.goal_type;

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🏃</span>
            <h1 className="text-3xl font-bold">{plan.name}</h1>
          </div>
          {plan.description && (
            <p className="text-muted-foreground">{plan.description}</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/plan/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("newPlan")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">{t("detail.goal")}</span>
          </div>
          <p className="text-lg font-semibold">{goalLabel}</p>
          {plan.goal_event_name && (
            <p className="text-xs text-muted-foreground">{plan.goal_event_name}</p>
          )}
        </div>

        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <span className="text-sm text-muted-foreground">{t("detail.event")}</span>
          </div>
          <p className="text-lg font-semibold">
            {plan.goal_event_date 
              ? format(new Date(plan.goal_event_date), "d MMM yyyy", { locale: dateLocale })
              : t("detail.noDate")}
          </p>
          {plan.target_time_minutes && (
            <p className="text-xs text-muted-foreground">
              {t("detail.targetTime")}: {formatTargetTime(plan.target_time_minutes)}
            </p>
          )}
        </div>

        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10">
              <Clock className="h-5 w-5 text-emerald-500" />
            </div>
            <span className="text-sm text-muted-foreground">{t("detail.progress")}</span>
          </div>
          <p className="text-lg font-semibold">{progressPercent}%</p>
          <p className="text-xs text-muted-foreground">
            {t("detail.trainingsOf", { completed: completedWorkouts, total: totalWorkouts })}
          </p>
        </div>

        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-500/10">
              <span className="text-lg">📏</span>
            </div>
            <span className="text-sm text-muted-foreground">{t("detail.total")}</span>
          </div>
          <p className="text-lg font-semibold">{totalDistanceKm.toFixed(0)} km</p>
          <p className="text-xs text-muted-foreground">
            {t("detail.weeksSchedule", { weeks: plan.weeks_duration })}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-card rounded-xl border p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{t("detail.progress")}</span>
          <span className="text-sm text-muted-foreground">{t("detail.percentCompleted", { percent: progressPercent })}</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Calendar View */}
      <CalendarView plan={plan as TrainingPlan} workouts={(workouts || []) as Workout[]} />
    </div>
  );
}
