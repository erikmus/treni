"use client";

import { cn } from "@/lib/utils";
import { Clock, Zap, Heart, Repeat, Gauge } from "lucide-react";

export interface WorkoutSegment {
  type: string;
  name?: string;
  duration_type?: string;
  duration_value?: number;
  target_type?: string;
  target_pace_low?: number;
  target_pace_high?: number;
  target_zone?: number;
  repeat_count?: number;
  segments?: WorkoutSegment[];
  notes?: string;
  // Alternative format from some AI responses
  intensity?: string;
  distance_m?: number;
}

export interface WorkoutStructureData {
  segments: WorkoutSegment[];
  estimated_duration_minutes: number;
  estimated_distance_km: number;
}

// Zone pace ranges relative to race pace (zone 4)
// E.g., if race pace is 5:00/km, zone 1 would be ~6:15-7:00/km
const zonePaceMultipliers: Record<number, { low: number; high: number }> = {
  1: { low: 1.25, high: 1.40 }, // Very easy - recovery
  2: { low: 1.10, high: 1.25 }, // Easy - aerobic base
  3: { low: 1.00, high: 1.10 }, // Moderate - tempo
  4: { low: 0.95, high: 1.00 }, // Hard - threshold/race pace
  5: { low: 0.85, high: 0.95 }, // Very hard - VO2max
};

interface WorkoutStructureProps {
  structure: WorkoutStructureData;
  /** Race pace in seconds per km (e.g., 300 for 5:00/km) */
  racePaceSeconds?: number;
}

// Intensity colors - gradient from light (easy) to dark (hard)
const intensityColors: Record<number, string> = {
  1: "#7DD3C0", // Zone 1 - Light teal
  2: "#5DBBA8", // Zone 2 - Medium teal  
  3: "#3DA390", // Zone 3 - Darker teal
  4: "#2D8B78", // Zone 4 - Even darker
  5: "#1D7360", // Zone 5 - Darkest
};

const segmentTypeColors: Record<string, { bg: string; border: string; icon: string }> = {
  warmup: { bg: "bg-amber-500/10", border: "border-amber-500/30", icon: "🔥" },
  interval: { bg: "bg-red-500/10", border: "border-red-500/30", icon: "⚡" },
  recovery: { bg: "bg-teal-500/10", border: "border-teal-500/30", icon: "💨" },
  cooldown: { bg: "bg-blue-500/10", border: "border-blue-500/30", icon: "❄️" },
  steady: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: "🏃" },
  repeat: { bg: "bg-purple-500/10", border: "border-purple-500/30", icon: "🔄" },
  main: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: "🏃" },
};

function getSegmentTypeName(type: string): string {
  const names: Record<string, string> = {
    warmup: "Warming-up",
    interval: "Interval",
    recovery: "Herstel",
    cooldown: "Cooling-down",
    steady: "Duurloop",
    repeat: "Herhalingen",
    main: "Hoofdtraining",
  };
  return names[type] || type;
}

function parseZoneFromIntensity(intensity?: string): number | undefined {
  if (!intensity) return undefined;
  // Parse "Zone 2" or "Zone 1-2" format
  const match = intensity.match(/Zone\s*(\d)/i);
  return match ? parseInt(match[1]) : undefined;
}

// Get intensity zone from segment type or explicit zone
function getIntensityFromSegment(segment: WorkoutSegment): number {
  // First check explicit zone
  const explicitZone = segment.target_zone || parseZoneFromIntensity(segment.intensity);
  if (explicitZone) return explicitZone;
  
  // Infer from segment type
  const typeToZone: Record<string, number> = {
    warmup: 1,
    cooldown: 1,
    recovery: 1,
    easy: 2,
    steady: 2,
    main: 3,
    tempo: 4,
    interval: 5,
    repeat: 4,
  };
  
  return typeToZone[segment.type] || 2;
}

function formatDuration(type: string | undefined, value: number | undefined): string {
  if (!value) return "";
  
  if (type === "time") {
    if (value >= 3600) {
      const hours = Math.floor(value / 3600);
      const mins = Math.floor((value % 3600) / 60);
      return `${hours}u ${mins}min`;
    } else if (value >= 60) {
      const mins = Math.floor(value / 60);
      const secs = value % 60;
      return secs > 0 ? `${mins}min ${secs}s` : `${mins} min`;
    } else {
      return `${value}s`;
    }
  } else if (type === "distance") {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)} km`;
    } else {
      return `${value}m`;
    }
  }
  
  return "";
}

function formatPaceSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatPace(low: number | undefined, high: number | undefined): string {
  if (!low && !high) return "";
  
  if (low && high) {
    return `${formatPaceSeconds(low)} - ${formatPaceSeconds(high)} /km`;
  } else if (low) {
    return `${formatPaceSeconds(low)} /km`;
  }
  
  return "";
}

function getZonePaceRange(zone: number, racePaceSeconds: number): { low: number; high: number } {
  const multipliers = zonePaceMultipliers[zone] || zonePaceMultipliers[2];
  return {
    low: Math.round(racePaceSeconds * multipliers.low),
    high: Math.round(racePaceSeconds * multipliers.high),
  };
}

function formatZonePace(zone: number, racePaceSeconds: number): string {
  const { low, high } = getZonePaceRange(zone, racePaceSeconds);
  return `${formatPaceSeconds(low)} - ${formatPaceSeconds(high)}`;
}

// Flatten segments including nested repeat segments for the visual bar
function flattenSegments(segments: WorkoutSegment[]): { segment: WorkoutSegment; duration: number; zone: number }[] {
  const result: { segment: WorkoutSegment; duration: number; zone: number }[] = [];
  
  for (const segment of segments) {
    const zone = getIntensityFromSegment(segment);
    const duration = segment.duration_value || segment.distance_m || 300; // Default 5 min
    
    // Handle repeat segments - expand them
    if (segment.type === "repeat" && segment.segments && segment.repeat_count) {
      for (let i = 0; i < segment.repeat_count; i++) {
        for (const nested of segment.segments) {
          const nestedZone = getIntensityFromSegment(nested);
          const nestedDuration = nested.duration_value || nested.distance_m || 60;
          result.push({ segment: nested, duration: nestedDuration, zone: nestedZone });
        }
      }
    } else if (segment.segments && segment.segments.length > 0) {
      // Expand nested segments
      const nested = flattenSegments(segment.segments);
      result.push(...nested);
    } else {
      result.push({ segment, duration, zone });
    }
  }
  
  return result;
}

// Visual intensity bar component
function IntensityBar({ structure }: { structure: WorkoutStructureData }) {
  const flatSegments = flattenSegments(structure.segments);
  const totalDuration = flatSegments.reduce((sum, s) => sum + s.duration, 0) || 1;
  const maxZone = 5;
  const barHeight = 64; // Max height in pixels
  
  if (flatSegments.length === 0) return null;
  
  return (
    <div className="mb-6">
      {/* The intensity bar */}
      <div 
        className="flex items-end gap-[2px] h-16 bg-muted/30 rounded-lg p-2 overflow-hidden"
        style={{ minHeight: barHeight + 16 }}
      >
        {flatSegments.map((item, index) => {
          const widthPercent = Math.max(2, (item.duration / totalDuration) * 100);
          const heightPercent = (item.zone / maxZone) * 100;
          const color = intensityColors[item.zone] || intensityColors[2];
          
          return (
            <div
              key={index}
              className="rounded-sm transition-all duration-200 hover:opacity-80"
              style={{
                width: `${widthPercent}%`,
                height: `${heightPercent}%`,
                minWidth: "4px",
                backgroundColor: color,
              }}
              title={`${item.segment.name || getSegmentTypeName(item.segment.type)} - Zone ${item.zone}`}
            />
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          {[1, 2, 3, 4, 5].map((zone) => (
            <div key={zone} className="flex items-center gap-1.5">
              <div 
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: intensityColors[zone] }}
              />
              <span>Zone {zone}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SegmentBlock({ segment, isNested = false, racePaceSeconds }: { segment: WorkoutSegment; isNested?: boolean; racePaceSeconds?: number }) {
  const colors = segmentTypeColors[segment.type] || segmentTypeColors.steady;
  
  // Get segment name, with fallback to type
  const segmentName = segment.name || getSegmentTypeName(segment.type);
  
  // Handle alternative duration format (distance_m)
  const durationValue = segment.duration_value || segment.distance_m;
  const durationType = segment.duration_type || (segment.distance_m ? "distance" : undefined);
  
  // Handle alternative target format (intensity string like "Zone 2")
  const targetZone = segment.target_zone || parseZoneFromIntensity(segment.intensity);
  
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        colors.bg,
        colors.border,
        isNested && "ml-4"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{colors.icon}</span>
            <div>
              <p className="font-medium">{segmentName}</p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                {durationValue && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDuration(durationType, durationValue)}
                  </span>
                )}
                {(targetZone || segment.intensity) && (
                  <span className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" />
                    {targetZone ? `Zone ${targetZone}` : segment.intensity}
                  </span>
                )}
              {/* Show explicit pace if set, otherwise calculate from zone */}
              {(segment.target_pace_low || segment.target_pace_high) ? (
                <span className="flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5" />
                  {formatPace(segment.target_pace_low, segment.target_pace_high)}
                </span>
              ) : (targetZone && racePaceSeconds) && (
                <span className="flex items-center gap-1">
                  <Gauge className="h-3.5 w-3.5" />
                  {formatZonePace(targetZone, racePaceSeconds)} /km
                </span>
              )}
              {segment.repeat_count && (
                <span className="flex items-center gap-1">
                  <Repeat className="h-3.5 w-3.5" />
                  {segment.repeat_count}x
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {segment.notes && (
        <p className="text-sm text-muted-foreground mt-2 pl-11">
          💡 {segment.notes}
        </p>
      )}
      
      {/* Nested segments for repeat blocks */}
      {segment.segments && segment.segments.length > 0 && (
        <div className="mt-3 space-y-2">
          {segment.segments.map((nested, i) => (
            <SegmentBlock key={i} segment={nested} isNested racePaceSeconds={racePaceSeconds} />
          ))}
        </div>
      )}
    </div>
  );
}

export function WorkoutStructure({ structure, racePaceSeconds }: WorkoutStructureProps) {
  if (!structure?.segments || structure.segments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Geen gedetailleerde structuur beschikbaar</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Visual intensity bar */}
      <IntensityBar structure={structure} />

      {/* Detailed segments */}
      <div className="space-y-3">
        {structure.segments.map((segment, index) => (
          <SegmentBlock key={index} segment={segment} racePaceSeconds={racePaceSeconds} />
        ))}
      </div>

      {/* Summary - only show if we have estimates */}
      {(structure.estimated_duration_minutes || structure.estimated_distance_km) && (
        <div className="flex items-center justify-between pt-4 border-t text-sm text-muted-foreground">
          {structure.estimated_duration_minutes && (
            <span>Geschatte totale duur: {structure.estimated_duration_minutes} min</span>
          )}
          {structure.estimated_distance_km && (
            <span>Geschatte afstand: {structure.estimated_distance_km.toFixed(1)} km</span>
          )}
        </div>
      )}
    </div>
  );
}

