export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string
          avg_cadence: number | null
          avg_heart_rate: number | null
          avg_pace_sec_per_km: number | null
          best_pace_sec_per_km: number | null
          calories: number | null
          created_at: string
          description: string | null
          distance_meters: number | null
          duration_seconds: number
          elevation_gain_meters: number | null
          elevation_loss_meters: number | null
          external_id: string | null
          feeling: string | null
          finished_at: string | null
          fit_file_url: string | null
          gpx_data: Json | null
          id: string
          max_heart_rate: number | null
          moving_time_seconds: number | null
          perceived_effort: number | null
          source: string | null
          splits_data: Json | null
          started_at: string
          title: string | null
          updated_at: string
          user_id: string
          weather_condition: string | null
          weather_temp_celsius: number | null
          workout_id: string | null
        }
        Insert: {
          activity_type: string
          avg_cadence?: number | null
          avg_heart_rate?: number | null
          avg_pace_sec_per_km?: number | null
          best_pace_sec_per_km?: number | null
          calories?: number | null
          created_at?: string
          description?: string | null
          distance_meters?: number | null
          duration_seconds: number
          elevation_gain_meters?: number | null
          elevation_loss_meters?: number | null
          external_id?: string | null
          feeling?: string | null
          finished_at?: string | null
          fit_file_url?: string | null
          gpx_data?: Json | null
          id?: string
          max_heart_rate?: number | null
          moving_time_seconds?: number | null
          perceived_effort?: number | null
          source?: string | null
          splits_data?: Json | null
          started_at: string
          title?: string | null
          updated_at?: string
          user_id: string
          weather_condition?: string | null
          weather_temp_celsius?: number | null
          workout_id?: string | null
        }
        Update: {
          activity_type?: string
          avg_cadence?: number | null
          avg_heart_rate?: number | null
          avg_pace_sec_per_km?: number | null
          best_pace_sec_per_km?: number | null
          calories?: number | null
          created_at?: string
          description?: string | null
          distance_meters?: number | null
          duration_seconds?: number
          elevation_gain_meters?: number | null
          elevation_loss_meters?: number | null
          external_id?: string | null
          feeling?: string | null
          finished_at?: string | null
          fit_file_url?: string | null
          gpx_data?: Json | null
          id?: string
          max_heart_rate?: number | null
          moving_time_seconds?: number | null
          perceived_effort?: number | null
          source?: string | null
          splits_data?: Json | null
          started_at?: string
          title?: string | null
          updated_at?: string
          user_id?: string
          weather_condition?: string | null
          weather_temp_celsius?: number | null
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          experience_level: string | null
          full_name: string | null
          garmin_access_token: string | null
          garmin_refresh_token: string | null
          garmin_token_expires_at: string | null
          garmin_user_id: string | null
          id: string
          locale: string
          preferred_run_days: string[] | null
          updated_at: string
          weekly_available_hours: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          experience_level?: string | null
          full_name?: string | null
          garmin_access_token?: string | null
          garmin_refresh_token?: string | null
          garmin_token_expires_at?: string | null
          garmin_user_id?: string | null
          id: string
          locale?: string
          preferred_run_days?: string[] | null
          updated_at?: string
          weekly_available_hours?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          experience_level?: string | null
          full_name?: string | null
          garmin_access_token?: string | null
          garmin_refresh_token?: string | null
          garmin_token_expires_at?: string | null
          garmin_user_id?: string | null
          id?: string
          locale?: string
          preferred_run_days?: string[] | null
          updated_at?: string
          weekly_available_hours?: number | null
        }
        Relationships: []
      }
      training_plans: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          goal_event_date: string | null
          goal_event_name: string | null
          goal_type: string
          id: string
          name: string
          plan_data: Json | null
          start_date: string
          status: string | null
          target_time_minutes: number | null
          updated_at: string
          user_id: string
          weeks_duration: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          goal_event_date?: string | null
          goal_event_name?: string | null
          goal_type: string
          id?: string
          name: string
          plan_data?: Json | null
          start_date: string
          status?: string | null
          target_time_minutes?: number | null
          updated_at?: string
          user_id: string
          weeks_duration?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          goal_event_date?: string | null
          goal_event_name?: string | null
          goal_type?: string
          id?: string
          name?: string
          plan_data?: Json | null
          start_date?: string
          status?: string | null
          target_time_minutes?: number | null
          updated_at?: string
          user_id?: string
          weeks_duration?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "training_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          created_at: string
          estimated_10k_time_seconds: number | null
          estimated_5k_time_seconds: number | null
          estimated_half_marathon_seconds: number | null
          estimated_marathon_seconds: number | null
          estimated_vo2max: number | null
          fatigue_score: number | null
          fitness_score: number | null
          id: string
          recorded_at: string
          resting_heart_rate: number | null
          training_load_score: number | null
          user_id: string
          weekly_distance_km: number | null
          weekly_duration_minutes: number | null
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          estimated_10k_time_seconds?: number | null
          estimated_5k_time_seconds?: number | null
          estimated_half_marathon_seconds?: number | null
          estimated_marathon_seconds?: number | null
          estimated_vo2max?: number | null
          fatigue_score?: number | null
          fitness_score?: number | null
          id?: string
          recorded_at: string
          resting_heart_rate?: number | null
          training_load_score?: number | null
          user_id: string
          weekly_distance_km?: number | null
          weekly_duration_minutes?: number | null
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          estimated_10k_time_seconds?: number | null
          estimated_5k_time_seconds?: number | null
          estimated_half_marathon_seconds?: number | null
          estimated_marathon_seconds?: number | null
          estimated_vo2max?: number | null
          fatigue_score?: number | null
          fitness_score?: number | null
          id?: string
          recorded_at?: string
          resting_heart_rate?: number | null
          training_load_score?: number | null
          user_id?: string
          weekly_distance_km?: number | null
          weekly_duration_minutes?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          athlete_notes: string | null
          coach_notes: string | null
          completed_at: string | null
          created_at: string
          day_of_week: number | null
          description: string | null
          id: string
          plan_id: string
          scheduled_date: string
          status: string | null
          target_distance_km: number | null
          target_duration_minutes: number | null
          target_heart_rate_zone: number | null
          target_pace_min_per_km: number | null
          title: string
          updated_at: string
          user_id: string
          week_number: number | null
          workout_structure: Json | null
          workout_type: string
        }
        Insert: {
          athlete_notes?: string | null
          coach_notes?: string | null
          completed_at?: string | null
          created_at?: string
          day_of_week?: number | null
          description?: string | null
          id?: string
          plan_id: string
          scheduled_date: string
          status?: string | null
          target_distance_km?: number | null
          target_duration_minutes?: number | null
          target_heart_rate_zone?: number | null
          target_pace_min_per_km?: number | null
          title: string
          updated_at?: string
          user_id: string
          week_number?: number | null
          workout_structure?: Json | null
          workout_type: string
        }
        Update: {
          athlete_notes?: string | null
          coach_notes?: string | null
          completed_at?: string | null
          created_at?: string
          day_of_week?: number | null
          description?: string | null
          id?: string
          plan_id?: string
          scheduled_date?: string
          status?: string | null
          target_distance_km?: number | null
          target_duration_minutes?: number | null
          target_heart_rate_zone?: number | null
          target_pace_min_per_km?: number | null
          title?: string
          updated_at?: string
          user_id?: string
          week_number?: number | null
          workout_structure?: Json | null
          workout_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience types
export type Profile = Tables<'profiles'>
export type TrainingPlan = Tables<'training_plans'>
export type Workout = Tables<'workouts'>
export type Activity = Tables<'activities'>
export type UserStats = Tables<'user_stats'>

// Enums
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite'
export type GoalType = '5k' | '10k' | '15k' | 'half_marathon' | 'marathon' | 'fitness' | 'custom'
export type WorkoutType = 'easy_run' | 'long_run' | 'tempo_run' | 'interval' | 'fartlek' | 'recovery' | 'hill_training' | 'race_pace' | 'cross_training' | 'rest'
export type WorkoutStatus = 'scheduled' | 'completed' | 'skipped' | 'modified'
export type PlanStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
export type ActivitySource = 'manual' | 'garmin' | 'strava' | 'import'
export type ActivityType = 'run' | 'walk' | 'cross_training' | 'cycling' | 'swimming' | 'other'
export type Feeling = 'great' | 'good' | 'okay' | 'tired' | 'exhausted'

