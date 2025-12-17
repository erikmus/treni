/**
 * TCX (Training Center XML) File Parser
 * 
 * Parses Garmin TCX files and extracts activity data.
 * Uses fast-xml-parser for server-side XML parsing.
 * 
 * TCX files contain detailed workout information including:
 * - Time, distance, and duration
 * - Heart rate data
 * - GPS coordinates (latitude/longitude)
 * - Speed and pace
 * - Cadence
 * - Calories
 * - Laps/splits
 */

import { XMLParser } from "fast-xml-parser";

export interface TCXLap {
  startTime: string;
  totalTimeSeconds: number;
  distanceMeters: number;
  maximumSpeed?: number;
  calories: number;
  averageHeartRateBpm?: number;
  maximumHeartRateBpm?: number;
  intensity?: string;
  cadence?: number;
  triggerMethod?: string;
}

export interface TCXTrackpoint {
  time: string;
  latitude?: number;
  longitude?: number;
  altitudeMeters?: number;
  distanceMeters?: number;
  heartRateBpm?: number;
  cadence?: number;
  speed?: number;
}

export interface TCXActivity {
  sport: string;
  id: string; // Usually the start timestamp
  startTime: Date;
  totalTimeSeconds: number;
  distanceMeters: number;
  calories: number;
  averageHeartRateBpm?: number;
  maximumHeartRateBpm?: number;
  averageCadence?: number;
  averageSpeed?: number; // m/s
  averagePaceSecPerKm?: number;
  bestPaceSecPerKm?: number;
  elevationGainMeters?: number;
  elevationLossMeters?: number;
  laps: TCXLap[];
  trackpoints: TCXTrackpoint[];
  deviceName?: string;
}

export interface ParsedTCX {
  activities: TCXActivity[];
}

// Helper to ensure we always have an array
function ensureArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

// Helper to get nested value safely
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * Parse a TCX lap object
 */
function parseLap(lapData: Record<string, unknown>): TCXLap {
  const lap: TCXLap = {
    startTime: (lapData["@_StartTime"] as string) || "",
    totalTimeSeconds: Number(lapData.TotalTimeSeconds) || 0,
    distanceMeters: Number(lapData.DistanceMeters) || 0,
    calories: Number(lapData.Calories) || 0,
  };

  // MaximumSpeed
  if (lapData.MaximumSpeed !== undefined) {
    lap.maximumSpeed = Number(lapData.MaximumSpeed);
  }

  // Average heart rate
  const avgHr = getNestedValue(lapData, "AverageHeartRateBpm.Value");
  if (avgHr !== undefined) {
    lap.averageHeartRateBpm = Number(avgHr);
  }

  // Maximum heart rate
  const maxHr = getNestedValue(lapData, "MaximumHeartRateBpm.Value");
  if (maxHr !== undefined) {
    lap.maximumHeartRateBpm = Number(maxHr);
  }

  // Intensity
  if (lapData.Intensity) {
    lap.intensity = String(lapData.Intensity);
  }

  // Cadence
  if (lapData.Cadence !== undefined) {
    lap.cadence = Number(lapData.Cadence);
  }

  // Extensions - look for AvgRunCadence
  const extensions = lapData.Extensions as Record<string, unknown> | undefined;
  if (extensions && !lap.cadence) {
    // Try different extension formats
    const lx = extensions.LX as Record<string, unknown> | undefined;
    if (lx?.AvgRunCadence !== undefined) {
      lap.cadence = Number(lx.AvgRunCadence);
    }
    // Also try ns3:LX format (Garmin specific)
    const ns3Lx = extensions["ns3:LX"] as Record<string, unknown> | undefined;
    if (ns3Lx?.AvgRunCadence !== undefined) {
      lap.cadence = Number(ns3Lx.AvgRunCadence);
    }
  }

  // Trigger method
  if (lapData.TriggerMethod) {
    lap.triggerMethod = String(lapData.TriggerMethod);
  }

  return lap;
}

/**
 * Parse a TCX trackpoint object
 */
function parseTrackpoint(tpData: Record<string, unknown>): TCXTrackpoint {
  const trackpoint: TCXTrackpoint = {
    time: String(tpData.Time || ""),
  };

  // Position
  const position = tpData.Position as Record<string, unknown> | undefined;
  if (position) {
    if (position.LatitudeDegrees !== undefined) {
      trackpoint.latitude = Number(position.LatitudeDegrees);
    }
    if (position.LongitudeDegrees !== undefined) {
      trackpoint.longitude = Number(position.LongitudeDegrees);
    }
  }

  // Altitude
  if (tpData.AltitudeMeters !== undefined) {
    trackpoint.altitudeMeters = Number(tpData.AltitudeMeters);
  }

  // Distance
  if (tpData.DistanceMeters !== undefined) {
    trackpoint.distanceMeters = Number(tpData.DistanceMeters);
  }

  // Heart rate
  const hr = getNestedValue(tpData, "HeartRateBpm.Value");
  if (hr !== undefined) {
    trackpoint.heartRateBpm = Number(hr);
  }

  // Cadence
  if (tpData.Cadence !== undefined) {
    trackpoint.cadence = Number(tpData.Cadence);
  }

  // Extensions
  const extensions = tpData.Extensions as Record<string, unknown> | undefined;
  if (extensions) {
    // Try different extension formats for speed
    const tpx = extensions.TPX as Record<string, unknown> | undefined;
    if (tpx?.Speed !== undefined) {
      trackpoint.speed = Number(tpx.Speed);
    }
    if (!trackpoint.cadence && tpx?.RunCadence !== undefined) {
      trackpoint.cadence = Number(tpx.RunCadence);
    }
    
    // ns3:TPX format
    const ns3Tpx = extensions["ns3:TPX"] as Record<string, unknown> | undefined;
    if (ns3Tpx?.Speed !== undefined) {
      trackpoint.speed = Number(ns3Tpx.Speed);
    }
    if (!trackpoint.cadence && ns3Tpx?.RunCadence !== undefined) {
      trackpoint.cadence = Number(ns3Tpx.RunCadence);
    }
  }

  return trackpoint;
}

/**
 * Calculate elevation gain and loss from trackpoints
 */
function calculateElevation(trackpoints: TCXTrackpoint[]): { gain: number; loss: number } {
  let gain = 0;
  let loss = 0;
  let prevAltitude: number | null = null;

  for (const tp of trackpoints) {
    if (tp.altitudeMeters !== undefined) {
      if (prevAltitude !== null) {
        const diff = tp.altitudeMeters - prevAltitude;
        if (diff > 0) {
          gain += diff;
        } else {
          loss += Math.abs(diff);
        }
      }
      prevAltitude = tp.altitudeMeters;
    }
  }

  return { gain, loss };
}

/**
 * Map TCX sport type to our activity type
 */
function mapSportToActivityType(sport: string): string {
  const sportLower = sport.toLowerCase();
  
  if (sportLower === "running" || sportLower === "run") return "run";
  if (sportLower === "biking" || sportLower === "cycling" || sportLower === "bike") return "cycling";
  if (sportLower === "swimming" || sportLower === "swim") return "swimming";
  if (sportLower === "walking" || sportLower === "walk") return "walk";
  if (sportLower.includes("cross") || sportLower.includes("training")) return "cross_training";
  
  return "other";
}

/**
 * Parse a TCX activity object
 */
function parseActivity(activityData: Record<string, unknown>): TCXActivity {
  const sport = (activityData["@_Sport"] as string) || "Other";
  const id = (activityData.Id as string) || "";
  
  // Parse all laps
  const lapsData = ensureArray(activityData.Lap as Record<string, unknown> | Record<string, unknown>[]);
  const laps: TCXLap[] = lapsData.map(parseLap);

  // Parse all trackpoints from all tracks in all laps
  const trackpoints: TCXTrackpoint[] = [];
  for (const lapData of lapsData) {
    const tracks = ensureArray(lapData.Track as Record<string, unknown> | Record<string, unknown>[]);
    for (const track of tracks) {
      const tps = ensureArray(track.Trackpoint as Record<string, unknown> | Record<string, unknown>[]);
      for (const tp of tps) {
        trackpoints.push(parseTrackpoint(tp));
      }
    }
  }

  // Aggregate totals from laps
  const totalTimeSeconds = laps.reduce((sum, lap) => sum + lap.totalTimeSeconds, 0);
  const distanceMeters = laps.reduce((sum, lap) => sum + lap.distanceMeters, 0);
  const calories = laps.reduce((sum, lap) => sum + lap.calories, 0);

  // Calculate average heart rate
  const hrLaps = laps.filter(lap => lap.averageHeartRateBpm !== undefined);
  const averageHeartRateBpm = hrLaps.length > 0
    ? Math.round(hrLaps.reduce((sum, lap) => sum + (lap.averageHeartRateBpm || 0), 0) / hrLaps.length)
    : undefined;

  // Get maximum heart rate
  const maxHrs = laps.map(lap => lap.maximumHeartRateBpm).filter((hr): hr is number => hr !== undefined);
  const maximumHeartRateBpm = maxHrs.length > 0 ? Math.max(...maxHrs) : undefined;

  // Calculate average cadence
  const cadenceLaps = laps.filter(lap => lap.cadence !== undefined);
  const averageCadence = cadenceLaps.length > 0
    ? Math.round(cadenceLaps.reduce((sum, lap) => sum + (lap.cadence || 0), 0) / cadenceLaps.length)
    : undefined;

  // Calculate average speed (m/s) and pace
  const averageSpeed = totalTimeSeconds > 0 ? distanceMeters / totalTimeSeconds : 0;
  const averagePaceSecPerKm = averageSpeed > 0 ? Math.round(1000 / averageSpeed) : undefined;

  // Calculate best pace from trackpoints with speed
  const speedTps = trackpoints.filter(tp => tp.speed !== undefined && tp.speed > 0);
  let bestPaceSecPerKm: number | undefined;
  if (speedTps.length > 0) {
    const maxSpeed = Math.max(...speedTps.map(tp => tp.speed!));
    bestPaceSecPerKm = maxSpeed > 0 ? Math.round(1000 / maxSpeed) : undefined;
  }

  // Calculate elevation
  const elevation = calculateElevation(trackpoints);

  // Get device name from Creator element if available
  const creator = activityData.Creator as Record<string, unknown> | undefined;
  const deviceName = creator?.Name ? String(creator.Name) : undefined;

  const startTime = new Date(id);

  return {
    sport: mapSportToActivityType(sport),
    id,
    startTime,
    totalTimeSeconds,
    distanceMeters,
    calories,
    averageHeartRateBpm,
    maximumHeartRateBpm,
    averageCadence,
    averageSpeed,
    averagePaceSecPerKm,
    bestPaceSecPerKm,
    elevationGainMeters: elevation.gain > 0 ? elevation.gain : undefined,
    elevationLossMeters: elevation.loss > 0 ? elevation.loss : undefined,
    laps,
    trackpoints,
    deviceName,
  };
}

/**
 * Parse a TCX file content (XML string)
 */
export function parseTCX(xmlContent: string): ParsedTCX {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseTagValue: true,
    parseAttributeValue: true,
    trimValues: true,
  });

  let parsed: Record<string, unknown>;
  try {
    parsed = parser.parse(xmlContent) as Record<string, unknown>;
  } catch (error) {
    throw new Error(`Invalid TCX file: ${error instanceof Error ? error.message : "Parsing failed"}`);
  }

  // Navigate to activities
  const tcdb = parsed.TrainingCenterDatabase as Record<string, unknown> | undefined;
  if (!tcdb) {
    throw new Error("Invalid TCX file: Missing TrainingCenterDatabase element");
  }

  const activitiesContainer = tcdb.Activities as Record<string, unknown> | undefined;
  if (!activitiesContainer) {
    throw new Error("Invalid TCX file: Missing Activities element");
  }

  const activitiesData = ensureArray(
    activitiesContainer.Activity as Record<string, unknown> | Record<string, unknown>[]
  );

  if (activitiesData.length === 0) {
    throw new Error("No activities found in TCX file");
  }

  const activities = activitiesData.map(parseActivity);

  return { activities };
}

/**
 * Convert trackpoints to GPX-like data structure for storage
 */
export function trackpointsToGpxData(trackpoints: TCXTrackpoint[]): object | null {
  const points = trackpoints
    .filter(tp => tp.latitude !== undefined && tp.longitude !== undefined)
    .map(tp => ({
      lat: tp.latitude,
      lon: tp.longitude,
      ele: tp.altitudeMeters,
      time: tp.time,
      hr: tp.heartRateBpm,
      cad: tp.cadence,
    }));

  return points.length > 0 ? { track: points } : null;
}

/**
 * Convert laps to splits data structure for storage
 */
export function lapsToSplitsData(laps: TCXLap[]): object | null {
  if (laps.length === 0) return null;

  const splits = laps.map((lap, index) => ({
    lapNumber: index + 1,
    startTime: lap.startTime,
    durationSeconds: lap.totalTimeSeconds,
    distanceMeters: lap.distanceMeters,
    paceSecPerKm: lap.distanceMeters > 0 
      ? Math.round((lap.totalTimeSeconds / lap.distanceMeters) * 1000)
      : null,
    avgHeartRate: lap.averageHeartRateBpm,
    maxHeartRate: lap.maximumHeartRateBpm,
    cadence: lap.cadence,
    calories: lap.calories,
  }));

  return { splits };
}
