"use server";

import { createClient } from "@/lib/supabase/server";
import type { GoalType, ExperienceLevel, WorkoutType } from "@/types/database";
import {
  calculatePaceZones,
  formatPace,
  formatPaceRange,
  RACE_DISTANCES,
  type PaceZones,
} from "./pace-calculator";

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface PlanGeneratorInput {
  /** Race distance goal */
  goalType: GoalType;
  /** Target event date */
  eventDate: Date | null;
  /** Target finish time in minutes (e.g., 105 for 1:45:00) */
  targetTimeMinutes: number | null;
  /** User's running experience */
  experienceLevel: ExperienceLevel;
  /** Current weekly running distance */
  recentWeeklyKm: number;
  /** Longest recent run in km */
  longestRecentRun: number;
  /** Current easy pace in seconds per km */
  currentPace: number | null;
  /** Training days per week (3-7) */
  daysPerWeek: number;
  /** Total training hours per week */
  hoursPerWeek: number;
  /** Preferred training days */
  preferredDays: string[];
  /** Total weeks for the plan */
  weeksDuration: number;
  /** Long run preferred day */
  longRunDay?: string;
  /** Include strength training? */
  includeStrength?: boolean;
  /** Strength training days */
  strengthDays?: string[];
  /** Starting weekly distance in km (week 1) */
  startingWeeklyKm?: number;
}

export interface GeneratedWorkout {
  scheduled_date: string;
  week_number: number;
  day_of_week: number;
  workout_type: WorkoutType;
  title: string;
  description: string;
  target_duration_minutes: number;
  target_distance_km: number;
  target_pace_min_per_km: number | null;
  target_pace_range: string | null;
  target_heart_rate_zone: number | null;
  workout_structure: WorkoutStructure;
  coach_notes: string | null;
}

interface WorkoutStructure {
  segments: WorkoutSegment[];
  estimated_duration_minutes: number;
  estimated_distance_km: number;
}

interface WorkoutSegment {
  name: string;
  type: "warmup" | "main" | "cooldown" | "recovery" | "repeat";
  duration_type: "time" | "distance";
  duration_value: number;
  duration_unit: "minutes" | "km" | "meters";
  intensity: "easy" | "moderate" | "tempo" | "threshold" | "hard" | "max";
  target_pace?: string;
  target_hr_zone?: number;
  repeat_count?: number;
  segments?: WorkoutSegment[];
  notes?: string;
}

export interface WeeklySummary {
  week: number;
  weekType: "regular" | "recovery" | "peak" | "taper" | "race";
  phase: string;
  totalKm: number;
  workouts: {
    type: string;
    distance: number;
    day: string;
  }[];
  focus: string;
}

export interface GeneratePlanResult {
  success: boolean;
  plan?: {
    paceZones: PaceZones;
    phases: {
      name: string;
      weeks: number[];
      focus: string;
      volumeMultiplier: number;
    }[];
    weeklySummary: WeeklySummary[];
  };
  workouts?: GeneratedWorkout[];
  error?: string;
}

// ============================================================================
// Constants
// ============================================================================

const DAY_NAME_TO_NUMBER: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const DAY_NUMBER_TO_NAME: Record<number, string> = {
  0: "Zondag",
  1: "Maandag",
  2: "Dinsdag",
  3: "Woensdag",
  4: "Donderdag",
  5: "Vrijdag",
  6: "Zaterdag",
};

/** Base weekly km targets by goal type and experience level */
const BASE_WEEKLY_KM: Record<GoalType, Record<ExperienceLevel, number>> = {
  "5k": { beginner: 20, intermediate: 30, advanced: 45, elite: 60 },
  "10k": { beginner: 25, intermediate: 40, advanced: 55, elite: 75 },
  "15k": { beginner: 30, intermediate: 45, advanced: 60, elite: 80 },
  half_marathon: { beginner: 35, intermediate: 50, advanced: 70, elite: 90 },
  marathon: { beginner: 45, intermediate: 65, advanced: 90, elite: 120 },
  fitness: { beginner: 15, intermediate: 25, advanced: 40, elite: 50 },
  custom: { beginner: 20, intermediate: 35, advanced: 50, elite: 70 },
};

/** Recovery week frequency (every N weeks) */
const RECOVERY_WEEK_FREQUENCY = 4;

/** Recovery week volume reduction */
const RECOVERY_VOLUME_MULTIPLIER = 0.80;

/** Maximum weekly volume increase (progressive overload limit) */
const MAX_WEEKLY_INCREASE = 0.15; // 15%

// ============================================================================
// Main Generator Function
// ============================================================================

export async function generateTrainingPlan(
  input: PlanGeneratorInput
): Promise<GeneratePlanResult> {
  try {
    // 1. Calculate pace zones from goal time
    const paceZones = calculateGoalPaceZones(input);

    // 2. Build phase structure
    const phases = buildPhaseStructure(input.weeksDuration, input.goalType);

    // 3. Calculate weekly volumes
    const weeklyVolumes = calculateWeeklyVolumes(input, phases);

    // 4. Generate all workouts
    const workouts: GeneratedWorkout[] = [];
    const weeklySummary: WeeklySummary[] = [];
    const startDate = new Date();

    for (let week = 1; week <= input.weeksDuration; week++) {
      const phase = getPhaseForWeek(phases, week);
      const weekType = getWeekType(week, input.weeksDuration, phases);
      const weekVolume = weeklyVolumes[week - 1];

      // Generate workouts for this week
      const weekWorkouts = generateWeekWorkouts(
        week,
        weekType,
        weekVolume,
        phase,
        paceZones,
        input,
        startDate
      );

      workouts.push(...weekWorkouts);

      // Build weekly summary
      const summary: WeeklySummary = {
        week,
        weekType,
        phase: phase?.name || "Training",
        totalKm: Math.round(weekVolume * 10) / 10,
        workouts: weekWorkouts.map((w) => ({
          type: w.workout_type,
          distance: w.target_distance_km,
          day: DAY_NUMBER_TO_NAME[w.day_of_week],
        })),
        focus: phase?.focus || "Algemene training",
      };
      weeklySummary.push(summary);
    }

    return {
      success: true,
      plan: {
        paceZones,
        phases,
        weeklySummary,
      },
      workouts,
    };
  } catch (error) {
    console.error("Plan generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Onbekende fout bij genereren",
    };
  }
}

// ============================================================================
// Pace Zone Calculation
// ============================================================================

function calculateGoalPaceZones(input: PlanGeneratorInput): PaceZones {
  // If target time is provided, calculate from that
  if (input.targetTimeMinutes && input.goalType !== "fitness" && input.goalType !== "custom") {
    const distanceKm = RACE_DISTANCES[input.goalType as keyof typeof RACE_DISTANCES];
    if (distanceKm) {
      const goalTimeSeconds = input.targetTimeMinutes * 60;
      return calculatePaceZones(distanceKm, goalTimeSeconds);
    }
  }

  // Fallback: estimate from current pace or experience level
  let estimatedPace: number;
  if (input.currentPace) {
    estimatedPace = input.currentPace;
  } else {
    // Default paces by experience level (seconds per km)
    const defaultPaces: Record<ExperienceLevel, number> = {
      beginner: 420, // 7:00 min/km
      intermediate: 360, // 6:00 min/km
      advanced: 300, // 5:00 min/km
      elite: 240, // 4:00 min/km
    };
    estimatedPace = defaultPaces[input.experienceLevel];
  }

  // Calculate zones from estimated pace
  const distanceKm = input.goalType === "fitness" ? 5 : 
    (RACE_DISTANCES[input.goalType as keyof typeof RACE_DISTANCES] || 10);
  const goalTimeSeconds = estimatedPace * distanceKm;

  return calculatePaceZones(distanceKm, goalTimeSeconds);
}

// ============================================================================
// Phase Structure
// ============================================================================

interface Phase {
  name: string;
  weeks: number[];
  focus: string;
  volumeMultiplier: number;
}

function buildPhaseStructure(totalWeeks: number, goalType: GoalType): Phase[] {
  // For fitness goals, use a simpler structure
  if (goalType === "fitness") {
    return [
      {
        name: "Training",
        weeks: Array.from({ length: totalWeeks }, (_, i) => i + 1),
        focus: "Consistente opbouw",
        volumeMultiplier: 1.0,
      },
    ];
  }

  // Race-focused plans have distinct phases
  const phases: Phase[] = [];

  // Calculate phase lengths based on total duration
  let baseWeeks: number;
  let buildWeeks: number;
  let peakWeeks: number;
  let taperWeeks: number;

  if (totalWeeks <= 8) {
    baseWeeks = 2;
    buildWeeks = 3;
    peakWeeks = 2;
    taperWeeks = 1;
  } else if (totalWeeks <= 12) {
    baseWeeks = 3;
    buildWeeks = 4;
    peakWeeks = 3;
    taperWeeks = 2;
  } else if (totalWeeks <= 16) {
    baseWeeks = 4;
    buildWeeks = 5;
    peakWeeks = 4;
    taperWeeks = 3;
  } else {
    baseWeeks = Math.ceil(totalWeeks * 0.25);
    buildWeeks = Math.ceil(totalWeeks * 0.30);
    peakWeeks = Math.ceil(totalWeeks * 0.25);
    taperWeeks = Math.max(2, totalWeeks - baseWeeks - buildWeeks - peakWeeks);
  }

  let currentWeek = 1;

  // Base phase - build foundation
  phases.push({
    name: "Basis",
    weeks: Array.from({ length: baseWeeks }, (_, i) => currentWeek + i),
    focus: "Aerobe basis opbouwen",
    volumeMultiplier: 0.80,
  });
  currentWeek += baseWeeks;

  // Build phase - introduce speed work
  phases.push({
    name: "Opbouw",
    weeks: Array.from({ length: buildWeeks }, (_, i) => currentWeek + i),
    focus: "Snelheid en uithoudingsvermogen",
    volumeMultiplier: 1.0,
  });
  currentWeek += buildWeeks;

  // Peak phase - race specific training
  phases.push({
    name: "Piek",
    weeks: Array.from({ length: peakWeeks }, (_, i) => currentWeek + i),
    focus: "Race-specifieke training",
    volumeMultiplier: 1.10,
  });
  currentWeek += peakWeeks;

  // Taper phase - reduce volume, maintain intensity
  phases.push({
    name: "Taper",
    weeks: Array.from({ length: taperWeeks }, (_, i) => currentWeek + i),
    focus: "Herstel voor race",
    volumeMultiplier: 0.60,
  });

  return phases;
}

function getPhaseForWeek(phases: Phase[], week: number): Phase | undefined {
  return phases.find((p) => p.weeks.includes(week));
}

function getWeekType(
  week: number,
  totalWeeks: number,
  phases: Phase[]
): "regular" | "recovery" | "peak" | "taper" | "race" {
  // Last week is race week
  if (week === totalWeeks) {
    return "race";
  }

  // Check if in taper phase
  const phase = getPhaseForWeek(phases, week);
  if (phase?.name === "Taper") {
    return "taper";
  }

  // Check if in peak phase
  if (phase?.name === "Piek") {
    return "peak";
  }

  // Recovery week every RECOVERY_WEEK_FREQUENCY weeks (but not in first 2 weeks)
  if (week > 2 && week % RECOVERY_WEEK_FREQUENCY === 0) {
    return "recovery";
  }

  return "regular";
}

// ============================================================================
// Volume Calculation
// ============================================================================

function calculateWeeklyVolumes(input: PlanGeneratorInput, phases: Phase[]): number[] {
  const volumes: number[] = [];

  // Starting volume (either user-specified or calculated)
  const startingVolume = input.startingWeeklyKm || Math.max(input.recentWeeklyKm, 15);

  // Target peak volume based on goal and experience
  const targetPeakVolume = BASE_WEEKLY_KM[input.goalType]?.[input.experienceLevel] ||
    BASE_WEEKLY_KM.fitness[input.experienceLevel];

  // Calculate progressive increase
  const peakWeek = Math.floor(input.weeksDuration * 0.75); // Peak at ~75% of plan
  const weeklyIncrease = (targetPeakVolume - startingVolume) / peakWeek;

  for (let week = 1; week <= input.weeksDuration; week++) {
    const phase = getPhaseForWeek(phases, week);
    const weekType = getWeekType(week, input.weeksDuration, phases);

    // Base volume calculation with progressive overload
    let baseVolume: number;
    if (week <= peakWeek) {
      baseVolume = startingVolume + weeklyIncrease * (week - 1);
    } else {
      // After peak, maintain or reduce
      baseVolume = targetPeakVolume;
    }

    // Apply phase multiplier
    const phaseMultiplier = phase?.volumeMultiplier || 1.0;
    let weekVolume = baseVolume * phaseMultiplier;

    // Apply week type adjustments
    switch (weekType) {
      case "recovery":
        weekVolume *= RECOVERY_VOLUME_MULTIPLIER;
        break;
      case "taper":
        // Progressive taper reduction
        const taperPhase = phases.find((p) => p.name === "Taper");
        if (taperPhase) {
          const weekInTaper = week - taperPhase.weeks[0] + 1;
          const taperMultiplier = 1 - (weekInTaper * 0.2); // Reduce 20% per week
          weekVolume *= Math.max(0.3, taperMultiplier);
        }
        break;
      case "race":
        weekVolume *= 0.25; // Race week is very light
        break;
    }

    // Ensure we don't exceed max weekly increase from previous week
    if (volumes.length > 0) {
      const previousVolume = volumes[volumes.length - 1];
      const maxIncrease = previousVolume * (1 + MAX_WEEKLY_INCREASE);
      weekVolume = Math.min(weekVolume, maxIncrease);
    }

    volumes.push(Math.round(weekVolume * 10) / 10);
  }

  return volumes;
}

// ============================================================================
// Workout Generation
// ============================================================================

function generateWeekWorkouts(
  week: number,
  weekType: "regular" | "recovery" | "peak" | "taper" | "race",
  weekVolume: number,
  phase: Phase | undefined,
  paceZones: PaceZones,
  input: PlanGeneratorInput,
  startDate: Date
): GeneratedWorkout[] {
  const workouts: GeneratedWorkout[] = [];

  // Sort preferred days by day of week (monday first, etc.)
  const sortedDays = [...input.preferredDays].sort(
    (a, b) => DAY_NAME_TO_NUMBER[a] - DAY_NAME_TO_NUMBER[b]
  );

  // Determine long run day (user preference or last day of the week)
  const longRunDay = input.longRunDay || sortedDays[sortedDays.length - 1];
  
  // Track which days are already used
  const usedDays = new Set<string>();

  // Calculate workout distribution based on week type and phase
  const distribution = getWorkoutDistribution(weekType, phase?.name, input.daysPerWeek);

  // Long run (always on designated day)
  if (distribution.longRun > 0) {
    const longRunVolume = weekVolume * distribution.longRun;
    workouts.push(
      createLongRunWorkout(week, longRunDay, longRunVolume, paceZones, input, startDate, weekType)
    );
    usedDays.add(longRunDay);
  }

  // Get available days for other workouts (excluding long run day)
  const availableDays = sortedDays.filter((d) => !usedDays.has(d));

  // Speed work (intervals or tempo) - on first available day
  if (distribution.speedWork > 0 && availableDays.length > 0) {
    const speedDay = availableDays[0];
    const speedVolume = weekVolume * distribution.speedWork;
    const useInterval = week % 2 === 1; // Alternate between intervals and tempo
    workouts.push(
      createSpeedWorkout(
        week,
        speedDay,
        speedVolume,
        paceZones,
        input,
        startDate,
        weekType,
        useInterval
      )
    );
    usedDays.add(speedDay);
  }

  // Easy runs (fill remaining available days)
  const easyDays = sortedDays.filter((d) => !usedDays.has(d));
  const remainingVolume = Math.max(0, weekVolume - workouts.reduce((sum, w) => sum + w.target_distance_km, 0));
  const easyRunCount = Math.min(easyDays.length, distribution.easyRuns);
  const volumePerEasyRun = easyRunCount > 0 ? remainingVolume / easyRunCount : 0;

  for (let i = 0; i < easyRunCount; i++) {
    workouts.push(
      createEasyRunWorkout(
        week,
        easyDays[i],
        volumePerEasyRun,
        paceZones,
        input,
        startDate,
        weekType
      )
    );
    usedDays.add(easyDays[i]);
  }

  // Sort workouts by day of week
  workouts.sort((a, b) => {
    const dayA = (a.day_of_week + 7) % 7;
    const dayB = (b.day_of_week + 7) % 7;
    return dayA - dayB;
  });

  return workouts;
}

interface WorkoutDistribution {
  longRun: number; // % of weekly volume
  speedWork: number; // % of weekly volume
  easyRuns: number; // count
}

function getWorkoutDistribution(
  weekType: string,
  phaseName: string | undefined,
  daysPerWeek: number
): WorkoutDistribution {
  // Base distribution: Long ~50%, Speed ~25-30%, Easy ~20-25%
  
  if (weekType === "race") {
    return { longRun: 0, speedWork: 0.3, easyRuns: Math.max(1, daysPerWeek - 1) };
  }

  if (weekType === "taper") {
    return { longRun: 0.4, speedWork: 0.25, easyRuns: Math.max(1, daysPerWeek - 2) };
  }

  if (weekType === "recovery") {
    return { longRun: 0.45, speedWork: 0.15, easyRuns: Math.max(1, daysPerWeek - 2) };
  }

  // Regular weeks by phase
  switch (phaseName) {
    case "Basis":
      return { longRun: 0.50, speedWork: 0.15, easyRuns: Math.max(1, daysPerWeek - 2) };
    case "Opbouw":
      return { longRun: 0.45, speedWork: 0.25, easyRuns: Math.max(1, daysPerWeek - 2) };
    case "Piek":
      return { longRun: 0.50, speedWork: 0.30, easyRuns: Math.max(1, daysPerWeek - 2) };
    default:
      return { longRun: 0.45, speedWork: 0.25, easyRuns: Math.max(1, daysPerWeek - 2) };
  }
}

// ============================================================================
// Individual Workout Creators
// ============================================================================

function createLongRunWorkout(
  week: number,
  dayName: string,
  distance: number,
  paceZones: PaceZones,
  input: PlanGeneratorInput,
  startDate: Date,
  weekType: string
): GeneratedWorkout {
  const paceRange = formatPaceRange(paceZones.longRunPace);
  const duration = Math.round((distance / 1000) * paceZones.longRunPace.max / 60);

  // Special long run variations for peak weeks
  let description = `Lange duurloop van ${Math.round(distance * 10) / 10} km op ${paceRange} min/km tempo (HR Zone 2-3).`;
  let notes = "Houd een comfortabel tempo aan waarbij je nog kunt praten.";

  if (weekType === "peak" && week > 10) {
    description += ` Inclusief 2x 3km op race tempo.`;
    notes = "Start rustig, voeg de race tempo blokken toe in het midden van de loop.";
  }

  const structure: WorkoutStructure = {
    segments: [
      {
        name: "Opwarming",
        type: "warmup",
        duration_type: "time",
        duration_value: 10,
        duration_unit: "minutes",
        intensity: "easy",
        target_hr_zone: 2,
      },
      {
        name: "Hoofddeel",
        type: "main",
        duration_type: "distance",
        duration_value: Math.round((distance - 2) * 1000),
        duration_unit: "meters",
        intensity: "moderate",
        target_pace: paceRange,
        target_hr_zone: 2,
      },
      {
        name: "Cooldown",
        type: "cooldown",
        duration_type: "time",
        duration_value: 5,
        duration_unit: "minutes",
        intensity: "easy",
        target_hr_zone: 1,
      },
    ],
    estimated_duration_minutes: duration,
    estimated_distance_km: distance,
  };

  return {
    scheduled_date: calculateScheduledDate(startDate, week, dayName),
    week_number: week,
    day_of_week: DAY_NAME_TO_NUMBER[dayName],
    workout_type: "long_run",
    title: "Lange Duurloop",
    description,
    target_duration_minutes: duration,
    target_distance_km: Math.round(distance * 10) / 10,
    target_pace_min_per_km: paceZones.longRunPace.max / 60,
    target_pace_range: paceRange,
    target_heart_rate_zone: 2,
    workout_structure: structure,
    coach_notes: notes,
  };
}

function createSpeedWorkout(
  week: number,
  dayName: string,
  distance: number,
  paceZones: PaceZones,
  input: PlanGeneratorInput,
  startDate: Date,
  weekType: string,
  isInterval: boolean
): GeneratedWorkout {
  if (isInterval) {
    return createIntervalWorkout(week, dayName, distance, paceZones, input, startDate, weekType);
  } else {
    return createTempoWorkout(week, dayName, distance, paceZones, input, startDate, weekType);
  }
}

function createIntervalWorkout(
  week: number,
  dayName: string,
  distance: number,
  paceZones: PaceZones,
  input: PlanGeneratorInput,
  startDate: Date,
  weekType: string
): GeneratedWorkout {
  const intervalPaceRange = formatPaceRange(paceZones.intervalPace);
  const recoveryPaceRange = formatPaceRange(paceZones.recoveryPace);

  // Calculate interval structure based on distance and experience
  const warmupCooldown = 3; // km total
  const mainDistance = Math.max(2, distance - warmupCooldown);

  // Progress interval length through the plan
  let intervalLength: number; // in meters
  let repeatCount: number;

  if (input.experienceLevel === "beginner") {
    intervalLength = 400;
    repeatCount = Math.min(6, Math.floor(mainDistance / 0.8)); // Include recovery
  } else if (input.experienceLevel === "intermediate") {
    intervalLength = week > 8 ? 800 : 400;
    repeatCount = Math.min(8, Math.floor(mainDistance / (intervalLength === 800 ? 1.6 : 0.8)));
  } else {
    intervalLength = week > 10 ? 1000 : week > 5 ? 800 : 400;
    repeatCount = Math.min(10, Math.floor(mainDistance / ((intervalLength / 1000) * 2)));
  }

  const duration = Math.round((distance / 1000) * paceZones.tempoPace.max / 60);

  const structure: WorkoutStructure = {
    segments: [
      {
        name: "Opwarming",
        type: "warmup",
        duration_type: "distance",
        duration_value: 1500,
        duration_unit: "meters",
        intensity: "easy",
        target_hr_zone: 2,
      },
      {
        name: "Intervallen",
        type: "repeat",
        duration_type: "distance",
        duration_value: intervalLength,
        duration_unit: "meters",
        intensity: "hard",
        target_pace: intervalPaceRange,
        target_hr_zone: 4,
        repeat_count: repeatCount,
        segments: [
          {
            name: "Hard",
            type: "main",
            duration_type: "distance",
            duration_value: intervalLength,
            duration_unit: "meters",
            intensity: "hard",
            target_pace: intervalPaceRange,
            target_hr_zone: 4,
          },
          {
            name: "Herstel",
            type: "recovery",
            duration_type: "time",
            duration_value: intervalLength <= 400 ? 2 : 3,
            duration_unit: "minutes",
            intensity: "easy",
            target_hr_zone: 2,
            notes: "Rustig joggen of wandelen",
          },
        ],
      },
      {
        name: "Cooldown",
        type: "cooldown",
        duration_type: "distance",
        duration_value: 1500,
        duration_unit: "meters",
        intensity: "easy",
        target_hr_zone: 2,
      },
    ],
    estimated_duration_minutes: duration,
    estimated_distance_km: distance,
  };

  return {
    scheduled_date: calculateScheduledDate(startDate, week, dayName),
    week_number: week,
    day_of_week: DAY_NAME_TO_NUMBER[dayName],
    workout_type: "interval",
    title: `Interval Training (${repeatCount}x ${intervalLength}m)`,
    description: `${repeatCount}x ${intervalLength}m intervallen op ${intervalPaceRange} min/km met ${intervalLength <= 400 ? "2" : "3"} min herstel.`,
    target_duration_minutes: duration,
    target_distance_km: Math.round(distance * 10) / 10,
    target_pace_min_per_km: paceZones.intervalPace.max / 60,
    target_pace_range: intervalPaceRange,
    target_heart_rate_zone: 4,
    workout_structure: structure,
    coach_notes: "Warm goed op! Focus op consistente splits.",
  };
}

function createTempoWorkout(
  week: number,
  dayName: string,
  distance: number,
  paceZones: PaceZones,
  input: PlanGeneratorInput,
  startDate: Date,
  weekType: string
): GeneratedWorkout {
  const tempoPaceRange = formatPaceRange(paceZones.tempoPace);

  // Tempo block length increases through the plan
  const warmupCooldown = 3; // km total
  const tempoDistance = Math.max(3, Math.round((distance - warmupCooldown) * 10) / 10);

  const duration = Math.round((distance / 1000) * paceZones.tempoPace.max / 60);

  const structure: WorkoutStructure = {
    segments: [
      {
        name: "Opwarming",
        type: "warmup",
        duration_type: "distance",
        duration_value: 1500,
        duration_unit: "meters",
        intensity: "easy",
        target_hr_zone: 2,
      },
      {
        name: "Tempo blok",
        type: "main",
        duration_type: "distance",
        duration_value: tempoDistance * 1000,
        duration_unit: "meters",
        intensity: "tempo",
        target_pace: tempoPaceRange,
        target_hr_zone: 3,
      },
      {
        name: "Cooldown",
        type: "cooldown",
        duration_type: "distance",
        duration_value: 1500,
        duration_unit: "meters",
        intensity: "easy",
        target_hr_zone: 2,
      },
    ],
    estimated_duration_minutes: duration,
    estimated_distance_km: distance,
  };

  return {
    scheduled_date: calculateScheduledDate(startDate, week, dayName),
    week_number: week,
    day_of_week: DAY_NAME_TO_NUMBER[dayName],
    workout_type: "tempo_run",
    title: `Tempo Run (${tempoDistance} km)`,
    description: `${tempoDistance} km op tempo pace (${tempoPaceRange} min/km). Comfortabel hard - je kunt nog korte zinnen spreken.`,
    target_duration_minutes: duration,
    target_distance_km: Math.round(distance * 10) / 10,
    target_pace_min_per_km: paceZones.tempoPace.max / 60,
    target_pace_range: tempoPaceRange,
    target_heart_rate_zone: 3,
    workout_structure: structure,
    coach_notes: "Tempo runs bouwen lactaatdrempel op. Blijf consistent!",
  };
}

function createEasyRunWorkout(
  week: number,
  dayName: string,
  distance: number,
  paceZones: PaceZones,
  input: PlanGeneratorInput,
  startDate: Date,
  weekType: string
): GeneratedWorkout {
  const easyPaceRange = formatPaceRange(paceZones.easyPace);
  const duration = Math.round((distance / 1000) * paceZones.easyPace.max / 60);

  const structure: WorkoutStructure = {
    segments: [
      {
        name: "Easy run",
        type: "main",
        duration_type: "distance",
        duration_value: distance * 1000,
        duration_unit: "meters",
        intensity: "easy",
        target_pace: easyPaceRange,
        target_hr_zone: 2,
      },
    ],
    estimated_duration_minutes: duration,
    estimated_distance_km: distance,
  };

  return {
    scheduled_date: calculateScheduledDate(startDate, week, dayName),
    week_number: week,
    day_of_week: DAY_NAME_TO_NUMBER[dayName],
    workout_type: "easy_run",
    title: "Easy Run",
    description: `Rustige duurloop van ${Math.round(distance * 10) / 10} km op ${easyPaceRange} min/km. Houd het comfortabel!`,
    target_duration_minutes: duration,
    target_distance_km: Math.round(distance * 10) / 10,
    target_pace_min_per_km: paceZones.easyPace.max / 60,
    target_pace_range: easyPaceRange,
    target_heart_rate_zone: 2,
    workout_structure: structure,
    coach_notes: "Easy runs zijn essentieel voor herstel. Ga niet te snel!",
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculateScheduledDate(startDate: Date, weekNumber: number, dayName: string): string {
  const date = new Date(startDate);
  const currentDay = date.getDay();
  const targetDay = DAY_NAME_TO_NUMBER[dayName];

  // Calculate days from start date to the target day
  // The modulo handles wrap-around (e.g., Saturday to Sunday is 1 day, not -6)
  let daysToTargetDay = (targetDay - currentDay + 7) % 7;
  
  // If target day is same as current day and it's week 1, schedule for today
  // Otherwise for week 1, schedule for the next occurrence of that day
  if (daysToTargetDay === 0 && weekNumber > 1) {
    daysToTargetDay = 7;
  }

  // Add weeks offset (week 1 = 0 extra weeks, week 2 = 1 extra week, etc.)
  const totalDaysToAdd = daysToTargetDay + (weekNumber - 1) * 7;

  date.setDate(date.getDate() + totalDaysToAdd);

  return date.toISOString().split("T")[0];
}

