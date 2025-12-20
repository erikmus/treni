"use client";

import { MapPin, Clock, Timer, Heart, Mountain, Footprints, Flame, TrendingUp } from "lucide-react";
import { useDistanceUnit } from "@/hooks/use-distance-unit";

interface ActivityStatsProps {
  distanceMeters: number | null;
  durationSeconds: number | null;
  avgPaceSecPerKm: number | null;
  bestPaceSecPerKm: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  elevationGainMeters: number | null;
  avgCadence: number | null;
  calories: number | null;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "-";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function ActivityStats({
  distanceMeters,
  durationSeconds,
  avgPaceSecPerKm,
  bestPaceSecPerKm,
  avgHeartRate,
  maxHeartRate,
  elevationGainMeters,
  avgCadence,
  calories,
}: ActivityStatsProps) {
  const { formatDistanceFromMeters, formatPace, unitLabel, paceUnitLabel } = useDistanceUnit();

  const distanceKm = distanceMeters ? Number(distanceMeters) / 1000 : 0;

  return (
    <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2">
      {/* Distance */}
      <div className="bg-card rounded-lg border px-3 py-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          Afstand
        </div>
        <p className="text-lg font-semibold leading-tight">
          {distanceMeters ? formatDistanceFromMeters(distanceMeters, 2) : "-"}
        </p>
      </div>

      {/* Duration */}
      <div className="bg-card rounded-lg border px-3 py-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Tijd
        </div>
        <p className="text-lg font-semibold leading-tight">{formatDuration(durationSeconds)}</p>
      </div>

      {/* Pace */}
      <div className="bg-card rounded-lg border px-3 py-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Timer className="h-3 w-3" />
          Gem. tempo
        </div>
        <p className="text-lg font-semibold leading-tight">{formatPace(avgPaceSecPerKm)}</p>
      </div>

      {/* Heart Rate */}
      {avgHeartRate && (
        <div className="bg-card rounded-lg border px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Heart className="h-3 w-3 text-red-500" />
            Gem. hartslag
          </div>
          <p className="text-lg font-semibold leading-tight">{avgHeartRate} <span className="text-xs font-normal text-muted-foreground">bpm</span></p>
        </div>
      )}

      {/* Max Heart Rate */}
      {maxHeartRate && (
        <div className="bg-card rounded-lg border px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Heart className="h-3 w-3 text-red-600" />
            Max hartslag
          </div>
          <p className="text-lg font-semibold leading-tight">{maxHeartRate} <span className="text-xs font-normal text-muted-foreground">bpm</span></p>
        </div>
      )}

      {/* Elevation */}
      {elevationGainMeters && (
        <div className="bg-card rounded-lg border px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mountain className="h-3 w-3" />
            Hoogteverschil
          </div>
          <p className="text-lg font-semibold leading-tight">{Math.round(Number(elevationGainMeters))} <span className="text-xs font-normal text-muted-foreground">m</span></p>
        </div>
      )}

      {/* Cadence */}
      {avgCadence && (
        <div className="bg-card rounded-lg border px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Footprints className="h-3 w-3" />
            Gem. cadans
          </div>
          <p className="text-lg font-semibold leading-tight">{avgCadence} <span className="text-xs font-normal text-muted-foreground">spm</span></p>
        </div>
      )}

      {/* Calories */}
      {calories && (
        <div className="bg-card rounded-lg border px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Flame className="h-3 w-3 text-orange-500" />
            Calorieën
          </div>
          <p className="text-lg font-semibold leading-tight">{calories} <span className="text-xs font-normal text-muted-foreground">kcal</span></p>
        </div>
      )}

      {/* Best Pace */}
      {bestPaceSecPerKm && (
        <div className="bg-card rounded-lg border px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-green-500" />
            Beste tempo
          </div>
          <p className="text-lg font-semibold leading-tight">{formatPace(bestPaceSecPerKm)}</p>
        </div>
      )}
    </div>
  );
}

