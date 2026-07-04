// Hand-written to match supabase/migrations/0001_init_schema.sql.
// Once the project is live, regenerate with:
//   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts

export type Database = {
  public: {
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
      };
      profiles: {
        Row: {
          id: string;
          nickname: string | null;
          bodyweight: number | null;
          unit: "lb" | "kg";
          gender: "male" | "female" | null;
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
          gym_id?: string | null;
          location?: string | null;
          instagram?: string | null;
          simple_mode?: boolean;
          leaderboard_opt_in?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
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
          logged_date: string;
          logged_at?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["workouts"]["Insert"]>;
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
      };
    };
  };
};
