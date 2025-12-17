import { subDays, startOfWeek, endOfWeek } from "date-fns"
import { SectionCards } from "@/components/section-cards"
import { TodayWorkout } from "@/components/dashboard/today-workout"
import { WeekOverview } from "@/components/dashboard/week-overview"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch active training plan (most recent if multiple)
  const { data: activePlans } = await supabase
    .from("training_plans")
    .select("*")
    .eq("user_id", user!.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
  
  const activePlan = activePlans?.[0] || null

  // Get dates for this week and last week
  const now = new Date()
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 }) // Sunday
  const lastWeekStart = subDays(thisWeekStart, 7)
  const lastWeekEnd = subDays(thisWeekStart, 1)

  const today = now.toISOString().split("T")[0]

  // Fetch today's workout if there's an active plan
  const { data: todayWorkout } = activePlan ? await supabase
    .from("workouts")
    .select("*")
    .eq("plan_id", activePlan.id)
    .eq("scheduled_date", today)
    .single() : { data: null }

  // Fetch this week's workouts
  const { data: weekWorkouts } = activePlan ? await supabase
    .from("workouts")
    .select("*")
    .eq("plan_id", activePlan.id)
    .gte("scheduled_date", thisWeekStart.toISOString().split("T")[0])
    .lte("scheduled_date", thisWeekEnd.toISOString().split("T")[0])
    .order("scheduled_date") : { data: [] }

  // Fetch last week's workouts for comparison
  const { data: lastWeekWorkouts } = activePlan ? await supabase
    .from("workouts")
    .select("*")
    .eq("plan_id", activePlan.id)
    .gte("scheduled_date", lastWeekStart.toISOString().split("T")[0])
    .lte("scheduled_date", lastWeekEnd.toISOString().split("T")[0]) : { data: [] }

  // Fetch activities for this week
  const { data: thisWeekActivities } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", user!.id)
    .gte("started_at", thisWeekStart.toISOString())
    .lte("started_at", thisWeekEnd.toISOString())

  // Fetch activities for last week
  const { data: lastWeekActivities } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", user!.id)
    .gte("started_at", lastWeekStart.toISOString())
    .lte("started_at", lastWeekEnd.toISOString())

  // Calculate stats from activities (if available) or workouts
  const thisWeekDistanceFromActivities = (thisWeekActivities?.reduce(
    (sum, a) => sum + (Number(a.distance_meters) || 0), 0
  ) || 0) / 1000

  const thisWeekTimeFromActivities = (thisWeekActivities?.reduce(
    (sum, a) => sum + (a.duration_seconds || 0), 0
  ) || 0) / 60

  const lastWeekDistanceFromActivities = (lastWeekActivities?.reduce(
    (sum, a) => sum + (Number(a.distance_meters) || 0), 0
  ) || 0) / 1000

  const lastWeekTimeFromActivities = (lastWeekActivities?.reduce(
    (sum, a) => sum + (a.duration_seconds || 0), 0
  ) || 0) / 60

  // If no activities, use planned workout data
  const thisWeekDistanceFromWorkouts = (weekWorkouts?.filter(w => w.status === "completed").reduce(
    (sum, w) => sum + (Number(w.target_distance_km) || 0), 0
  ) || 0)

  const thisWeekTimeFromWorkouts = (weekWorkouts?.filter(w => w.status === "completed").reduce(
    (sum, w) => sum + (w.target_duration_minutes || 0), 0
  ) || 0)

  const lastWeekDistanceFromWorkouts = (lastWeekWorkouts?.filter(w => w.status === "completed").reduce(
    (sum, w) => sum + (Number(w.target_distance_km) || 0), 0
  ) || 0)

  const lastWeekTimeFromWorkouts = (lastWeekWorkouts?.filter(w => w.status === "completed").reduce(
    (sum, w) => sum + (w.target_duration_minutes || 0), 0
  ) || 0)

  // Use activities if available, otherwise use completed workouts
  const thisWeekDistance = thisWeekDistanceFromActivities > 0 
    ? thisWeekDistanceFromActivities 
    : thisWeekDistanceFromWorkouts

  const thisWeekTime = thisWeekTimeFromActivities > 0 
    ? thisWeekTimeFromActivities 
    : thisWeekTimeFromWorkouts

  const lastWeekDistance = lastWeekDistanceFromActivities > 0 
    ? lastWeekDistanceFromActivities 
    : lastWeekDistanceFromWorkouts

  const lastWeekTime = lastWeekTimeFromActivities > 0 
    ? lastWeekTimeFromActivities 
    : lastWeekTimeFromWorkouts

  // Calculate percentage changes
  const distanceChange = lastWeekDistance > 0 
    ? Math.round(((thisWeekDistance - lastWeekDistance) / lastWeekDistance) * 100)
    : 0

  const timeChange = lastWeekTime > 0 
    ? Math.round(((thisWeekTime - lastWeekTime) / lastWeekTime) * 100)
    : 0

  // Count completed workouts this week
  const completedThisWeek = weekWorkouts?.filter(w => w.status === "completed").length || 0
  const totalThisWeek = weekWorkouts?.length || 0

  // Calculate streak - count consecutive days with completed workouts or activities
  // For simplicity, count this from completed workouts in the last 30 days
  const thirtyDaysAgo = subDays(now, 30)
  const { data: recentWorkouts } = await supabase
    .from("workouts")
    .select("scheduled_date, status")
    .eq("user_id", user!.id)
    .eq("status", "completed")
    .gte("scheduled_date", thirtyDaysAgo.toISOString().split("T")[0])
    .order("scheduled_date", { ascending: false })

  const { data: recentActivities } = await supabase
    .from("activities")
    .select("started_at")
    .eq("user_id", user!.id)
    .gte("started_at", thirtyDaysAgo.toISOString())

  // Build set of dates with activity
  const activeDates = new Set<string>()
  recentWorkouts?.forEach(w => activeDates.add(w.scheduled_date))
  recentActivities?.forEach(a => {
    const date = new Date(a.started_at).toISOString().split("T")[0]
    activeDates.add(date)
  })

  // Calculate streak
  let streak = 0
  let checkDate = new Date(now)
  
  // If today hasn't happened yet, start from yesterday
  if (!activeDates.has(today)) {
    checkDate = subDays(now, 1)
  }

  while (true) {
    const dateStr = checkDate.toISOString().split("T")[0]
    if (activeDates.has(dateStr)) {
      streak++
      checkDate = subDays(checkDate, 1)
    } else {
      break
    }
  }

  const stats = {
    weeklyDistance: Number(thisWeekDistance.toFixed(1)),
    weeklyDistanceChange: distanceChange,
    weeklyTime: Math.round(thisWeekTime),
    weeklyTimeChange: timeChange,
    completedWorkouts: completedThisWeek,
    totalWorkouts: totalThisWeek > 0 ? totalThisWeek : 1, // Prevent division by zero
    streak,
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards stats={stats} hasPlan={!!activePlan} />
      
      <div className="grid gap-4 px-4 lg:px-6 lg:grid-cols-2">
        <TodayWorkout 
          workout={todayWorkout} 
          hasPlan={!!activePlan}
        />
        <WeekOverview 
          workouts={weekWorkouts || []} 
          hasPlan={!!activePlan}
        />
      </div>
    </div>
  )
}
