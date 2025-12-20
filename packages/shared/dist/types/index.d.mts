type Json = string | number | boolean | null | {
    [key: string]: Json | undefined;
} | Json[];
type Database = {
    public: {
        Tables: {
            activities: {
                Row: {
                    activity_type: string;
                    avg_cadence: number | null;
                    avg_heart_rate: number | null;
                    avg_pace_sec_per_km: number | null;
                    best_pace_sec_per_km: number | null;
                    calories: number | null;
                    created_at: string;
                    description: string | null;
                    distance_meters: number | null;
                    duration_seconds: number;
                    elevation_gain_meters: number | null;
                    elevation_loss_meters: number | null;
                    external_id: string | null;
                    feeling: string | null;
                    finished_at: string | null;
                    fit_file_url: string | null;
                    gpx_data: Json | null;
                    id: string;
                    max_heart_rate: number | null;
                    moving_time_seconds: number | null;
                    perceived_effort: number | null;
                    source: string | null;
                    splits_data: Json | null;
                    started_at: string;
                    title: string | null;
                    updated_at: string;
                    user_id: string;
                    weather_condition: string | null;
                    weather_temp_celsius: number | null;
                    workout_id: string | null;
                };
                Insert: {
                    activity_type: string;
                    avg_cadence?: number | null;
                    avg_heart_rate?: number | null;
                    avg_pace_sec_per_km?: number | null;
                    best_pace_sec_per_km?: number | null;
                    calories?: number | null;
                    created_at?: string;
                    description?: string | null;
                    distance_meters?: number | null;
                    duration_seconds: number;
                    elevation_gain_meters?: number | null;
                    elevation_loss_meters?: number | null;
                    external_id?: string | null;
                    feeling?: string | null;
                    finished_at?: string | null;
                    fit_file_url?: string | null;
                    gpx_data?: Json | null;
                    id?: string;
                    max_heart_rate?: number | null;
                    moving_time_seconds?: number | null;
                    perceived_effort?: number | null;
                    source?: string | null;
                    splits_data?: Json | null;
                    started_at: string;
                    title?: string | null;
                    updated_at?: string;
                    user_id: string;
                    weather_condition?: string | null;
                    weather_temp_celsius?: number | null;
                    workout_id?: string | null;
                };
                Update: {
                    activity_type?: string;
                    avg_cadence?: number | null;
                    avg_heart_rate?: number | null;
                    avg_pace_sec_per_km?: number | null;
                    best_pace_sec_per_km?: number | null;
                    calories?: number | null;
                    created_at?: string;
                    description?: string | null;
                    distance_meters?: number | null;
                    duration_seconds?: number;
                    elevation_gain_meters?: number | null;
                    elevation_loss_meters?: number | null;
                    external_id?: string | null;
                    feeling?: string | null;
                    finished_at?: string | null;
                    fit_file_url?: string | null;
                    gpx_data?: Json | null;
                    id?: string;
                    max_heart_rate?: number | null;
                    moving_time_seconds?: number | null;
                    perceived_effort?: number | null;
                    source?: string | null;
                    splits_data?: Json | null;
                    started_at?: string;
                    title?: string | null;
                    updated_at?: string;
                    user_id?: string;
                    weather_condition?: string | null;
                    weather_temp_celsius?: number | null;
                    workout_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "activities_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "profiles";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "activities_workout_id_fkey";
                        columns: ["workout_id"];
                        isOneToOne: false;
                        referencedRelation: "workouts";
                        referencedColumns: ["id"];
                    }
                ];
            };
            notifications: {
                Row: {
                    id: string;
                    user_id: string;
                    type: string;
                    title: string;
                    message: string | null;
                    data: Json;
                    read_at: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    type: string;
                    title: string;
                    message?: string | null;
                    data?: Json;
                    read_at?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    type?: string;
                    title?: string;
                    message?: string | null;
                    data?: Json;
                    read_at?: string | null;
                    created_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "notifications_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "profiles";
                        referencedColumns: ["id"];
                    }
                ];
            };
            plan_template_workouts: {
                Row: {
                    day_name: string | null;
                    day_of_week: number;
                    distance_multiplier: number | null;
                    duration_multiplier: number | null;
                    id: string;
                    intensity_adjustment: number | null;
                    plan_template_id: string;
                    sort_order: number | null;
                    specific_notes: string | null;
                    specific_notes_nl: string | null;
                    week_number: number;
                    workout_template_id: string;
                };
                Insert: {
                    day_name?: string | null;
                    day_of_week: number;
                    distance_multiplier?: number | null;
                    duration_multiplier?: number | null;
                    id?: string;
                    intensity_adjustment?: number | null;
                    plan_template_id: string;
                    sort_order?: number | null;
                    specific_notes?: string | null;
                    specific_notes_nl?: string | null;
                    week_number: number;
                    workout_template_id: string;
                };
                Update: {
                    day_name?: string | null;
                    day_of_week?: number;
                    distance_multiplier?: number | null;
                    duration_multiplier?: number | null;
                    id?: string;
                    intensity_adjustment?: number | null;
                    plan_template_id?: string;
                    sort_order?: number | null;
                    specific_notes?: string | null;
                    specific_notes_nl?: string | null;
                    week_number?: number;
                    workout_template_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "plan_template_workouts_plan_template_id_fkey";
                        columns: ["plan_template_id"];
                        isOneToOne: false;
                        referencedRelation: "plan_templates";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "plan_template_workouts_workout_template_id_fkey";
                        columns: ["workout_template_id"];
                        isOneToOne: false;
                        referencedRelation: "workout_templates";
                        referencedColumns: ["id"];
                    }
                ];
            };
            plan_templates: {
                Row: {
                    code: string;
                    created_at: string | null;
                    days_per_week: number;
                    description: string | null;
                    description_nl: string | null;
                    experience_level: string;
                    goal_type: string;
                    id: string;
                    is_active: boolean | null;
                    max_weekly_km: number | null;
                    min_weekly_km: number | null;
                    name: string;
                    name_nl: string;
                    phases: Json;
                    updated_at: string | null;
                    weekly_structure: Json;
                    weeks_duration: number;
                };
                Insert: {
                    code: string;
                    created_at?: string | null;
                    days_per_week?: number;
                    description?: string | null;
                    description_nl?: string | null;
                    experience_level: string;
                    goal_type: string;
                    id?: string;
                    is_active?: boolean | null;
                    max_weekly_km?: number | null;
                    min_weekly_km?: number | null;
                    name: string;
                    name_nl: string;
                    phases: Json;
                    updated_at?: string | null;
                    weekly_structure: Json;
                    weeks_duration: number;
                };
                Update: {
                    code?: string;
                    created_at?: string | null;
                    days_per_week?: number;
                    description?: string | null;
                    description_nl?: string | null;
                    experience_level?: string;
                    goal_type?: string;
                    id?: string;
                    is_active?: boolean | null;
                    max_weekly_km?: number | null;
                    min_weekly_km?: number | null;
                    name?: string;
                    name_nl?: string;
                    phases?: Json;
                    updated_at?: string | null;
                    weekly_structure?: Json;
                    weeks_duration?: number;
                };
                Relationships: [];
            };
            profiles: {
                Row: {
                    avatar_url: string | null;
                    created_at: string;
                    distance_unit: string;
                    email: string | null;
                    experience_level: string | null;
                    full_name: string | null;
                    garmin_access_token: string | null;
                    garmin_refresh_token: string | null;
                    garmin_token_expires_at: string | null;
                    garmin_user_id: string | null;
                    id: string;
                    locale: string;
                    preferred_run_days: string[] | null;
                    strava_access_token: string | null;
                    strava_athlete_id: number | null;
                    strava_refresh_token: string | null;
                    strava_scope: string | null;
                    strava_token_expires_at: string | null;
                    updated_at: string;
                    weekly_available_hours: number | null;
                };
                Insert: {
                    avatar_url?: string | null;
                    created_at?: string;
                    distance_unit?: string;
                    email?: string | null;
                    experience_level?: string | null;
                    full_name?: string | null;
                    garmin_access_token?: string | null;
                    garmin_refresh_token?: string | null;
                    garmin_token_expires_at?: string | null;
                    garmin_user_id?: string | null;
                    id: string;
                    locale?: string;
                    preferred_run_days?: string[] | null;
                    strava_access_token?: string | null;
                    strava_athlete_id?: number | null;
                    strava_refresh_token?: string | null;
                    strava_scope?: string | null;
                    strava_token_expires_at?: string | null;
                    updated_at?: string;
                    weekly_available_hours?: number | null;
                };
                Update: {
                    avatar_url?: string | null;
                    created_at?: string;
                    distance_unit?: string;
                    email?: string | null;
                    experience_level?: string | null;
                    full_name?: string | null;
                    garmin_access_token?: string | null;
                    garmin_refresh_token?: string | null;
                    garmin_token_expires_at?: string | null;
                    garmin_user_id?: string | null;
                    id?: string;
                    locale?: string;
                    preferred_run_days?: string[] | null;
                    strava_access_token?: string | null;
                    strava_athlete_id?: number | null;
                    strava_refresh_token?: string | null;
                    strava_scope?: string | null;
                    strava_token_expires_at?: string | null;
                    updated_at?: string;
                    weekly_available_hours?: number | null;
                };
                Relationships: [];
            };
            training_plans: {
                Row: {
                    created_at: string;
                    description: string | null;
                    end_date: string | null;
                    goal_event_date: string | null;
                    goal_event_name: string | null;
                    goal_type: string;
                    id: string;
                    name: string;
                    plan_data: Json | null;
                    start_date: string;
                    status: string | null;
                    target_time_minutes: number | null;
                    updated_at: string;
                    user_id: string;
                    weeks_duration: number | null;
                };
                Insert: {
                    created_at?: string;
                    description?: string | null;
                    end_date?: string | null;
                    goal_event_date?: string | null;
                    goal_event_name?: string | null;
                    goal_type: string;
                    id?: string;
                    name: string;
                    plan_data?: Json | null;
                    start_date: string;
                    status?: string | null;
                    target_time_minutes?: number | null;
                    updated_at?: string;
                    user_id: string;
                    weeks_duration?: number | null;
                };
                Update: {
                    created_at?: string;
                    description?: string | null;
                    end_date?: string | null;
                    goal_event_date?: string | null;
                    goal_event_name?: string | null;
                    goal_type?: string;
                    id?: string;
                    name?: string;
                    plan_data?: Json | null;
                    start_date?: string;
                    status?: string | null;
                    target_time_minutes?: number | null;
                    updated_at?: string;
                    user_id?: string;
                    weeks_duration?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "training_plans_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "profiles";
                        referencedColumns: ["id"];
                    }
                ];
            };
            user_stats: {
                Row: {
                    created_at: string;
                    estimated_10k_time_seconds: number | null;
                    estimated_5k_time_seconds: number | null;
                    estimated_half_marathon_seconds: number | null;
                    estimated_marathon_seconds: number | null;
                    estimated_vo2max: number | null;
                    fatigue_score: number | null;
                    fitness_score: number | null;
                    id: string;
                    recorded_at: string;
                    resting_heart_rate: number | null;
                    training_load_score: number | null;
                    user_id: string;
                    weekly_distance_km: number | null;
                    weekly_duration_minutes: number | null;
                    weight_kg: number | null;
                };
                Insert: {
                    created_at?: string;
                    estimated_10k_time_seconds?: number | null;
                    estimated_5k_time_seconds?: number | null;
                    estimated_half_marathon_seconds?: number | null;
                    estimated_marathon_seconds?: number | null;
                    estimated_vo2max?: number | null;
                    fatigue_score?: number | null;
                    fitness_score?: number | null;
                    id?: string;
                    recorded_at: string;
                    resting_heart_rate?: number | null;
                    training_load_score?: number | null;
                    user_id: string;
                    weekly_distance_km?: number | null;
                    weekly_duration_minutes?: number | null;
                    weight_kg?: number | null;
                };
                Update: {
                    created_at?: string;
                    estimated_10k_time_seconds?: number | null;
                    estimated_5k_time_seconds?: number | null;
                    estimated_half_marathon_seconds?: number | null;
                    estimated_marathon_seconds?: number | null;
                    estimated_vo2max?: number | null;
                    fatigue_score?: number | null;
                    fitness_score?: number | null;
                    id?: string;
                    recorded_at?: string;
                    resting_heart_rate?: number | null;
                    training_load_score?: number | null;
                    user_id?: string;
                    weekly_distance_km?: number | null;
                    weekly_duration_minutes?: number | null;
                    weight_kg?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "user_stats_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "profiles";
                        referencedColumns: ["id"];
                    }
                ];
            };
            workout_templates: {
                Row: {
                    base_distance_km: number | null;
                    base_duration_minutes: number;
                    can_scale_distance: boolean | null;
                    can_scale_duration: boolean | null;
                    category: string;
                    coach_notes: string | null;
                    coach_notes_nl: string | null;
                    code: string;
                    created_at: string | null;
                    description: string | null;
                    description_nl: string | null;
                    difficulty_level: number;
                    id: string;
                    intensity_level: number;
                    max_distance_km: number | null;
                    max_duration_minutes: number | null;
                    min_distance_km: number | null;
                    min_duration_minutes: number | null;
                    min_experience: string;
                    name: string;
                    name_nl: string;
                    tags: string[] | null;
                    target_heart_rate_zone: number | null;
                    updated_at: string | null;
                    workout_structure: Json;
                    workout_type: string;
                };
                Insert: {
                    base_distance_km?: number | null;
                    base_duration_minutes: number;
                    can_scale_distance?: boolean | null;
                    can_scale_duration?: boolean | null;
                    category: string;
                    coach_notes?: string | null;
                    coach_notes_nl?: string | null;
                    code: string;
                    created_at?: string | null;
                    description?: string | null;
                    description_nl?: string | null;
                    difficulty_level: number;
                    id?: string;
                    intensity_level: number;
                    max_distance_km?: number | null;
                    max_duration_minutes?: number | null;
                    min_distance_km?: number | null;
                    min_duration_minutes?: number | null;
                    min_experience?: string;
                    name: string;
                    name_nl: string;
                    tags?: string[] | null;
                    target_heart_rate_zone?: number | null;
                    updated_at?: string | null;
                    workout_structure: Json;
                    workout_type: string;
                };
                Update: {
                    base_distance_km?: number | null;
                    base_duration_minutes?: number;
                    can_scale_distance?: boolean | null;
                    can_scale_duration?: boolean | null;
                    category?: string;
                    coach_notes?: string | null;
                    coach_notes_nl?: string | null;
                    code?: string;
                    created_at?: string | null;
                    description?: string | null;
                    description_nl?: string | null;
                    difficulty_level?: number;
                    id?: string;
                    intensity_level?: number;
                    max_distance_km?: number | null;
                    max_duration_minutes?: number | null;
                    min_distance_km?: number | null;
                    min_duration_minutes?: number | null;
                    min_experience?: string;
                    name?: string;
                    name_nl?: string;
                    tags?: string[] | null;
                    target_heart_rate_zone?: number | null;
                    updated_at?: string | null;
                    workout_structure?: Json;
                    workout_type?: string;
                };
                Relationships: [];
            };
            workouts: {
                Row: {
                    athlete_notes: string | null;
                    coach_notes: string | null;
                    completed_at: string | null;
                    created_at: string;
                    day_of_week: number | null;
                    description: string | null;
                    id: string;
                    plan_id: string;
                    scheduled_date: string;
                    status: string | null;
                    target_distance_km: number | null;
                    target_duration_minutes: number | null;
                    target_heart_rate_zone: number | null;
                    target_pace_min_per_km: number | null;
                    title: string;
                    updated_at: string;
                    user_id: string;
                    week_number: number | null;
                    workout_structure: Json | null;
                    workout_type: string;
                };
                Insert: {
                    athlete_notes?: string | null;
                    coach_notes?: string | null;
                    completed_at?: string | null;
                    created_at?: string;
                    day_of_week?: number | null;
                    description?: string | null;
                    id?: string;
                    plan_id: string;
                    scheduled_date: string;
                    status?: string | null;
                    target_distance_km?: number | null;
                    target_duration_minutes?: number | null;
                    target_heart_rate_zone?: number | null;
                    target_pace_min_per_km?: number | null;
                    title: string;
                    updated_at?: string;
                    user_id: string;
                    week_number?: number | null;
                    workout_structure?: Json | null;
                    workout_type: string;
                };
                Update: {
                    athlete_notes?: string | null;
                    coach_notes?: string | null;
                    completed_at?: string | null;
                    created_at?: string;
                    day_of_week?: number | null;
                    description?: string | null;
                    id?: string;
                    plan_id?: string;
                    scheduled_date?: string;
                    status?: string | null;
                    target_distance_km?: number | null;
                    target_duration_minutes?: number | null;
                    target_heart_rate_zone?: number | null;
                    target_pace_min_per_km?: number | null;
                    title?: string;
                    updated_at?: string;
                    user_id?: string;
                    week_number?: number | null;
                    workout_structure?: Json | null;
                    workout_type?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "workouts_plan_id_fkey";
                        columns: ["plan_id"];
                        isOneToOne: false;
                        referencedRelation: "training_plans";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "workouts_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "profiles";
                        referencedColumns: ["id"];
                    }
                ];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};
type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
type Profile = Tables<'profiles'>;
type TrainingPlan = Tables<'training_plans'>;
type Workout = Tables<'workouts'>;
type Activity = Tables<'activities'>;
type UserStats = Tables<'user_stats'>;
type WorkoutTemplate = Tables<'workout_templates'>;
type PlanTemplate = Tables<'plan_templates'>;
type PlanTemplateWorkout = Tables<'plan_template_workouts'>;
type Notification = Tables<'notifications'>;
type DistanceUnit = 'km' | 'mi';
type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite';
type GoalType = '5k' | '10k' | '15k' | 'half_marathon' | 'marathon' | 'fitness' | 'custom';
type WorkoutType = 'easy_run' | 'long_run' | 'tempo_run' | 'interval' | 'fartlek' | 'recovery' | 'hill_training' | 'race_pace' | 'cross_training' | 'rest';
type WorkoutStatus = 'scheduled' | 'completed' | 'skipped' | 'modified';
type PlanStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
type ActivitySource = 'manual' | 'garmin' | 'strava' | 'import';
type ActivityType = 'run' | 'walk' | 'cross_training' | 'cycling' | 'swimming' | 'other';
type Feeling = 'great' | 'good' | 'okay' | 'tired' | 'exhausted';
type NotificationType = 'activity_uploaded' | 'activity_synced' | 'workout_reminder' | 'plan_created' | 'achievement';

export type { Activity, ActivitySource, ActivityType, Database, DistanceUnit, ExperienceLevel, Feeling, GoalType, Json, Notification, NotificationType, PlanStatus, PlanTemplate, PlanTemplateWorkout, Profile, Tables, TablesInsert, TablesUpdate, TrainingPlan, UserStats, Workout, WorkoutStatus, WorkoutTemplate, WorkoutType };
