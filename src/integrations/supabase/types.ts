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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      disputes: {
        Row: {
          amount: number | null
          created_at: string
          id: string
          opened_by: string
          reason: string
          resolution: string | null
          service_request_id: string
          status: Database["public"]["Enums"]["dispute_status"]
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: string
          opened_by: string
          reason: string
          resolution?: string | null
          service_request_id: string
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: string
          opened_by?: string
          reason?: string
          resolution?: string | null
          service_request_id?: string
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      extra_charges: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          service_request_id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          service_request_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          service_request_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "extra_charges_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          message_type: string
          metadata: Json | null
          sender_id: string
          service_request_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          sender_id: string
          service_request_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          sender_id?: string
          service_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      oauth_states: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          nonce: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          nonce: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          nonce?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          client_id: string
          commission_rate: number
          created_at: string
          id: string
          mp_payment_id: string | null
          mp_preference_id: string | null
          payment_method: string | null
          platform_fee: number
          provider_amount: number
          provider_id: string
          service_request_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          client_id: string
          commission_rate?: number
          created_at?: string
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          payment_method?: string | null
          platform_fee?: number
          provider_amount?: number
          provider_id: string
          service_request_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string
          commission_rate?: number
          created_at?: string
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          payment_method?: string | null
          platform_fee?: number
          provider_amount?: number
          provider_id?: string
          service_request_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          after_url: string
          before_url: string
          created_at: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          after_url: string
          before_url: string
          created_at?: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          after_url?: string
          before_url?: string
          created_at?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bank_alias: string | null
          bank_cvu: string | null
          bio: string | null
          completed_jobs: number
          created_at: string
          criminal_record_url: string | null
          criminal_record_status: string
          criminal_record_notes: string | null
          criminal_record_expiry: string | null
          full_name: string
          id: string
          is_provider: boolean
          location: string | null
          phone: string | null
          provider_available: boolean
          provider_category: string | null
          provider_coverage_area: string[] | null
          provider_doc_urls: string[] | null
          provider_price_range: string | null
          provider_verification_notes: string | null
          provider_verification_status: string | null
          provider_verified: boolean
          rating_avg: number
          response_time: string | null
          review_count: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bank_alias?: string | null
          bank_cvu?: string | null
          bio?: string | null
          completed_jobs?: number
          created_at?: string
          criminal_record_url?: string | null
          criminal_record_status?: string
          criminal_record_notes?: string | null
          criminal_record_expiry?: string | null
          full_name?: string
          id: string
          is_provider?: boolean
          location?: string | null
          phone?: string | null
          provider_available?: boolean
          provider_category?: string | null
          provider_coverage_area?: string[] | null
          provider_doc_urls?: string[] | null
          provider_price_range?: string | null
          provider_verification_notes?: string | null
          provider_verification_status?: string | null
          provider_verified?: boolean
          rating_avg?: number
          response_time?: string | null
          review_count?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bank_alias?: string | null
          bank_cvu?: string | null
          bio?: string | null
          completed_jobs?: number
          created_at?: string
          criminal_record_url?: string | null
          criminal_record_status?: string
          criminal_record_notes?: string | null
          criminal_record_expiry?: string | null
          full_name?: string
          id?: string
          is_provider?: boolean
          location?: string | null
          phone?: string | null
          provider_available?: boolean
          provider_category?: string | null
          provider_coverage_area?: string[] | null
          provider_doc_urls?: string[] | null
          provider_price_range?: string | null
          provider_verification_notes?: string | null
          provider_verification_status?: string | null
          provider_verified?: boolean
          rating_avg?: number
          response_time?: string | null
          review_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      provider_mp_accounts: {
        Row: {
          connected_at: string
          id: string
          mp_access_token: string
          mp_email: string | null
          mp_public_key: string | null
          mp_refresh_token: string | null
          mp_user_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          connected_at?: string
          id?: string
          mp_access_token: string
          mp_email?: string | null
          mp_public_key?: string | null
          mp_refresh_token?: string | null
          mp_user_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          connected_at?: string
          id?: string
          mp_access_token?: string
          mp_email?: string | null
          mp_public_key?: string | null
          mp_refresh_token?: string | null
          mp_user_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewed_id: string
          reviewer_id: string
          service_request_id: string
          tags: string[] | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewed_id: string
          reviewer_id: string
          service_request_id: string
          tags?: string[] | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewed_id?: string
          reviewer_id?: string
          service_request_id?: string
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          address: string
          budget: number | null
          budget_amount: number | null
          budget_message: string | null
          category: string
          client_id: string
          created_at: string
          description: string
          id: string
          photos: string[] | null
          provider_id: string | null
          status: Database["public"]["Enums"]["service_status"]
          title: string
          updated_at: string
          urgency: Database["public"]["Enums"]["urgency_level"]
          verification_code: string | null
        }
        Insert: {
          address: string
          budget?: number | null
          budget_amount?: number | null
          budget_message?: string | null
          category: string
          client_id: string
          created_at?: string
          description: string
          id?: string
          photos?: string[] | null
          provider_id?: string | null
          status?: Database["public"]["Enums"]["service_status"]
          title: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
          verification_code?: string | null
        }
        Update: {
          address?: string
          budget?: number | null
          budget_amount?: number | null
          budget_message?: string | null
          category?: string
          client_id?: string
          created_at?: string
          description?: string
          id?: string
          photos?: string[] | null
          provider_id?: string | null
          status?: Database["public"]["Enums"]["service_status"]
          title?: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
          verification_code?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          completed_jobs: number | null
          created_at: string | null
          full_name: string | null
          id: string | null
          is_provider: boolean | null
          location: string | null
          provider_available: boolean | null
          provider_category: string | null
          provider_coverage_area: string[] | null
          provider_price_range: string | null
          provider_verified: boolean | null
          rating_avg: number | null
          response_time: string | null
          review_count: number | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          completed_jobs?: number | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          is_provider?: boolean | null
          location?: string | null
          provider_available?: boolean | null
          provider_category?: string | null
          provider_coverage_area?: string[] | null
          provider_price_range?: string | null
          provider_verified?: boolean | null
          rating_avg?: number | null
          response_time?: string | null
          review_count?: number | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          completed_jobs?: number | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          is_provider?: boolean | null
          location?: string | null
          provider_available?: boolean | null
          provider_category?: string | null
          provider_coverage_area?: string[] | null
          provider_price_range?: string | null
          provider_verified?: boolean | null
          rating_avg?: number | null
          response_time?: string | null
          review_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      claim_service_request: {
        Args: {
          p_request_id: string
          p_provider_id: string
          p_budget_amount: number
          p_budget_message?: string | null
        }
        Returns: { success: boolean; error?: string }
      }
      verify_and_start_service: {
        Args: {
          p_request_id: string
          p_code: string
        }
        Returns: { success: boolean; error?: string }
      }
      get_my_provider_category: { Args: never; Returns: string }
      get_profile_protected_fields: {
        Args: { _user_id: string }
        Returns: {
          completed_jobs: number
          is_provider: boolean
          provider_verified: boolean
          rating_avg: number
          review_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "client" | "provider"
      dispute_status: "abierta" | "en_revision" | "resuelta"
      service_status:
        | "nuevo"
        | "presupuestado"
        | "aceptado"
        | "en_progreso"
        | "finalizado_prestador"
        | "completado"
        | "cancelado"
      urgency_level: "baja" | "media" | "alta"
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
      app_role: ["admin", "moderator", "client", "provider"],
      dispute_status: ["abierta", "en_revision", "resuelta"],
      service_status: [
        "nuevo",
        "presupuestado",
        "aceptado",
        "en_progreso",
        "finalizado_prestador",
        "completado",
        "cancelado",
      ],
      urgency_level: ["baja", "media", "alta"],
    },
  },
} as const
