"use server";

import { createClient } from "@/lib/supabase/server";
import type { GoalType, ExperienceLevel, WorkoutType } from "@/types/database";

export interface GeneratePlanInput {
  goalType: GoalType;
  eventDate: Date | null;
  targetTimeMinutes: number | null;
  experienceLevel: ExperienceLevel;
  recentWeeklyKm: number;
  longestRecentRun: number;
  currentPace: number | null;
  daysPerWeek: number;
  hoursPerWeek: number;
  preferredDays: string[];
  weeksDuration: number;
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
  target_heart_rate_zone: number | null;
  workout_structure: Record<string, unknown>;
  coach_notes: string | null;
}

export interface GeneratePlanResult {
  success: boolean;
  plan?: {
    phases: {
      name: string;
      weeks: number[];
      focus: string;
    }[];
    weekly_summary: {
      week: number;
      phase: string;
      total_km: number;
      focus: string;
    }[];
  };
  workouts?: GeneratedWorkout[];
  error?: string;
}

interface WorkoutTemplate {
  id: string;
  code: string;
  name: string;
  name_nl: string;
  workout_type: WorkoutType;
  category: string;
  difficulty_level: number;
  base_duration_minutes: number;
  base_distance_km: number | null;
  intensity_level: number;
  target_heart_rate_zone: number | null;
  workout_structure: Record<string, unknown>;
  description_nl: string | null;
  coach_notes_nl: string | null;
}

interface PlanTemplate {
  id: string;
  code: string;
  name_nl: string;
  goal_type: GoalType;
  experience_level: ExperienceLevel;
  weeks_duration: number;
  days_per_week: number;
  weekly_structure: {
    day_pattern: string[];
    week_types: Record<string, Record<string, number>>;
  };
  phases: {
    name: string;
    weeks: number[];
    focus: string;
    volume_multiplier: number;
  }[];
}

const dayNameToNumber: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * Generates a training plan from pre-defined templates
 * No AI involved - just smart selection and scaling
 */
export async function generatePlanFromTemplates(
  input: GeneratePlanInput
): Promise<GeneratePlanResult> {
  const supabase = await createClient();

  try {
    // 1. Find the best matching plan template
    const planTemplate = await findBestPlanTemplate(supabase, input);
    if (!planTemplate) {
      return { success: false, error: "Geen geschikt schema gevonden voor jouw doel en niveau" };
    }

    // 2. Get all workout templates
    const { data: workoutTemplates, error: wtError } = await supabase
      .from("workout_templates")
      .select("*")
      .order("difficulty_level", { ascending: true });

    if (wtError || !workoutTemplates) {
      console.error("Error fetching workout templates:", wtError);
      return { success: false, error: "Kon trainingen niet ophalen" };
    }

    // 3. Calculate scaling factors based on user's current fitness
    const scalingFactor = calculateScalingFactor(input);

    // 4. Generate workouts for each week
    const workouts: GeneratedWorkout[] = [];
    const weeklySummary: { week: number; phase: string; total_km: number; focus: string }[] = [];
    const startDate = new Date();

    for (let week = 1; week <= input.weeksDuration; week++) {
      const phase = getPhaseForWeek(planTemplate.phases, week);
      const weekType = getWeekType(planTemplate.phases, week);
      const volumeMultiplier = phase?.volume_multiplier || 1.0;
      
      // Get workout distribution for this week type
      const weekStructure = planTemplate.weekly_structure.week_types[weekType] || 
                           planTemplate.weekly_structure.week_types["standard"] ||
                           { easy: 2, long: 1 };

      // Generate workouts for each training day
      const weekWorkouts = generateWeekWorkouts(
        week,
        weekStructure,
        workoutTemplates as unknown as WorkoutTemplate[],
        input,
        scalingFactor * volumeMultiplier,
        startDate
      );

      workouts.push(...weekWorkouts);

      // Calculate weekly summary
      const weekTotalKm = weekWorkouts.reduce((sum, w) => sum + w.target_distance_km, 0);
      weeklySummary.push({
        week,
        phase: phase?.name || "Training",
        total_km: Math.round(weekTotalKm * 10) / 10,
        focus: phase?.focus || "Algemene training",
      });
    }

    // 5. Build result
    return {
      success: true,
      plan: {
        phases: planTemplate.phases.map((p) => ({
          name: p.name,
          weeks: p.weeks,
          focus: p.focus,
        })),
        weekly_summary: weeklySummary,
      },
      workouts,
    };
  } catch (error) {
    console.error("Plan generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Onbekende fout",
    };
  }
}

async function findBestPlanTemplate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: GeneratePlanInput
): Promise<PlanTemplate | null> {
  // Try to find exact match first
  let { data: templates } = await supabase
    .from("plan_templates")
    .select("*")
    .eq("goal_type", input.goalType)
    .eq("experience_level", input.experienceLevel)
    .eq("is_active", true)
    .order("weeks_duration", { ascending: true });

  // If no exact match, try with any experience level for this goal
  if (!templates || templates.length === 0) {
    const { data: fallbackTemplates } = await supabase
      .from("plan_templates")
      .select("*")
      .eq("goal_type", input.goalType)
      .eq("is_active", true)
      .order("weeks_duration", { ascending: true });
    
    templates = fallbackTemplates;
  }

  // If still no match, use fitness template as fallback
  if (!templates || templates.length === 0) {
    const { data: fitnessTemplates } = await supabase
      .from("plan_templates")
      .select("*")
      .eq("goal_type", "fitness")
      .eq("is_active", true)
      .limit(1);
    
    templates = fitnessTemplates;
  }

  if (!templates || templates.length === 0) {
    return null;
  }

  // Find template closest to requested duration
  const targetWeeks = input.weeksDuration;
  let bestTemplate = templates[0];
  let minDiff = Math.abs(templates[0].weeks_duration - targetWeeks);

  for (const template of templates) {
    const diff = Math.abs(template.weeks_duration - targetWeeks);
    if (diff < minDiff) {
      minDiff = diff;
      bestTemplate = template;
    }
  }

  return bestTemplate as unknown as PlanTemplate;
}

function calculateScalingFactor(input: GeneratePlanInput): number {
  // Base scaling on current weekly km and experience
  const baseWeeklyKm: Record<ExperienceLevel, number> = {
    beginner: 15,
    intermediate: 30,
    advanced: 50,
    elite: 80,
  };

  const expectedKm = baseWeeklyKm[input.experienceLevel];
  const actualKm = input.recentWeeklyKm;

  // Scale between 0.6 and 1.4 based on current vs expected km
  const ratio = actualKm / expectedKm;
  return Math.max(0.6, Math.min(1.4, ratio));
}

function getPhaseForWeek(
  phases: PlanTemplate["phases"],
  week: number
): PlanTemplate["phases"][0] | undefined {
  return phases.find((p) => p.weeks.includes(week));
}

function getWeekType(phases: PlanTemplate["phases"], week: number): string {
  const phase = getPhaseForWeek(phases, week);
  if (!phase) return "base";
  
  const phaseName = phase.name.toLowerCase();
  if (phaseName.includes("base")) return "base";
  if (phaseName.includes("build")) return "build";
  if (phaseName.includes("peak")) return "peak";
  if (phaseName.includes("taper")) return "taper";
  return "standard";
}

function generateWeekWorkouts(
  weekNumber: number,
  weekStructure: Record<string, number>,
  allTemplates: WorkoutTemplate[],
  input: GeneratePlanInput,
  volumeMultiplier: number,
  startDate: Date
): GeneratedWorkout[] {
  const workouts: GeneratedWorkout[] = [];
  
  // Map workout type keys to actual workout types
  const typeMapping: Record<string, WorkoutType[]> = {
    easy: ["easy_run"],
    long: ["long_run"],
    interval: ["interval"],
    tempo: ["tempo_run"],
    fartlek: ["fartlek"],
    recovery: ["recovery"],
    hill: ["hill_training"],
    race_pace: ["race_pace"],
  };

  // Get preferred days sorted
  const sortedDays = [...input.preferredDays].sort(
    (a, b) => dayNameToNumber[a] - dayNameToNumber[b]
  );

  let dayIndex = 0;

  // For each workout type in the week structure
  for (const [typeKey, count] of Object.entries(weekStructure)) {
    const workoutTypes = typeMapping[typeKey] || ["easy_run"];

    for (let i = 0; i < count; i++) {
      if (dayIndex >= sortedDays.length) break;

      const dayName = sortedDays[dayIndex];
      const template = selectWorkoutTemplate(
        allTemplates,
        workoutTypes,
        input.experienceLevel,
        weekNumber,
        typeKey
      );

      if (template) {
        const scheduledDate = calculateScheduledDate(
          startDate,
          weekNumber,
          dayName
        );

        // Scale the workout
        const scaledDuration = Math.round(
          template.base_duration_minutes * volumeMultiplier
        );
        const scaledDistance = template.base_distance_km
          ? Math.round(template.base_distance_km * volumeMultiplier * 10) / 10
          : Math.round((scaledDuration / 6) * 10) / 10; // Estimate ~6 min/km

        // Scale the workout structure
        const scaledStructure = scaleWorkoutStructure(
          template.workout_structure,
          volumeMultiplier
        );

        workouts.push({
          scheduled_date: scheduledDate,
          week_number: weekNumber,
          day_of_week: dayNameToNumber[dayName],
          workout_type: template.workout_type,
          title: template.name_nl,
          description: template.description_nl || "",
          target_duration_minutes: scaledDuration,
          target_distance_km: scaledDistance,
          target_pace_min_per_km: input.currentPace
            ? input.currentPace / 60
            : null,
          target_heart_rate_zone: template.target_heart_rate_zone,
          workout_structure: scaledStructure,
          coach_notes: template.coach_notes_nl,
        });
      }

      dayIndex++;
    }
  }

  return workouts;
}

function selectWorkoutTemplate(
  templates: WorkoutTemplate[],
  allowedTypes: WorkoutType[],
  experience: ExperienceLevel,
  weekNumber: number,
  typeKey: string
): WorkoutTemplate | null {
  // Filter by workout type
  let candidates = templates.filter((t) =>
    allowedTypes.includes(t.workout_type)
  );

  if (candidates.length === 0) return null;

  // Filter by experience level
  const expMapping: Record<ExperienceLevel, number> = {
    beginner: 2,
    intermediate: 4,
    advanced: 5,
    elite: 6,
  };
  const maxDifficulty = expMapping[experience];
  candidates = candidates.filter((t) => t.difficulty_level <= maxDifficulty);

  if (candidates.length === 0) {
    // Fallback to any matching type
    candidates = templates.filter((t) => allowedTypes.includes(t.workout_type));
  }

  // For long runs, select progressively longer ones
  if (typeKey === "long") {
    candidates.sort((a, b) => 
      (a.base_duration_minutes || 0) - (b.base_duration_minutes || 0)
    );
    // Progress through longer workouts as weeks advance
    const index = Math.min(
      Math.floor((weekNumber - 1) / 2),
      candidates.length - 1
    );
    return candidates[index] || candidates[0];
  }

  // For intervals, progress to harder ones
  if (typeKey === "interval") {
    candidates.sort((a, b) => a.difficulty_level - b.difficulty_level);
    const index = Math.min(
      Math.floor((weekNumber - 1) / 3),
      candidates.length - 1
    );
    return candidates[index] || candidates[0];
  }

  // For other types, pick based on variety (rotate through options)
  if (candidates.length > 0) {
    return candidates[weekNumber % candidates.length];
  }

  return candidates[0] || null;
}

function calculateScheduledDate(
  startDate: Date,
  weekNumber: number,
  dayName: string
): string {
  const date = new Date(startDate);
  
  // Move to start of week 1
  const currentDay = date.getDay();
  const targetDay = dayNameToNumber[dayName];
  
  // Calculate days to add
  let daysToAdd = (weekNumber - 1) * 7;
  daysToAdd += (targetDay - currentDay + 7) % 7;
  
  // If we're past the target day this week and it's week 1, move to next week
  if (weekNumber === 1 && targetDay < currentDay) {
    daysToAdd += 7;
  }
  
  date.setDate(date.getDate() + daysToAdd);
  
  return date.toISOString().split("T")[0];
}

function scaleWorkoutStructure(
  structure: Record<string, unknown>,
  multiplier: number
): Record<string, unknown> {
  // Deep clone the structure
  const scaled = JSON.parse(JSON.stringify(structure));

  // Scale duration and distance values
  if (scaled.segments && Array.isArray(scaled.segments)) {
    scaled.segments = scaled.segments.map((segment: Record<string, unknown>) =>
      scaleSegment(segment, multiplier)
    );
  }

  if (scaled.estimated_duration_minutes) {
    scaled.estimated_duration_minutes = Math.round(
      (scaled.estimated_duration_minutes as number) * multiplier
    );
  }

  if (scaled.estimated_distance_km) {
    scaled.estimated_distance_km =
      Math.round((scaled.estimated_distance_km as number) * multiplier * 10) / 10;
  }

  return scaled;
}

function scaleSegment(
  segment: Record<string, unknown>,
  multiplier: number
): Record<string, unknown> {
  const scaled = { ...segment };

  // Scale duration_value for time-based segments
  if (
    scaled.duration_type === "time" &&
    typeof scaled.duration_value === "number"
  ) {
    scaled.duration_value = Math.round(scaled.duration_value * multiplier);
  }

  // Scale duration_value for distance-based segments
  if (
    scaled.duration_type === "distance" &&
    typeof scaled.duration_value === "number"
  ) {
    scaled.duration_value = Math.round(scaled.duration_value * multiplier);
  }

  // Handle nested segments (for repeats)
  if (scaled.segments && Array.isArray(scaled.segments)) {
    scaled.segments = scaled.segments.map((s: Record<string, unknown>) =>
      scaleSegment(s, multiplier)
    );
  }

  return scaled;
}

