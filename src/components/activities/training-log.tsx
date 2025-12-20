"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  startOfWeek,
  endOfWeek,
  eachWeekOfInterval,
  format,
  isSameDay,
  isToday,
  getDay,
  parseISO,
  subWeeks,
} from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Triangle } from "lucide-react";

interface Activity {
  id: string;
  title: string | null;
  activity_type: string;
  started_at: string;
  distance_meters: number | null;
  duration_seconds: number;
  feeling?: string | null;
}

interface TrainingLogProps {
  activities: Activity[];
  weeksToShow?: number;
}

const dayNames = ["ma", "di", "wo", "do", "vrij", "za", "zo"];

// Activity type to emoji mapping for the marker
const activityEmoji: Record<string, string> = {
  run: "🏃",
  walk: "🚶",
  cross_training: "💪",
  cycling: "🚴",
  swimming: "🏊",
  other: "💪",
};

// Get color based on distance (green shades like Strava)
function getDistanceColor(distanceKm: number): string {
  if (distanceKm >= 15) return "bg-green-500";
  if (distanceKm >= 10) return "bg-green-500";
  if (distanceKm >= 5) return "bg-green-500";
  return "bg-green-500";
}

// Get circle size based on distance
function getCircleSize(distanceKm: number): string {
  if (distanceKm >= 20) return "w-16 h-16 text-base";
  if (distanceKm >= 15) return "w-14 h-14 text-base";
  if (distanceKm >= 10) return "w-12 h-12 text-sm";
  if (distanceKm >= 5) return "w-10 h-10 text-sm";
  return "w-8 h-8 text-xs";
}

export function TrainingLog({ activities, weeksToShow = 52 }: TrainingLogProps) {
  // Generate weeks from now going back
  const weeks = useMemo(() => {
    const now = new Date();
    const startDate = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), weeksToShow - 1);
    const endDate = endOfWeek(now, { weekStartsOn: 1 });
    
    return eachWeekOfInterval(
      { start: startDate, end: endDate },
      { weekStartsOn: 1 }
    ).reverse(); // Most recent first
  }, [weeksToShow]);

  // Group activities by week
  const activitiesByWeek = useMemo(() => {
    const map = new Map<string, Activity[]>();
    
    activities.forEach((activity) => {
      const activityDate = parseISO(activity.started_at);
      const weekStart = startOfWeek(activityDate, { weekStartsOn: 1 });
      const key = format(weekStart, "yyyy-MM-dd");
      
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(activity);
    });
    
    return map;
  }, [activities]);

  // Convert JS day (0=Sun) to our index (0=Mon)
  function getDayIndex(date: Date): number {
    const jsDay = getDay(date);
    return jsDay === 0 ? 6 : jsDay - 1;
  }

  return (
    <div className="w-full">
      {/* Header row with year and day names */}
      <div className="sticky top-0 bg-background z-10 border-b">
        <div className="grid grid-cols-[180px_repeat(7,1fr)] gap-2 py-3 px-4">
          <div className="text-lg font-bold">{format(new Date(), "yyyy")}</div>
          {dayNames.map((day) => (
            <div key={day} className="text-center text-sm text-muted-foreground font-medium">
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Week rows */}
      <div className="divide-y">
        {weeks.map((weekStart) => {
          const weekKey = format(weekStart, "yyyy-MM-dd");
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
          const weekActivities = activitiesByWeek.get(weekKey) || [];
          
          // Calculate total distance for the week
          const totalDistanceM = weekActivities.reduce(
            (sum, a) => sum + (Number(a.distance_meters) || 0),
            0
          );
          const totalDistanceKm = totalDistanceM / 1000;

          // Create array of 7 days (Mon-Sun) with their activities
          const daysWithActivities = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            
            const dayActivities = weekActivities.filter((a) =>
              isSameDay(parseISO(a.started_at), date)
            );
            
            return { date, activities: dayActivities };
          });

          // Check if this week is the current week
          const isCurrentWeek = isSameDay(
            weekStart,
            startOfWeek(new Date(), { weekStartsOn: 1 })
          );

          return (
            <div
              key={weekKey}
              className={cn(
                "grid grid-cols-[180px_repeat(7,1fr)] gap-2 py-4 px-4 items-center",
                isCurrentWeek && "bg-muted/30"
              )}
            >
              {/* Week info */}
              <div className="space-y-1">
                <div className="text-base font-semibold">
                  {format(weekStart, "d", { locale: nl })}–{format(weekEnd, "d MMM", { locale: nl }).toLowerCase()}
                </div>
                <div className="text-xs text-muted-foreground">Totale afstand</div>
                <div className="text-xl font-bold">
                  {totalDistanceKm.toLocaleString("nl-NL", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  km
                </div>
              </div>

              {/* Day cells */}
              {daysWithActivities.map(({ date, activities: dayActivities }, dayIndex) => {
                const isTodayDate = isToday(date);
                const hasActivities = dayActivities.length > 0;
                const isPast = date < new Date() && !isTodayDate;
                
                // Calculate total distance for this day
                const dayDistanceKm = dayActivities.reduce(
                  (sum, a) => sum + (Number(a.distance_meters) || 0) / 1000,
                  0
                );

                return (
                  <div
                    key={dayIndex}
                    className="flex flex-col items-center justify-center min-h-[80px] relative"
                  >
                    {isTodayDate && (
                      <div className="absolute -top-1 text-xs font-semibold text-primary">
                        Vandaag
                      </div>
                    )}
                    
                    {hasActivities ? (
                      <div className="flex flex-col items-center gap-1">
                        {dayActivities.map((activity) => {
                          const distanceKm = (Number(activity.distance_meters) || 0) / 1000;
                          
                          return (
                            <Link
                              key={activity.id}
                              href={`/dashboard/activities/${activity.id}`}
                              className={cn(
                                "rounded-full flex items-center justify-center font-bold text-white transition-transform hover:scale-110",
                                getDistanceColor(distanceKm),
                                getCircleSize(distanceKm)
                              )}
                              title={activity.title || undefined}
                            >
                              {distanceKm >= 1 ? (
                                `${Math.round(distanceKm)} km`
                              ) : (
                                distanceKm.toFixed(1)
                              )}
                            </Link>
                          );
                        })}
                        {/* Activity title below */}
                        {dayActivities.length === 1 && dayActivities[0].title && (
                          <span className="text-xs text-muted-foreground truncate max-w-[100px] text-center">
                            {dayActivities[0].title}
                          </span>
                        )}
                      </div>
                    ) : isPast ? (
                      <span className="text-sm text-muted-foreground/50">Rust</span>
                    ) : isTodayDate ? (
                      <Triangle className="h-4 w-4 text-primary fill-primary" />
                    ) : null}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

