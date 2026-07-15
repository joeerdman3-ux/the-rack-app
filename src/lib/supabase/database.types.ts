// Hand-written to match supabase/migrations/0001_init_schema.sql.
// Once the project is live, regenerate with:
//   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts

export type Database = {
  public: {
    Views: {
      best_lifts: {
        Row: {
          user_id: string;
          lift: string;
          best_e1rm: number;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Tables: {
      gyms: {
        Row: {
          id: string;
          name: string;
          location: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          location?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["gyms"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          nickname: string | null;
          bodyweight: number | null;
          unit: "lb" | "kg";
          gender: "male" | "female" | null;
          birthdate: string | null;
          gym_id: string | null;
          location: string | null;
          instagram: string | null;
          simple_mode: boolean;
          leaderboard_opt_in: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          nickname?: string | null;
          bodyweight?: number | null;
          unit?: "lb" | "kg";
          gender?: "male" | "female" | null;
          birthdate?: string | null;
          gym_id?: string | null;
          location?: string | null;
          instagram?: string | null;
          simple_mode?: boolean;
          leaderboard_opt_in?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          lift: string;
          weight: number;
          reps: number;
          rpe: number | null;
          e1rm: number;
          missed: boolean;
          sticking_point: string | null;
          logged_date: string;
          logged_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lift: string;
          weight: number;
          reps: number;
          rpe?: number | null;
          e1rm: number;
          missed?: boolean;
          sticking_point?: string | null;
          logged_date: string;
          logged_at?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["workouts"]["Insert"]>;
        Relationships: [];
      };
      pr_shares: {
        Row: {
          id: string;
          user_id: string;
          workout_id: string | null;
          video_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          workout_id?: string | null;
          video_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pr_shares"]["Insert"]>;
        Relationships: [];
      };
      daily_plans: {
        Row: {
          id: string;
          user_id: string;
          plan_date: string;
          exercise_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_date: string;
          exercise_name: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["daily_plans"]["Insert"]>;
        Relationships: [];
      };
      coach_athletes: {
        Row: {
          id: string;
          coach_id: string;
          athlete_id: string;
          status: "pending" | "accepted";
          created_at: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          athlete_id: string;
          status?: "pending" | "accepted";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["coach_athletes"]["Insert"]>;
        Relationships: [];
      };
      lift_benchmarks: {
        Row: {
          Sex: string;
          age_bucket: string;
          weight_class: string;
          n: number | null;
          squat_p10: number | null;
          squat_p25: number | null;
          squat_p50: number | null;
          squat_p75: number | null;
          squat_p90: number | null;
          squat_p95: number | null;
          squat_p99: number | null;
          bench_p10: number | null;
          bench_p25: number | null;
          bench_p50: number | null;
          bench_p75: number | null;
          bench_p90: number | null;
          bench_p95: number | null;
          bench_p99: number | null;
          deadlift_p10: number | null;
          deadlift_p25: number | null;
          deadlift_p50: number | null;
          deadlift_p75: number | null;
          deadlift_p90: number | null;
          deadlift_p95: number | null;
          deadlift_p99: number | null;
        };
        Insert: Database["public"]["Tables"]["lift_benchmarks"]["Row"];
        Update: Partial<Database["public"]["Tables"]["lift_benchmarks"]["Row"]>;
        Relationships: [];
      };
      exercises: {
        Row: {
          id: string;
          name: string;
          primary_lift: string;
          movement_pattern: string | null;
          equipment: string | null;
          description: string | null;
          muscle_group: string | null;
          difficulty: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          primary_lift: string;
          movement_pattern?: string | null;
          equipment?: string | null;
          description?: string | null;
          muscle_group?: string | null;
          difficulty?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["exercises"]["Insert"]>;
        Relationships: [];
      };
      sticking_point_prescriptions: {
        Row: {
          id: string;
          sticking_point: string;
          exercise_id: string;
          rationale: string;
          sets_reps: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          sticking_point: string;
          exercise_id: string;
          rationale: string;
          sets_reps: string;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["sticking_point_prescriptions"]["Insert"]>;
        Relationships: [];
      };
      accessory_logs: {
        Row: {
          id: string;
          user_id: string;
          exercise_id: string;
          weight: number;
          reps: number;
          rpe: number | null;
          notes: string | null;
          logged_date: string;
          logged_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          exercise_id: string;
          weight: number;
          reps: number;
          rpe?: number | null;
          notes?: string | null;
          logged_date: string;
          logged_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["accessory_logs"]["Insert"]>;
        Relationships: [];
      };
      programs: {
        Row: {
          id: string;
          user_id: string;
          name: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["programs"]["Insert"]>;
        Relationships: [];
      };
      program_weeks: {
        Row: {
          id: string;
          program_id: string;
          week_number: number;
          note: string | null;
          phase_name: string | null;
        };
        Insert: {
          id?: string;
          program_id: string;
          week_number: number;
          note?: string | null;
          phase_name?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["program_weeks"]["Insert"]>;
        Relationships: [];
      };
      program_sessions: {
        Row: {
          id: string;
          program_week_id: string;
          session_number: number;
          name: string | null;
        };
        Insert: {
          id?: string;
          program_week_id: string;
          session_number: number;
          name?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["program_sessions"]["Insert"]>;
        Relationships: [];
      };
      program_exercises: {
        Row: {
          id: string;
          program_session_id: string;
          exercise_id: string;
          sets: number;
          reps: number;
          percent_of_max: number | null;
          sort_order: number;
          is_amrap: boolean;
        };
        Insert: {
          id?: string;
          program_session_id: string;
          exercise_id: string;
          sets: number;
          reps: number;
          percent_of_max?: number | null;
          sort_order?: number;
          is_amrap?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["program_exercises"]["Insert"]>;
        Relationships: [];
      };
      program_training_maxes: {
        Row: {
          id: string;
          program_id: string;
          exercise_id: string;
          training_max_kg: number;
        };
        Insert: {
          id?: string;
          program_id: string;
          exercise_id: string;
          training_max_kg: number;
        };
        Update: Partial<Database["public"]["Tables"]["program_training_maxes"]["Insert"]>;
        Relationships: [];
      };
      program_templates: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          source_attribution: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          source_attribution?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["program_templates"]["Insert"]>;
        Relationships: [];
      };
      template_weeks: {
        Row: {
          id: string;
          template_id: string;
          week_number: number;
          phase_name: string | null;
          note: string | null;
        };
        Insert: {
          id?: string;
          template_id: string;
          week_number: number;
          phase_name?: string | null;
          note?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["template_weeks"]["Insert"]>;
        Relationships: [];
      };
      template_sessions: {
        Row: {
          id: string;
          template_week_id: string;
          session_number: number;
          name: string;
        };
        Insert: {
          id?: string;
          template_week_id: string;
          session_number: number;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["template_sessions"]["Insert"]>;
        Relationships: [];
      };
      template_exercises: {
        Row: {
          id: string;
          template_session_id: string;
          exercise_id: string;
          sets: number;
          reps: number;
          percent_of_max: number | null;
          is_amrap: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          template_session_id: string;
          exercise_id: string;
          sets: number;
          reps: number;
          percent_of_max?: number | null;
          is_amrap?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["template_exercises"]["Insert"]>;
        Relationships: [];
      };
    };
  };
};
