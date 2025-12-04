// Supabase database types
// This is a placeholder - in production, generate types using:
// npx supabase gen types typescript --project-id <your-project-id> > src/types/supabase.ts

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name?: string;
          first_name?: string;
          last_name?: string;
          phone_number?: string;
          time_zone?: string;
          travel_preferences?: Record<string, any>;
          onboarding_completed?: boolean;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          first_name?: string;
          last_name?: string;
          phone_number?: string;
          time_zone?: string;
          travel_preferences?: Record<string, any>;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          first_name?: string;
          last_name?: string;
          phone_number?: string;
          time_zone?: string;
          travel_preferences?: Record<string, any>;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title?: string;
          description?: string;
          task_type?: string;
          assigned_agent?: string;
          status?: string;
          priority?: number;
          input_data?: Record<string, any>;
          output_data?: Record<string, any>;
          requires_human?: boolean;
          escalation_reason?: string;
          due_date?: string;
          created_at?: string;
          started_at?: string;
          completed_at?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          description?: string;
          task_type?: string;
          assigned_agent?: string;
          status?: string;
          priority?: number;
          input_data?: Record<string, any>;
          output_data?: Record<string, any>;
          requires_human?: boolean;
          escalation_reason?: string;
          due_date?: string;
          created_at?: string;
          started_at?: string;
          completed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          task_type?: string;
          assigned_agent?: string;
          status?: string;
          priority?: number;
          input_data?: Record<string, any>;
          output_data?: Record<string, any>;
          requires_human?: boolean;
          escalation_reason?: string;
          due_date?: string;
          created_at?: string;
          started_at?: string;
          completed_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          role?: string;
          content?: string;
          related_task_id?: string;
          metadata?: Record<string, any>;
          created_at?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: string;
          content?: string;
          related_task_id?: string;
          metadata?: Record<string, any>;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string;
          content?: string;
          related_task_id?: string;
          metadata?: Record<string, any>;
          created_at?: string;
        };
      };
      integrations: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          access_token?: string;
          refresh_token?: string;
          expires_at?: string;
          scopes?: string[];
          is_active?: boolean;
          last_sync_at?: string;
          sync_cursor?: string;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: string;
          access_token?: string;
          refresh_token?: string;
          expires_at?: string;
          scopes?: string[];
          is_active?: boolean;
          last_sync_at?: string;
          sync_cursor?: string;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: string;
          access_token?: string;
          refresh_token?: string;
          expires_at?: string;
          scopes?: string[];
          is_active?: boolean;
          last_sync_at?: string;
          sync_cursor?: string;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
      entities: {
        Row: {
          id: string;
          user_id: string;
          entity_type: string;
          data: Record<string, any>;
          source?: string;
          source_id?: string;
          confidence?: number;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entity_type: string;
          data: Record<string, any>;
          source?: string;
          source_id?: string;
          confidence?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          entity_type?: string;
          data?: Record<string, any>;
          source?: string;
          source_id?: string;
          confidence?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      calendar_events: {
        Row: {
          id: string;
          user_id: string;
          gcal_event_id: string;
          gcal_calendar_id: string;
          title?: string;
          description?: string;
          location?: string;
          start_time: string;
          end_time: string;
          all_day?: boolean;
          time_zone?: string;
          status?: string;
          related_trip_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          gcal_event_id: string;
          gcal_calendar_id: string;
          title?: string;
          description?: string;
          location?: string;
          start_time: string;
          end_time: string;
          all_day?: boolean;
          time_zone?: string;
          status?: string;
          related_trip_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          gcal_event_id?: string;
          gcal_calendar_id?: string;
          title?: string;
          description?: string;
          location?: string;
          start_time?: string;
          end_time?: string;
          all_day?: boolean;
          time_zone?: string;
          status?: string;
          related_trip_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      emails: {
        Row: {
          id: string;
          user_id: string;
          gmail_message_id: string;
          gmail_thread_id?: string;
          subject?: string;
          from_address?: string;
          received_at: string;
          body_preview?: string;
          category?: string;
          extracted_data?: Record<string, any>;
          processed?: boolean;
          created_at?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          gmail_message_id: string;
          gmail_thread_id?: string;
          subject?: string;
          from_address?: string;
          received_at: string;
          body_preview?: string;
          category?: string;
          extracted_data?: Record<string, any>;
          processed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          gmail_message_id?: string;
          gmail_thread_id?: string;
          subject?: string;
          from_address?: string;
          received_at?: string;
          body_preview?: string;
          category?: string;
          extracted_data?: Record<string, any>;
          processed?: boolean;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          notification_type?: string;
          action_url?: string;
          action_label?: string;
          related_entity_id?: string;
          related_task_id?: string;
          read_at?: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          notification_type?: string;
          action_url?: string;
          action_label?: string;
          related_entity_id?: string;
          related_task_id?: string;
          read_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          notification_type?: string;
          action_url?: string;
          action_label?: string;
          related_entity_id?: string;
          related_task_id?: string;
          read_at?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

