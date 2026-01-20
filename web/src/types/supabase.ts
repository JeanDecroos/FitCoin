export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      challenges: {
        Row: {
          created_at: string
          dexa_goal: string
          dexa_status: Database["public"]["Enums"]["challenge_status"]
          functional_goal: string
          functional_status: Database["public"]["Enums"]["challenge_status"]
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dexa_goal: string
          dexa_status?: Database["public"]["Enums"]["challenge_status"]
          functional_goal: string
          functional_status?: Database["public"]["Enums"]["challenge_status"]
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dexa_goal?: string
          dexa_status?: Database["public"]["Enums"]["challenge_status"]
          functional_goal?: string
          functional_status?: Database["public"]["Enums"]["challenge_status"]
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          auth_user_id: string | null
          balance: number
          created_at: string
          goals_set: boolean
          id: string
          is_admin: boolean
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          auth_user_id?: string | null
          balance?: number
          created_at?: string
          goals_set?: boolean
          id?: string
          is_admin?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          auth_user_id?: string | null
          balance?: number
          created_at?: string
          goals_set?: boolean
          id?: string
          is_admin?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      wagers: {
        Row: {
          amount: number
          challenge_type: Database["public"]["Enums"]["challenge_type"]
          counter_id: string | null
          created_at: string
          creator_id: string
          id: string
          prediction: Database["public"]["Enums"]["wager_prediction"]
          status: Database["public"]["Enums"]["wager_status"]
          target_user_id: string
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          amount: number
          challenge_type: Database["public"]["Enums"]["challenge_type"]
          counter_id?: string | null
          created_at?: string
          creator_id: string
          id?: string
          prediction: Database["public"]["Enums"]["wager_prediction"]
          status?: Database["public"]["Enums"]["wager_status"]
          target_user_id: string
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          amount?: number
          challenge_type?: Database["public"]["Enums"]["challenge_type"]
          counter_id?: string | null
          created_at?: string
          creator_id?: string
          id?: string
          prediction?: Database["public"]["Enums"]["wager_prediction"]
          status?: Database["public"]["Enums"]["wager_status"]
          target_user_id?: string
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wagers_counter_id_fkey"
            columns: ["counter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wagers_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wagers_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wagers_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      fund_requests: {
        Row: {
          id: string
          user_id: string
          euro_amount: number
          fitcoin_amount: number
          status: Database["public"]["Enums"]["fund_request_status"]
          admin_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          euro_amount: number
          fitcoin_amount: number
          status?: Database["public"]["Enums"]["fund_request_status"]
          admin_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          euro_amount?: number
          fitcoin_amount?: number
          status?: Database["public"]["Enums"]["fund_request_status"]
          admin_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fund_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fund_requests_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          id: string
          key: string
          value: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      challenge_status: "PENDING" | "PASSED" | "FAILED"
      challenge_type: "DEXA" | "FUNCTIONAL"
      wager_prediction: "PASS" | "FAIL"
      wager_status: "OPEN" | "MATCHED" | "SETTLED" | "CANCELLED"
      fund_request_status: "PENDING" | "APPROVED" | "REJECTED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      challenge_status: ["PENDING", "PASSED", "FAILED"],
      challenge_type: ["DEXA", "FUNCTIONAL"],
      wager_prediction: ["PASS", "FAIL"],
      wager_status: ["OPEN", "MATCHED", "SETTLED", "CANCELLED"],
      fund_request_status: ["PENDING", "APPROVED", "REJECTED"],
    },
  },
} as const

