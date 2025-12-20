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
import { useDistanceUnit } from "@/hooks/use-distance-unit";

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

const dayNamesShort = ["M", "D", "W", "D", "V", "Z", "Z"];
const dayNamesFull = ["ma", "di", "wo", "do", "vr", "za", "zo"];

// Get circle size based on distance
function getCircleSize(distanceKm: number, isMobile: boolean): string {
  if (isMobile) {
    if (distanceKm >= 15) return "w-9 h-9 text-[10px]";
    if (distanceKm >= 10) return "w-8 h-8 text-[10px]";
    if (distanceKm >= 5) return "w-7 h-7 text-[10px]";
    return "w-6 h-6 text-[9px]";
  }
  if (distanceKm >= 20) return "w-14 h-14 text-sm";
  if (distanceKm >= 15) return "w-12 h-12 text-sm";
  if (distanceKm >= 10) return "w-11 h-11 text-xs";
  if (distanceKm >= 5) return "w-10 h-10 text-xs";
  return "w-8 h-8 text-[10px]";
}

export function TrainingLog({ activities, weeksToShow = 52 }: TrainingLogProps) {
  const { convertDistance, unitLabel } = useDistanceUnit();
  
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

  return (
    <div className="w-full">
      {/* Header row - Desktop */}
      <div className="sticky top-0 bg-background z-10 border-b hidden md:block">
        <div className="grid grid-cols-[160px_repeat(7,1fr)] gap-1 py-3 px-4">
          <div className="text-lg font-bold">{format(new Date(), "yyyy")}</div>
          {dayNamesFull.map((day) => (
            <div key={day} className="text-center text-sm text-muted-foreground font-medium">
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Header row - Mobile */}
      <div className="sticky top-0 bg-background z-10 border-b md:hidden">
        <div className="grid grid-cols-[90px_repeat(7,1fr)] gap-0.5 py-2 px-2">
          <div className="text-base font-bold">{format(new Date(), "yyyy")}</div>
          {dayNamesShort.map((day, i) => (
            <div key={i} className="text-center text-xs text-muted-foreground font-medium">
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
            <div key={weekKey}>
              {/* Desktop Layout */}
              <div
                className={cn(
                  "hidden md:grid grid-cols-[160px_repeat(7,1fr)] gap-1 py-3 px-4 items-center",
                  isCurrentWeek && "bg-muted/30"
                )}
              >
                {/* Week info */}
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold">
                    {format(weekStart, "d", { locale: nl })}–{format(weekEnd, "d MMM", { locale: nl }).toLowerCase()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {totalDistanceKm > 0 ? (
                      <span className="font-semibold text-foreground">
                        {convertDistance(totalDistanceKm).toLocaleString("nl-NL", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })} {unitLabel}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </div>
                </div>

                {/* Day cells - Desktop */}
                {daysWithActivities.map(({ date, activities: dayActivities }, dayIndex) => {
                  const isTodayDate = isToday(date);
                  const hasActivities = dayActivities.length > 0;

                  return (
                    <div
                      key={dayIndex}
                      className={cn(
                        "flex flex-col items-center justify-center min-h-[60px] relative rounded-lg",
                        isTodayDate && "bg-primary/5 ring-1 ring-primary/20"
                      )}
                    >
                      {hasActivities ? (
                        <div className="flex flex-col items-center gap-0.5">
                          {dayActivities.map((activity) => {
                            const distanceKm = (Number(activity.distance_meters) || 0) / 1000;
                            const displayDistance = convertDistance(distanceKm);
                            
                            return (
                              <Link
                                key={activity.id}
                                href={`/dashboard/activities/${activity.id}`}
                                className={cn(
                                  "rounded-full flex items-center justify-center font-bold text-white transition-transform hover:scale-110 bg-emerald-500",
                                  getCircleSize(distanceKm, false)
                                )}
                                title={activity.title || undefined}
                              >
                                {displayDistance >= 1 ? `${Math.round(displayDistance)}` : displayDistance.toFixed(1)}
                              </Link>
                            );
                          })}
                          {dayActivities.length === 1 && dayActivities[0].title && (
                            <span className="text-[10px] text-muted-foreground truncate max-w-[80px] text-center leading-tight">
                              {dayActivities[0].title.split(" - ")[0]}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-muted-foreground/20" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Mobile Layout */}
              <div
                className={cn(
                  "md:hidden grid grid-cols-[90px_repeat(7,1fr)] gap-0.5 py-2 px-2 items-center",
                  isCurrentWeek && "bg-muted/30"
                )}
              >
                {/* Week info - Mobile */}
                <div className="pr-1">
                  <div className="text-xs font-semibold leading-tight">
                    {format(weekStart, "d", { locale: nl })}–{format(weekEnd, "d", { locale: nl })}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {format(weekEnd, "MMM", { locale: nl }).toLowerCase()}
                  </div>
                  {totalDistanceKm > 0 && (
                    <div className="text-xs font-bold text-emerald-600 mt-0.5">
                      {convertDistance(totalDistanceKm).toLocaleString("nl-NL", {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })} {unitLabel}
                    </div>
                  )}
                </div>

                {/* Day cells - Mobile */}
                {daysWithActivities.map(({ date, activities: dayActivities }, dayIndex) => {
                  const isTodayDate = isToday(date);
                  const hasActivities = dayActivities.length > 0;

                  return (
                    <div
                      key={dayIndex}
                      className={cn(
                        "flex flex-col items-center justify-center min-h-[44px] relative rounded",
                        isTodayDate && "bg-primary/10"
                      )}
                    >
                      {hasActivities ? (
                        <div className="flex flex-col items-center">
                          {dayActivities.slice(0, 1).map((activity) => {
                            const distanceKm = (Number(activity.distance_meters) || 0) / 1000;
                            const displayDistance = convertDistance(distanceKm);
                            
                            return (
                              <Link
                                key={activity.id}
                                href={`/dashboard/activities/${activity.id}`}
                                className={cn(
                                  "rounded-full flex items-center justify-center font-bold text-white bg-emerald-500",
                                  getCircleSize(distanceKm, true)
                                )}
                              >
                                {displayDistance >= 1 ? Math.round(displayDistance) : "·"}
                              </Link>
                            );
                          })}
                          {dayActivities.length > 1 && (
                            <span className="text-[8px] text-muted-foreground">+{dayActivities.length - 1}</span>
                          )}
                        </div>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/15" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
