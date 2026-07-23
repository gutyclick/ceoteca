export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          birth_date: string | null;
          occupation: string | null;
          discovery_source: string[] | null;
          starter_book_id: string | null;
          plan: "free" | "pro" | "unlimited" | "founder";
          founder: boolean;
          onboarding_completed: boolean;
          plan_selected_at: string | null;
          terms_accepted_at: string | null;
          terms_version: string | null;
          privacy_accepted_at: string | null;
          privacy_version: string | null;
          legal_acceptance_ip: string | null;
          legal_acceptance_user_agent: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          birth_date?: string | null;
          occupation?: string | null;
          discovery_source?: string[] | null;
          starter_book_id?: string | null;
          plan?: "free" | "pro" | "unlimited" | "founder";
          founder?: boolean;
          onboarding_completed?: boolean;
          plan_selected_at?: string | null;
          terms_accepted_at?: string | null;
          terms_version?: string | null;
          privacy_accepted_at?: string | null;
          privacy_version?: string | null;
          legal_acceptance_ip?: string | null;
          legal_acceptance_user_agent?: string | null;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          birth_date?: string | null;
          occupation?: string | null;
          discovery_source?: string[] | null;
          starter_book_id?: string | null;
          plan?: "free" | "pro" | "unlimited" | "founder";
          founder?: boolean;
          onboarding_completed?: boolean;
          plan_selected_at?: string | null;
          terms_accepted_at?: string | null;
          terms_version?: string | null;
          privacy_accepted_at?: string | null;
          privacy_version?: string | null;
          legal_acceptance_ip?: string | null;
          legal_acceptance_user_agent?: string | null;
        };
        Relationships: [];
      };
      books: {
        Row: {
          id: string;
          slug: string;
          title: string;
          author: string;
          category: string;
          description: string;
          cover_config: Json;
          reading_time: number;
          difficulty: string;
          tags: string[];
          audio_url: string | null;
          purchase_url: string | null;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      book_sections: {
        Row: {
          id: string;
          book_id: string;
          section_type: string;
          title: string;
          content: Json;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      user_book_progress: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          progress: number;
          completed: boolean;
          last_section_id: string | null;
          started_at: string;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          book_id: string;
          progress?: number;
          completed?: boolean;
          last_section_id?: string | null;
          completed_at?: string | null;
        };
        Update: {
          progress?: number;
          completed?: boolean;
          last_section_id?: string | null;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      user_book_favorites: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          book_id: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      chat_usage: {
        Row: {
          id: string;
          user_id: string;
          book_id: string | null;
          context: "book" | "site";
          month: string;
          question_count: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          book_id?: string | null;
          context?: "book" | "site";
          month: string;
          question_count?: number;
        };
        Update: {
          context?: "book" | "site";
          question_count?: number;
        };
        Relationships: [];
      };
      chat_usage_events: {
        Row: {
          id: string;
          user_id: string;
          conversation_id: string | null;
          message_id: string | null;
          book_id: string | null;
          feature: string;
          plan: "free" | "pro" | "unlimited" | "founder";
          usage_type: "message" | "regeneration" | "contextual_action" | "book_chat" | "general_chat" | "promotional" | "adjustment";
          amount: number;
          status: "pending" | "consumed" | "released" | "refunded" | "failed";
          idempotency_key: string;
          period_kind: "calendar_month" | "billing_cycle" | "day" | "promotional" | "total" | "unlimited";
          period_start: string;
          period_end: string;
          metadata: Json;
          reserved_at: string;
          consumed_at: string | null;
          released_at: string | null;
          refunded_at: string | null;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          conversation_id?: string | null;
          message_id?: string | null;
          book_id?: string | null;
          feature?: string;
          plan: "free" | "pro" | "unlimited" | "founder";
          usage_type: "message" | "regeneration" | "contextual_action" | "book_chat" | "general_chat" | "promotional" | "adjustment";
          amount?: number;
          status?: "pending" | "consumed" | "released" | "refunded" | "failed";
          idempotency_key: string;
          period_kind?: "calendar_month" | "billing_cycle" | "day" | "promotional" | "total" | "unlimited";
          period_start: string;
          period_end: string;
          metadata?: Json;
          reserved_at?: string;
          consumed_at?: string | null;
          released_at?: string | null;
          refunded_at?: string | null;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          conversation_id?: string | null;
          message_id?: string | null;
          status?: "pending" | "consumed" | "released" | "refunded" | "failed";
          metadata?: Json;
          consumed_at?: string | null;
          released_at?: string | null;
          refunded_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          user_id: string;
          book_id: string | null;
          context: "book" | "site";
          conversation_id: string | null;
          role: "user" | "assistant" | "system" | "tool";
          content: string;
          parts: Json | null;
          status: "pending" | "streaming" | "completed" | "stopped" | "interrupted" | "failed";
          created_at: string;
          updated_at: string;
          parent_message_id: string | null;
          metadata: Json;
          client_message_id: string | null;
        };
        Insert: {
          user_id: string;
          book_id?: string | null;
          context?: "book" | "site";
          conversation_id?: string | null;
          role: "user" | "assistant" | "system" | "tool";
          content: string;
          parts?: Json | null;
          status?: "pending" | "streaming" | "completed" | "stopped" | "interrupted" | "failed";
          updated_at?: string;
          parent_message_id?: string | null;
          metadata?: Json;
          client_message_id?: string | null;
        };
        Update: {
          content?: string;
          parts?: Json | null;
          status?: "pending" | "streaming" | "completed" | "stopped" | "interrupted" | "failed";
          updated_at?: string;
          parent_message_id?: string | null;
          metadata?: Json;
        };
        Relationships: [];
      };
      chat_message_feedback: {
        Row: {
          id: string;
          user_id: string;
          message_id: string;
          rating: "helpful" | "not_helpful";
          reason: "not_answered" | "too_generic" | "incorrect" | "hard_to_understand" | "other" | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          message_id: string;
          rating: "helpful" | "not_helpful";
          reason?: "not_answered" | "too_generic" | "incorrect" | "hard_to_understand" | "other" | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          rating?: "helpful" | "not_helpful";
          reason?: "not_answered" | "too_generic" | "incorrect" | "hard_to_understand" | "other" | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      chat_message_versions: {
        Row: {
          id: string;
          message_id: string;
          user_id: string;
          version_number: number;
          content: string;
          parts: Json | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          user_id: string;
          version_number: number;
          content: string;
          parts?: Json | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          content?: string;
          parts?: Json | null;
          metadata?: Json;
        };
        Relationships: [];
      };
      chat_conversations: {
        Row: {
          id: string;
          user_id: string;
          context: "book" | "site";
          type: "general" | "book";
          book_id: string | null;
          title: string;
          archived_at: string | null;
          status: "active" | "archived";
          metadata: Json;
          title_is_manual: boolean;
          client_creation_key: string | null;
          last_message_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          context?: "book" | "site";
          type: "general" | "book";
          book_id?: string | null;
          title?: string;
          archived_at?: string | null;
          status?: "active" | "archived";
          metadata?: Json;
          title_is_manual?: boolean;
          client_creation_key?: string | null;
          last_message_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          archived_at?: string | null;
          status?: "active" | "archived";
          metadata?: Json;
          title_is_manual?: boolean;
          last_message_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      chat_book_preferences: {
        Row: {
          user_id: string;
          book_id: string;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          book_id: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      chat_events: {
        Row: {
          id: string;
          user_id: string;
          book_id: string | null;
          context: "book" | "site";
          event_type:
            | "moderation_block"
            | "limit_reached"
            | "provider_error"
            | "validation_error"
            | "usage_reserved"
            | "usage_consumed"
            | "usage_released"
            | "usage_limit_reached"
            | "usage_regeneration"
            | "usage_contextual_action"
            | "usage_rate_limited";
          code: string;
          message: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          user_id: string;
          book_id?: string | null;
          context?: "book" | "site";
          event_type:
            | "moderation_block"
            | "limit_reached"
            | "provider_error"
            | "validation_error"
            | "usage_reserved"
            | "usage_consumed"
            | "usage_released"
            | "usage_limit_reached"
            | "usage_regeneration"
            | "usage_contextual_action"
            | "usage_rate_limited";
          code: string;
          message?: string | null;
          metadata?: Json;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          provider_customer_id: string | null;
          provider_subscription_id: string | null;
          plan: "free" | "pro" | "unlimited" | "founder";
          status:
            | "incomplete"
            | "pending_payment"
            | "trialing"
            | "active"
            | "past_due"
            | "canceled"
            | "unpaid"
            | "paused";
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          provider: string;
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          plan: "free" | "pro" | "unlimited" | "founder";
          status:
            | "incomplete"
            | "pending_payment"
            | "trialing"
            | "active"
            | "past_due"
            | "canceled"
            | "unpaid"
            | "paused";
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
        };
        Update: {
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          plan?: "free" | "pro" | "unlimited" | "founder";
          status?:
            | "incomplete"
            | "pending_payment"
            | "trialing"
            | "active"
            | "past_due"
            | "canceled"
            | "unpaid"
            | "paused";
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
        };
        Relationships: [];
      };
      audio_assets: {
        Row: {
          id: string;
          book_id: string;
          storage_path: string;
          voice: string | null;
          model: string | null;
          duration_seconds: number | null;
          status: "pending" | "processing" | "ready" | "failed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          book_id: string;
          storage_path: string;
          voice?: string | null;
          model?: string | null;
          duration_seconds?: number | null;
          status?: "pending" | "processing" | "ready" | "failed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          book_id?: string;
          storage_path?: string;
          voice?: string | null;
          model?: string | null;
          duration_seconds?: number | null;
          status?: "pending" | "processing" | "ready" | "failed";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type:
            | "reading_reminder"
            | "progress"
            | "recommendation"
            | "ai"
              | "account"
              | "subscription"
              | "system"
              | "achievement";
          title: string;
          body: string;
          href: string | null;
          metadata: Json;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          type:
            | "reading_reminder"
            | "progress"
            | "recommendation"
            | "ai"
              | "account"
              | "subscription"
              | "system"
              | "achievement";
          title: string;
          body: string;
          href?: string | null;
          metadata?: Json;
          read_at?: string | null;
        };
        Update: {
          read_at?: string | null;
        };
        Relationships: [];
      };
      achievement_definitions: {
        Row: {
          code: string;
          title: string;
          description: string;
          icon: string;
          target: number;
          position: number;
          created_at: string;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_code: string;
          progress: number;
          unlocked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      user_activity_days: {
        Row: {
          user_id: string;
          activity_date: string;
          created_at: string;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      auth_events: {
        Row: {
          id: string;
          user_id: string | null;
          email: string | null;
          event_type:
            | "register_attempt"
            | "register_success"
            | "register_confirmation_required"
            | "register_error"
            | "login_attempt"
            | "login_success"
            | "login_error"
            | "resend_confirmation"
            | "password_reset_requested"
            | "password_reset_updated"
            | "password_reset_error"
            | "oauth_callback"
            | "oauth_error"
            | "rate_limit";
          provider: string;
          code: string | null;
          message: string | null;
          ip: string | null;
          user_agent: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          user_id?: string | null;
          email?: string | null;
          event_type:
            | "register_attempt"
            | "register_success"
            | "register_confirmation_required"
            | "register_error"
            | "login_attempt"
            | "login_success"
            | "login_error"
            | "resend_confirmation"
            | "password_reset_requested"
            | "password_reset_updated"
            | "password_reset_error"
            | "oauth_callback"
            | "oauth_error"
            | "rate_limit";
          provider?: string;
          code?: string | null;
          message?: string | null;
          ip?: string | null;
          user_agent?: string | null;
          metadata?: Json;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_chat_usage: {
        Args: {
          target_user_id: string;
          target_book_id: string;
          target_month: string;
          target_context?: "book" | "site";
        };
        Returns: number;
      };
      reserve_chat_usage: {
        Args: {
          target_user_id: string;
          target_plan: string;
          target_limit: number | null;
          target_period_start: string;
          target_period_end: string;
          target_period_kind: string;
          target_idempotency_key: string;
          target_usage_type: string;
          target_book_id?: string | null;
          target_metadata?: Json;
        };
        Returns: Json;
      };
      confirm_chat_usage: {
        Args: { target_usage_id: string; target_user_id: string };
        Returns: Json;
      };
      release_chat_usage: {
        Args: { target_usage_id: string; target_user_id: string; target_reason?: string };
        Returns: Json;
      };
      get_chat_usage_snapshot: {
        Args: {
          target_user_id: string;
          target_plan: string;
          target_limit: number | null;
          target_period_start: string;
          target_period_end: string;
        };
        Returns: Json;
      };
      evaluate_user_achievements: {
        Args: { target_user_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
