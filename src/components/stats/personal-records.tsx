"use client";

import { useState, useEffect, useCallback } from "react";
import { Award, Timer, ChevronDown, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// Distance definitions in meters
const DISTANCES = [
  { key: "500m", label: "500m", meters: 500 },
  { key: "1km", label: "1 km", meters: 1000 },
  { key: "2km", label: "2 km", meters: 2000 },
  { key: "5km", label: "5 km", meters: 5000 },
  { key: "10km", label: "10 km", meters: 10000 },
  { key: "15km", label: "15 km", meters: 15000 },
  { key: "10mile", label: "10 mijl", meters: 16093.4 },
  { key: "20km", label: "20 km", meters: 20000 },
  { key: "half", label: "Halve marathon", meters: 21097.5 },
  { key: "marathon", label: "Marathon", meters: 42195 },
] as const;

type TimePeriod = "30days" | "thisYear" | "allTime";

const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: "30days", label: "30 dagen" },
  { value: "thisYear", label: "Dit jaar" },
  { value: "allTime", label: "Aller tijden" },
];

interface Split {
  lapNumber: number;
  distanceMeters: number;
  durationSeconds: number;
  paceSecPerKm: number;
  startTime: string;
  avgHeartRate?: number;
  maxHeartRate?: number;
  calories?: number;
}

interface Activity {
  id: string;
  distance_meters: number;
  duration_seconds: number;
  splits_data: { splits: Split[] } | null;
  started_at: string;
}

interface DistanceRecord {
  distanceKey: string;
  timeSeconds: number;
  activityId: string;
  activityDate: string;
}

function formatRecordTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.round(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function calculateBestTimeForDistance(
  activities: Activity[],
  targetMeters: number
): DistanceRecord | null {
  let bestRecord: DistanceRecord | null = null;

  for (const activity of activities) {
    // Skip if activity is shorter than target distance
    if (Number(activity.distance_meters) < targetMeters * 0.95) continue;

    const splits = activity.splits_data?.splits;
    if (!splits || splits.length === 0) continue;

    // For 500m, estimate from best km split
    if (targetMeters === 500) {
      const fullSplits = splits.filter(s => s.distanceMeters >= 900);
      if (fullSplits.length === 0) continue;
      
      const bestSplit = fullSplits.reduce((best, split) => 
        split.durationSeconds < best.durationSeconds ? split : best
      , fullSplits[0]);
      
      // Estimate 500m as half of best 1km time (slightly faster due to shorter distance)
      const estimated500m = (bestSplit.durationSeconds / 2) * 0.98;
      
      if (!bestRecord || estimated500m < bestRecord.timeSeconds) {
        bestRecord = {
          distanceKey: "500m",
          timeSeconds: estimated500m,
          activityId: activity.id,
          activityDate: activity.started_at,
        };
      }
      continue;
    }

    // For 1km, find the best single split
    if (targetMeters === 1000) {
      const bestSplit = splits
        .filter(s => s.distanceMeters >= 900) // Filter out partial km splits
        .reduce((best, split) => 
          split.durationSeconds < best.durationSeconds ? split : best
        , splits.filter(s => s.distanceMeters >= 900)[0]);
      
      if (bestSplit && (!bestRecord || bestSplit.durationSeconds < bestRecord.timeSeconds)) {
        bestRecord = {
          distanceKey: "1km",
          timeSeconds: bestSplit.durationSeconds,
          activityId: activity.id,
          activityDate: activity.started_at,
        };
      }
      continue;
    }

    // For longer distances, find the best consecutive splits
    const targetKm = Math.ceil(targetMeters / 1000);
    const fullSplits = splits.filter(s => s.distanceMeters >= 900);
    
    if (fullSplits.length < targetKm) continue;

    // Sliding window to find best consecutive splits
    for (let i = 0; i <= fullSplits.length - targetKm; i++) {
      const windowSplits = fullSplits.slice(i, i + targetKm);
      let totalTime = windowSplits.reduce((sum, s) => sum + s.durationSeconds, 0);
      let totalDistance = windowSplits.reduce((sum, s) => sum + s.distanceMeters, 0);

      // Adjust for non-exact distances (e.g., 10 mile = 16.0934km)
      if (targetMeters % 1000 !== 0) {
        const ratio = targetMeters / totalDistance;
        totalTime = totalTime * ratio;
      }

      if (!bestRecord || totalTime < bestRecord.timeSeconds) {
        bestRecord = {
          distanceKey: targetMeters.toString(),
          timeSeconds: totalTime,
          activityId: activity.id,
          activityDate: activity.started_at,
        };
      }
    }
  }

  return bestRecord;
}

export function PersonalRecords({ userId }: { userId: string }) {
  const [period, setPeriod] = useState<TimePeriod>("30days");
  const [records, setRecords] = useState<Map<string, DistanceRecord>>(new Map());
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("activities")
      .select("id, distance_meters, duration_seconds, splits_data, started_at")
      .eq("user_id", userId)
      .eq("activity_type", "run")
      .not("splits_data", "is", null)
      .order("started_at", { ascending: false });

    // Apply time filter
    if (period === "30days") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query = query.gte("started_at", thirtyDaysAgo.toISOString());
    } else if (period === "thisYear") {
      const startOfYear = new Date(new Date().getFullYear(), 0, 1);
      query = query.gte("started_at", startOfYear.toISOString());
    }
    // allTime: no filter

    const { data: activities, error } = await query;

    if (error || !activities) {
      console.error("Error fetching activities:", error);
      setLoading(false);
      return;
    }

    // Calculate records for each distance
    const newRecords = new Map<string, DistanceRecord>();
    
    for (const distance of DISTANCES) {
      const record = calculateBestTimeForDistance(activities as Activity[], distance.meters);
      if (record) {
        newRecords.set(distance.key, record);
      }
    }
    setRecords(newRecords);
    setLoading(false);
  }, [userId, period]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const currentPeriodLabel = TIME_PERIODS.find(p => p.value === period)?.label;

  return (
    <div className="bg-card rounded-xl border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" />
          Persoonlijke Records
        </h2>
        
        {/* Custom Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border bg-background hover:bg-accent transition-colors"
          >
            {currentPeriodLabel}
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              dropdownOpen && "rotate-180"
            )} />
          </button>
          
          {dropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setDropdownOpen(false)} 
              />
              <div className="absolute right-0 top-full mt-1 z-20 min-w-[140px] rounded-lg border bg-popover p-1 shadow-lg">
                {TIME_PERIODS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => {
                      setPeriod(p.value);
                      setDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors",
                      period === p.value && "bg-accent"
                    )}
                  >
                    {p.label}
                    {period === p.value && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between py-2 animate-pulse">
              <div className="h-4 w-16 bg-muted rounded" />
              <div className="h-4 w-20 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : records.size === 0 ? (
        <p className="text-muted-foreground text-sm">
          Voltooi wat trainingen om je records te zien.
        </p>
      ) : (
        <div className="space-y-1">
          {DISTANCES.map((distance) => {
            const record = records.get(distance.key);
            return (
              <div 
                key={distance.key} 
                className={cn(
                  "flex items-center justify-between py-2.5 border-b border-border/50 last:border-0",
                  !record && "opacity-40"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg text-xs font-medium",
                    record 
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    <Timer className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{distance.label}</span>
                </div>
                <span className={cn(
                  "font-mono text-sm",
                  record ? "font-semibold" : "text-muted-foreground"
                )}>
                  {record ? formatRecordTime(record.timeSeconds) : "—"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

