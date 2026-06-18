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
          plan: "free" | "pro" | "unlimited" | "founder";
          founder: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          plan?: "free" | "pro" | "unlimited" | "founder";
          founder?: boolean;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
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
      chat_usage: {
        Row: {
          id: string;
          user_id: string;
          book_id: string | null;
          month: string;
          question_count: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          book_id?: string | null;
          month: string;
          question_count?: number;
        };
        Update: {
          question_count?: number;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          role: "user" | "assistant";
          content: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          book_id: string;
          role: "user" | "assistant";
          content: string;
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
          plan: string;
          status: string;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
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
        Insert: Record<string, never>;
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
        };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
