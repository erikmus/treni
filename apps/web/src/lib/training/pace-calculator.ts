/**
 * Pace Calculator & Training Zone Calculator
 * Based on analysis of Year Round Running and standard running science
 */

export interface PaceZones {
  /** Race goal pace in seconds per km */
  goalPace: number;
  /** Easy run pace range (slow, comfortable) */
  easyPace: { min: number; max: number };
  /** Long run pace range */
  longRunPace: { min: number; max: number };
  /** Tempo/threshold pace range */
  tempoPace: { min: number; max: number };
  /** Interval pace range */
  intervalPace: { min: number; max: number };
  /** Recovery pace range (very easy) */
  recoveryPace: { min: number; max: number };
  /** Heart rate zones */
  hrZones: {
    zone1: string; // Recovery
    zone2: string; // Easy/Aerobic
    zone3: string; // Tempo
    zone4: string; // Threshold
    zone5: string; // VO2max/Interval
  };
}

export interface RaceTimeInput {
  distanceKm: number;
  timeSeconds: number;
}

/**
 * Predicts race time for a target distance using Riegel's formula
 * T2 = T1 × (D2/D1)^1.06
 */
export function predictRaceTime(
  knownRace: RaceTimeInput,
  targetDistanceKm: number
): number {
  const exponent = 1.06;
  const ratio = targetDistanceKm / knownRace.distanceKm;
  return knownRace.timeSeconds * Math.pow(ratio, exponent);
}

/**
 * Calculate pace zones based on goal time and race distance
 */
export function calculatePaceZones(
  goalDistanceKm: number,
  goalTimeSeconds: number
): PaceZones {
  const goalPace = goalTimeSeconds / goalDistanceKm; // seconds per km

  // Pace zone multipliers based on Year Round Running analysis
  // Easy: +15% to +30% slower than goal
  // Long: +5% to +20% slower than goal
  // Tempo: goal ± 5%
  // Interval: 10-15% faster than goal
  // Recovery: +20% to +35% slower than goal

  return {
    goalPace,
    easyPace: {
      min: Math.round(goalPace * 1.15),
      max: Math.round(goalPace * 1.30),
    },
    longRunPace: {
      min: Math.round(goalPace * 1.05),
      max: Math.round(goalPace * 1.20),
    },
    tempoPace: {
      min: Math.round(goalPace * 0.95),
      max: Math.round(goalPace * 1.05),
    },
    intervalPace: {
      min: Math.round(goalPace * 0.85),
      max: Math.round(goalPace * 0.95),
    },
    recoveryPace: {
      min: Math.round(goalPace * 1.20),
      max: Math.round(goalPace * 1.35),
    },
    hrZones: {
      zone1: "50-60% max HR",
      zone2: "60-70% max HR",
      zone3: "70-80% max HR",
      zone4: "80-90% max HR",
      zone5: "90-100% max HR",
    },
  };
}

/**
 * Calculate estimated heart rate zones based on age
 * Uses Karvonen formula: Target HR = ((Max HR − Resting HR) × %Intensity) + Resting HR
 * Simplified version without resting HR
 */
export function calculateHRZones(
  age: number,
  restingHR?: number
): {
  maxHR: number;
  zones: { zone: number; min: number; max: number; description: string }[];
} {
  // Max HR = 220 - age (classic formula)
  // Alternative: 207 - (0.7 × age) (more accurate for trained athletes)
  const maxHR = Math.round(207 - 0.7 * age);
  const rhr = restingHR || 60;

  const calculateZone = (minPercent: number, maxPercent: number): { min: number; max: number } => {
    // Karvonen formula
    const hrReserve = maxHR - rhr;
    return {
      min: Math.round(rhr + hrReserve * minPercent),
      max: Math.round(rhr + hrReserve * maxPercent),
    };
  };

  return {
    maxHR,
    zones: [
      { zone: 1, ...calculateZone(0.5, 0.6), description: "Herstel - Zeer licht" },
      { zone: 2, ...calculateZone(0.6, 0.7), description: "Aeroob - Makkelijk praten" },
      { zone: 3, ...calculateZone(0.7, 0.8), description: "Tempo - Zwaar ademhalen" },
      { zone: 4, ...calculateZone(0.8, 0.9), description: "Drempel - Kort praten" },
      { zone: 5, ...calculateZone(0.9, 1.0), description: "VO2max - Maximaal" },
    ],
  };
}

/**
 * Format pace from seconds per km to MM:SS string
 */
export function formatPace(secondsPerKm: number): string {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Format pace range
 */
export function formatPaceRange(range: { min: number; max: number }): string {
  return `${formatPace(range.min)}-${formatPace(range.max)}`;
}

/**
 * Parse pace string (MM:SS) to seconds per km
 */
export function parsePace(paceString: string): number {
  const [minutes, seconds] = paceString.split(":").map(Number);
  return minutes * 60 + (seconds || 0);
}

/**
 * Convert time to seconds
 */
export function timeToSeconds(hours: number, minutes: number, seconds: number = 0): number {
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Format seconds to HH:MM:SS or MM:SS
 */
export function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Standard race distances in km
 */
export const RACE_DISTANCES = {
  "5k": 5,
  "10k": 10,
  "15k": 15,
  half_marathon: 21.0975,
  marathon: 42.195,
} as const;

/**
 * Estimate VO2max from race performance
 * Based on Jack Daniels' VDOT formula (simplified)
 */
export function estimateVO2max(distanceKm: number, timeSeconds: number): number {
  const velocity = (distanceKm * 1000) / timeSeconds; // m/s
  const velocityMpm = velocity * 60; // m/min

  // Simplified VO2max estimation
  // Based on: VO2 = -4.60 + 0.182258 × velocity + 0.000104 × velocity²
  const vo2 = -4.6 + 0.182258 * velocityMpm + 0.000104 * velocityMpm * velocityMpm;

  // Adjust for race duration (longer = lower percentage of VO2max used)
  const timeMinutes = timeSeconds / 60;
  let percentVO2max: number;
  
  if (timeMinutes <= 10) {
    percentVO2max = 0.98;
  } else if (timeMinutes <= 30) {
    percentVO2max = 0.92;
  } else if (timeMinutes <= 60) {
    percentVO2max = 0.88;
  } else if (timeMinutes <= 120) {
    percentVO2max = 0.85;
  } else {
    percentVO2max = 0.80;
  }

  return Math.round((vo2 / percentVO2max) * 10) / 10;
}

