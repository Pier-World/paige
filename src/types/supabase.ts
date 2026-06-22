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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          action_type: string
          actor: string | null
          conversation_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          request_id: string | null
        }
        Insert: {
          action_type: string
          actor?: string | null
          conversation_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          request_id?: string | null
        }
        Update: {
          action_type?: string
          actor?: string | null
          conversation_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      api_credentials: {
        Row: {
          api_key: string
          api_secret: string | null
          base_url: string
          created_at: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          priority: number | null
          provider: string
          rate_limit_per_minute: number | null
          updated_at: string | null
        }
        Insert: {
          api_key: string
          api_secret?: string | null
          base_url: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          priority?: number | null
          provider: string
          rate_limit_per_minute?: number | null
          updated_at?: string | null
        }
        Update: {
          api_key?: string
          api_secret?: string | null
          base_url?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          priority?: number | null
          provider?: string
          rate_limit_per_minute?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      automations: {
        Row: {
          automation_type: string
          config: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_run_at: string | null
          name: string
          next_run_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          automation_type: string
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          automation_type?: string
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          created_at: string | null
          description: string | null
          end_time: string
          gcal_calendar_id: string
          gcal_event_id: string
          id: string
          location: string | null
          metadata: Json | null
          related_trip_id: string | null
          start_time: string
          status: string | null
          time_zone: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          all_day?: boolean | null
          created_at?: string | null
          description?: string | null
          end_time: string
          gcal_calendar_id: string
          gcal_event_id: string
          id?: string
          location?: string | null
          metadata?: Json | null
          related_trip_id?: string | null
          start_time: string
          status?: string | null
          time_zone?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          all_day?: boolean | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          gcal_calendar_id?: string
          gcal_event_id?: string
          id?: string
          location?: string | null
          metadata?: Json | null
          related_trip_id?: string | null
          start_time?: string
          status?: string | null
          time_zone?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_related_trip_id_fkey"
            columns: ["related_trip_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      capital_deal_documents: {
        Row: {
          access_level: string
          created_at: string
          deal_id: string
          display_size: string | null
          document_type: string
          external_url: string | null
          file_size_bytes: number | null
          id: string
          label: string
          sort_order: number
          storage_path: string | null
          updated_at: string
        }
        Insert: {
          access_level?: string
          created_at?: string
          deal_id: string
          display_size?: string | null
          document_type: string
          external_url?: string | null
          file_size_bytes?: number | null
          id?: string
          label: string
          sort_order?: number
          storage_path?: string | null
          updated_at?: string
        }
        Update: {
          access_level?: string
          created_at?: string
          deal_id?: string
          display_size?: string | null
          document_type?: string
          external_url?: string | null
          file_size_bytes?: number | null
          id?: string
          label?: string
          sort_order?: number
          storage_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "capital_deal_documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "capital_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      capital_deal_import_batches: {
        Row: {
          created_at: string
          created_by: string | null
          failed_count: number
          id: string
          imported_count: number
          notes: string | null
          source_filename: string | null
          source_record_count: number
          source_system: string | null
          source_type: string
          source_url: string | null
          status: string
          updated_at: string
          validation_errors: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          failed_count?: number
          id?: string
          imported_count?: number
          notes?: string | null
          source_filename?: string | null
          source_record_count?: number
          source_system?: string | null
          source_type?: string
          source_url?: string | null
          status?: string
          updated_at?: string
          validation_errors?: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          failed_count?: number
          id?: string
          imported_count?: number
          notes?: string | null
          source_filename?: string | null
          source_record_count?: number
          source_system?: string | null
          source_type?: string
          source_url?: string | null
          status?: string
          updated_at?: string
          validation_errors?: Json
        }
        Relationships: [
          {
            foreignKeyName: "capital_deal_import_batches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      capital_deal_interests: {
        Row: {
          admin_notes: string | null
          commitment_amount: number | null
          created_at: string
          currency_code: string
          deal_id: string
          id: string
          member_id: string
          message: string | null
          request_type: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          commitment_amount?: number | null
          created_at?: string
          currency_code?: string
          deal_id: string
          id?: string
          member_id: string
          message?: string | null
          request_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          commitment_amount?: number | null
          created_at?: string
          currency_code?: string
          deal_id?: string
          id?: string
          member_id?: string
          message?: string | null
          request_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "capital_deal_interests_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "capital_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capital_deal_interests_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      capital_deal_source_materials: {
        Row: {
          created_at: string
          created_by: string | null
          deal_id: string | null
          external_url: string | null
          extracted_text: string | null
          file_size_bytes: number | null
          generated_summary: string | null
          id: string
          import_batch_id: string | null
          internal_notes: string | null
          label: string
          material_type: string
          mime_type: string | null
          original_filename: string | null
          review_status: string
          storage_path: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          external_url?: string | null
          extracted_text?: string | null
          file_size_bytes?: number | null
          generated_summary?: string | null
          id?: string
          import_batch_id?: string | null
          internal_notes?: string | null
          label: string
          material_type?: string
          mime_type?: string | null
          original_filename?: string | null
          review_status?: string
          storage_path?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          external_url?: string | null
          extracted_text?: string | null
          file_size_bytes?: number | null
          generated_summary?: string | null
          id?: string
          import_batch_id?: string | null
          internal_notes?: string | null
          label?: string
          material_type?: string
          mime_type?: string | null
          original_filename?: string | null
          review_status?: string
          storage_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "capital_deal_source_materials_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capital_deal_source_materials_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "capital_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capital_deal_source_materials_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "capital_deal_import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      capital_deals: {
        Row: {
          allocation_subscribed_percent: number
          asset_class: string
          close_date: string | null
          contacts: Json
          created_at: string
          currency_code: string
          deal_type: string
          description: string
          disclaimer: string | null
          eligible_investor_requirements: string | null
          generated_summary: string | null
          geography: string | null
          holding_period_years: number | null
          id: string
          import_batch_id: string | null
          internal_notes: string | null
          jurisdiction: string | null
          last_imported_at: string | null
          liquidity_note: string | null
          manager_name: string
          min_commitment: number | null
          moic_target: number | null
          name: string
          offering_type: string | null
          published_at: string | null
          raised_size: number
          return_display: string | null
          return_metric_type: string
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          sectors: string[]
          slug: string
          sort_order: number
          source_record_id: string | null
          source_system: string | null
          source_url: string | null
          sponsor_profile_id: string | null
          status: string
          target_irr: number | null
          target_size: number
          thesis: string | null
          unpublished_at: string | null
          updated_at: string
          vintage: number | null
          visibility_tier: string
          why_pier_selected: string | null
        }
        Insert: {
          allocation_subscribed_percent?: number
          asset_class: string
          close_date?: string | null
          contacts?: Json
          created_at?: string
          currency_code?: string
          deal_type: string
          description: string
          disclaimer?: string | null
          eligible_investor_requirements?: string | null
          generated_summary?: string | null
          geography?: string | null
          holding_period_years?: number | null
          id?: string
          import_batch_id?: string | null
          internal_notes?: string | null
          jurisdiction?: string | null
          last_imported_at?: string | null
          liquidity_note?: string | null
          manager_name: string
          min_commitment?: number | null
          moic_target?: number | null
          name: string
          offering_type?: string | null
          published_at?: string | null
          raised_size?: number
          return_display?: string | null
          return_metric_type?: string
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sectors?: string[]
          slug: string
          sort_order?: number
          source_record_id?: string | null
          source_system?: string | null
          source_url?: string | null
          sponsor_profile_id?: string | null
          status?: string
          target_irr?: number | null
          target_size: number
          thesis?: string | null
          unpublished_at?: string | null
          updated_at?: string
          vintage?: number | null
          visibility_tier?: string
          why_pier_selected?: string | null
        }
        Update: {
          allocation_subscribed_percent?: number
          asset_class?: string
          close_date?: string | null
          contacts?: Json
          created_at?: string
          currency_code?: string
          deal_type?: string
          description?: string
          disclaimer?: string | null
          eligible_investor_requirements?: string | null
          generated_summary?: string | null
          geography?: string | null
          holding_period_years?: number | null
          id?: string
          import_batch_id?: string | null
          internal_notes?: string | null
          jurisdiction?: string | null
          last_imported_at?: string | null
          liquidity_note?: string | null
          manager_name?: string
          min_commitment?: number | null
          moic_target?: number | null
          name?: string
          offering_type?: string | null
          published_at?: string | null
          raised_size?: number
          return_display?: string | null
          return_metric_type?: string
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sectors?: string[]
          slug?: string
          sort_order?: number
          source_record_id?: string | null
          source_system?: string | null
          source_url?: string | null
          sponsor_profile_id?: string | null
          status?: string
          target_irr?: number | null
          target_size?: number
          thesis?: string | null
          unpublished_at?: string | null
          updated_at?: string
          vintage?: number | null
          visibility_tier?: string
          why_pier_selected?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "capital_deals_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "capital_deal_import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capital_deals_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capital_deals_sponsor_profile_id_fkey"
            columns: ["sponsor_profile_id"]
            isOneToOne: false
            referencedRelation: "capital_member_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      capital_event_rsvps: {
        Row: {
          admin_notes: string | null
          attendee_count: number
          created_at: string
          event_id: string
          id: string
          member_id: string
          message: string | null
          responded_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          attendee_count?: number
          created_at?: string
          event_id: string
          id?: string
          member_id: string
          message?: string | null
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          attendee_count?: number
          created_at?: string
          event_id?: string
          id?: string
          member_id?: string
          message?: string | null
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "capital_event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "capital_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capital_event_rsvps_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      capital_events: {
        Row: {
          audience: string | null
          capacity: number | null
          city: string
          created_at: string
          description: string
          ends_at: string | null
          event_type: string
          external_registration_label: string | null
          external_registration_url: string | null
          featured: boolean
          host_name: string | null
          host_type: string
          id: string
          location: string
          location_is_public: boolean
          published_at: string | null
          recap_url: string | null
          registered_count: number
          slug: string
          sort_order: number
          starts_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string | null
          capacity?: number | null
          city: string
          created_at?: string
          description: string
          ends_at?: string | null
          event_type: string
          external_registration_label?: string | null
          external_registration_url?: string | null
          featured?: boolean
          host_name?: string | null
          host_type?: string
          id?: string
          location: string
          location_is_public?: boolean
          published_at?: string | null
          recap_url?: string | null
          registered_count?: number
          slug: string
          sort_order?: number
          starts_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string | null
          capacity?: number | null
          city?: string
          created_at?: string
          description?: string
          ends_at?: string | null
          event_type?: string
          external_registration_label?: string | null
          external_registration_url?: string | null
          featured?: boolean
          host_name?: string | null
          host_type?: string
          id?: string
          location?: string
          location_is_public?: boolean
          published_at?: string | null
          recap_url?: string | null
          registered_count?: number
          slug?: string
          sort_order?: number
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      capital_member_profiles: {
        Row: {
          aum_display: string | null
          aum_numeric: number | null
          avatar_url: string | null
          bio: string | null
          check_size_display: string | null
          check_size_max: number | null
          check_size_min: number | null
          created_at: string
          currency_code: string
          display_name: string
          firm: string
          focus_sectors: string[]
          id: string
          investment_thesis: string | null
          location: string | null
          member_id: string | null
          published_at: string | null
          role: string
          slug: string
          sort_order: number
          status: string
          title: string | null
          updated_at: string
          verified: boolean
        }
        Insert: {
          aum_display?: string | null
          aum_numeric?: number | null
          avatar_url?: string | null
          bio?: string | null
          check_size_display?: string | null
          check_size_max?: number | null
          check_size_min?: number | null
          created_at?: string
          currency_code?: string
          display_name: string
          firm: string
          focus_sectors?: string[]
          id?: string
          investment_thesis?: string | null
          location?: string | null
          member_id?: string | null
          published_at?: string | null
          role: string
          slug: string
          sort_order?: number
          status?: string
          title?: string | null
          updated_at?: string
          verified?: boolean
        }
        Update: {
          aum_display?: string | null
          aum_numeric?: number | null
          avatar_url?: string | null
          bio?: string | null
          check_size_display?: string | null
          check_size_max?: number | null
          check_size_min?: number | null
          created_at?: string
          currency_code?: string
          display_name?: string
          firm?: string
          focus_sectors?: string[]
          id?: string
          investment_thesis?: string | null
          location?: string | null
          member_id?: string | null
          published_at?: string | null
          role?: string
          slug?: string
          sort_order?: number
          status?: string
          title?: string | null
          updated_at?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "capital_member_profiles_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      capital_partner_intros: {
        Row: {
          admin_notes: string | null
          contact_preference: string | null
          created_at: string
          id: string
          introduced_at: string | null
          member_id: string
          message: string | null
          partner_id: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          contact_preference?: string | null
          created_at?: string
          id?: string
          introduced_at?: string | null
          member_id: string
          message?: string | null
          partner_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          contact_preference?: string | null
          created_at?: string
          id?: string
          introduced_at?: string | null
          member_id?: string
          message?: string | null
          partner_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "capital_partner_intros_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capital_partner_intros_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "capital_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      capital_partners: {
        Row: {
          benefit: string
          category: string
          created_at: string
          description: string
          featured: boolean
          id: string
          location: string | null
          name: string
          published_at: string | null
          slug: string
          sort_order: number
          status: string
          tagline: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          benefit: string
          category: string
          created_at?: string
          description: string
          featured?: boolean
          id?: string
          location?: string | null
          name: string
          published_at?: string | null
          slug: string
          sort_order?: number
          status?: string
          tagline?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          benefit?: string
          category?: string
          created_at?: string
          description?: string
          featured?: boolean
          id?: string
          location?: string | null
          name?: string
          published_at?: string | null
          slug?: string
          sort_order?: number
          status?: string
          tagline?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      channels: {
        Row: {
          created_at: string | null
          external_contact_id: string | null
          id: string
          profile_id: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          external_contact_id?: string | null
          id?: string
          profile_id?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          external_contact_id?: string | null
          id?: string
          profile_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channels_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "orphaned_profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "valid_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      concierge_conversations: {
        Row: {
          created_at: string
          id: string
          is_archived: boolean
          last_message_at: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_archived?: boolean
          last_message_at?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_archived?: boolean
          last_message_at?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      concierge_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "concierge_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "concierge_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          channel_id: string | null
          content: string | null
          created_at: string | null
          front_conversation_id: string | null
          front_inbox_id: string | null
          id: string
          last_message_at: string | null
          metadata: Json | null
          profile_id: string | null
          related_task_id: string | null
          role: string | null
          started_at: string | null
          user_id: string | null
        }
        Insert: {
          channel_id?: string | null
          content?: string | null
          created_at?: string | null
          front_conversation_id?: string | null
          front_inbox_id?: string | null
          id?: string
          last_message_at?: string | null
          metadata?: Json | null
          profile_id?: string | null
          related_task_id?: string | null
          role?: string | null
          started_at?: string | null
          user_id?: string | null
        }
        Update: {
          channel_id?: string | null
          content?: string | null
          created_at?: string | null
          front_conversation_id?: string | null
          front_inbox_id?: string | null
          id?: string
          last_message_at?: string | null
          metadata?: Json | null
          profile_id?: string | null
          related_task_id?: string | null
          role?: string | null
          started_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "orphaned_profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "valid_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_related_task_id_fkey"
            columns: ["related_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_briefs: {
        Row: {
          action_needed_count: number
          brief_date: string
          content: string
          created_at: string
          dismissed_at: string | null
          generated_at: string
          generation_method: string | null
          generation_time_ms: number | null
          id: string
          notification_sent: boolean
          notification_sent_at: string | null
          opportunities_count: number
          opportunity_ids: string[] | null
          prepared_count: number
          read_at: string | null
          user_id: string
        }
        Insert: {
          action_needed_count?: number
          brief_date: string
          content: string
          created_at?: string
          dismissed_at?: string | null
          generated_at?: string
          generation_method?: string | null
          generation_time_ms?: number | null
          id?: string
          notification_sent?: boolean
          notification_sent_at?: string | null
          opportunities_count?: number
          opportunity_ids?: string[] | null
          prepared_count?: number
          read_at?: string | null
          user_id: string
        }
        Update: {
          action_needed_count?: number
          brief_date?: string
          content?: string
          created_at?: string
          dismissed_at?: string | null
          generated_at?: string
          generation_method?: string | null
          generation_time_ms?: number | null
          id?: string
          notification_sent?: boolean
          notification_sent_at?: string | null
          opportunities_count?: number
          opportunity_ids?: string[] | null
          prepared_count?: number
          read_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_context: {
        Row: {
          confirmation_code: string | null
          confirmation_type: string
          created_at: string
          email_id: string
          extraction_confidence: number | null
          extraction_errors: string[] | null
          extraction_method: string | null
          gmail_message_id: string | null
          id: string
          parsed_at: string
          parsed_data: Json
          processed: boolean
          related_potential_trip_id: string | null
          user_id: string
        }
        Insert: {
          confirmation_code?: string | null
          confirmation_type: string
          created_at?: string
          email_id: string
          extraction_confidence?: number | null
          extraction_errors?: string[] | null
          extraction_method?: string | null
          gmail_message_id?: string | null
          id?: string
          parsed_at?: string
          parsed_data?: Json
          processed?: boolean
          related_potential_trip_id?: string | null
          user_id: string
        }
        Update: {
          confirmation_code?: string | null
          confirmation_type?: string
          created_at?: string
          email_id?: string
          extraction_confidence?: number | null
          extraction_errors?: string[] | null
          extraction_method?: string | null
          gmail_message_id?: string | null
          id?: string
          parsed_at?: string
          parsed_data?: Json
          processed?: boolean
          related_potential_trip_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_email_context_email"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_email_context_potential_trip"
            columns: ["related_potential_trip_id"]
            isOneToOne: false
            referencedRelation: "potential_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      emails: {
        Row: {
          body_preview: string | null
          category: string | null
          created_at: string | null
          extracted_data: Json | null
          from_address: string | null
          gmail_message_id: string
          gmail_thread_id: string | null
          id: string
          processed: boolean | null
          received_at: string
          subject: string | null
          user_id: string
        }
        Insert: {
          body_preview?: string | null
          category?: string | null
          created_at?: string | null
          extracted_data?: Json | null
          from_address?: string | null
          gmail_message_id: string
          gmail_thread_id?: string | null
          id?: string
          processed?: boolean | null
          received_at: string
          subject?: string | null
          user_id: string
        }
        Update: {
          body_preview?: string | null
          category?: string | null
          created_at?: string | null
          extracted_data?: Json | null
          from_address?: string | null
          gmail_message_id?: string
          gmail_thread_id?: string | null
          id?: string
          processed?: boolean | null
          received_at?: string
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      entities: {
        Row: {
          confidence: number | null
          created_at: string | null
          data: Json
          entity_type: string
          id: string
          source: string | null
          source_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          data: Json
          entity_type: string
          id?: string
          source?: string | null
          source_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          data?: Json
          entity_type?: string
          id?: string
          source?: string | null
          source_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          city: string
          created_at: string | null
          date: string
          description: string
          featured: boolean
          id: string
          image_url: string
          location: string
          rsvp_instructions: string | null
          short_description: string
          tags: string[]
          time: string
          title: string
          updated_at: string | null
        }
        Insert: {
          city: string
          created_at?: string | null
          date: string
          description: string
          featured?: boolean
          id?: string
          image_url: string
          location: string
          rsvp_instructions?: string | null
          short_description: string
          tags?: string[]
          time: string
          title: string
          updated_at?: string | null
        }
        Update: {
          city?: string
          created_at?: string | null
          date?: string
          description?: string
          featured?: boolean
          id?: string
          image_url?: string
          location?: string
          rsvp_instructions?: string | null
          short_description?: string
          tags?: string[]
          time?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      hotels: {
        Row: {
          address: string
          airport_distance_minutes: number | null
          atmosphere: string[] | null
          bar_scene: Database["public"]["Enums"]["bar_scene_enum"] | null
          bathroom_quality:
            | Database["public"]["Enums"]["bathroom_quality_enum"]
            | null
          best_known_for: string | null
          booking_partners: Json | null
          brand_group: string | null
          business_cluster_proximity: string[] | null
          check_in_time: string | null
          check_out_time: string | null
          checkin_flexibility_score: number | null
          concierge_quality: number | null
          coworking_space: boolean | null
          created_at: string | null
          creator_friendly: boolean | null
          data_freshness: string | null
          data_quality_notes: string | null
          design_style: string[] | null
          desk_in_room: boolean | null
          discretion_score: number | null
          family_suitability_score: number | null
          food_drink_quality:
            | Database["public"]["Enums"]["food_drink_quality_enum"]
            | null
          good_for_board_meetings: boolean | null
          good_for_couples: boolean | null
          good_for_families: boolean | null
          good_for_long_stays: boolean | null
          good_for_offsites: boolean | null
          good_for_solo_work: boolean | null
          guest_mix: string[] | null
          gym_quality: number | null
          id: string
          image_hero_url: string | null
          image_sources: Json | null
          image_url: string | null
          image_url_2: string | null
          instagram_handle: string | null
          instagram_worthy: boolean | null
          is_active: boolean | null
          is_experimental: boolean | null
          last_renovated_year: number | null
          lat: number
          late_checkout_friendliness: number | null
          lng: number
          loyalty_programs: string[] | null
          meeting_rooms: boolean | null
          name: string
          near_key_areas: string[] | null
          neighborhood: string
          noise_level: number | null
          notes_curated: string | null
          opening_year: number | null
          pet_friendly: boolean | null
          pier_benefits: string[] | null
          pier_booking_link: string | null
          pier_perk_level:
            | Database["public"]["Enums"]["pier_perk_level_enum"]
            | null
          pool_type: Database["public"]["Enums"]["pool_type_enum"] | null
          power_outlets:
            | Database["public"]["Enums"]["power_outlets_enum"]
            | null
          primary_city: Database["public"]["Enums"]["primary_city_enum"]
          problem_resolution:
            | Database["public"]["Enums"]["problem_resolution_enum"]
            | null
          profile_embedding: string | null
          quality_score_internal: number | null
          rate_high: number | null
          rate_low: number | null
          rate_mid: number | null
          room_count: number | null
          room_style: string[] | null
          scene_level: number | null
          service_style:
            | Database["public"]["Enums"]["service_style_enum"]
            | null
          spa_quality: number | null
          staff_kindness_score: number | null
          star_rating: number | null
          startup_friendly: boolean | null
          transit_access:
            | Database["public"]["Enums"]["transit_access_enum"]
            | null
          updated_at: string | null
          walkability_score_internal: number | null
          website_url: string | null
          wifi_quality: number | null
        }
        Insert: {
          address: string
          airport_distance_minutes?: number | null
          atmosphere?: string[] | null
          bar_scene?: Database["public"]["Enums"]["bar_scene_enum"] | null
          bathroom_quality?:
            | Database["public"]["Enums"]["bathroom_quality_enum"]
            | null
          best_known_for?: string | null
          booking_partners?: Json | null
          brand_group?: string | null
          business_cluster_proximity?: string[] | null
          check_in_time?: string | null
          check_out_time?: string | null
          checkin_flexibility_score?: number | null
          concierge_quality?: number | null
          coworking_space?: boolean | null
          created_at?: string | null
          creator_friendly?: boolean | null
          data_freshness?: string | null
          data_quality_notes?: string | null
          design_style?: string[] | null
          desk_in_room?: boolean | null
          discretion_score?: number | null
          family_suitability_score?: number | null
          food_drink_quality?:
            | Database["public"]["Enums"]["food_drink_quality_enum"]
            | null
          good_for_board_meetings?: boolean | null
          good_for_couples?: boolean | null
          good_for_families?: boolean | null
          good_for_long_stays?: boolean | null
          good_for_offsites?: boolean | null
          good_for_solo_work?: boolean | null
          guest_mix?: string[] | null
          gym_quality?: number | null
          id?: string
          image_hero_url?: string | null
          image_sources?: Json | null
          image_url?: string | null
          image_url_2?: string | null
          instagram_handle?: string | null
          instagram_worthy?: boolean | null
          is_active?: boolean | null
          is_experimental?: boolean | null
          last_renovated_year?: number | null
          lat: number
          late_checkout_friendliness?: number | null
          lng: number
          loyalty_programs?: string[] | null
          meeting_rooms?: boolean | null
          name: string
          near_key_areas?: string[] | null
          neighborhood: string
          noise_level?: number | null
          notes_curated?: string | null
          opening_year?: number | null
          pet_friendly?: boolean | null
          pier_benefits?: string[] | null
          pier_booking_link?: string | null
          pier_perk_level?:
            | Database["public"]["Enums"]["pier_perk_level_enum"]
            | null
          pool_type?: Database["public"]["Enums"]["pool_type_enum"] | null
          power_outlets?:
            | Database["public"]["Enums"]["power_outlets_enum"]
            | null
          primary_city: Database["public"]["Enums"]["primary_city_enum"]
          problem_resolution?:
            | Database["public"]["Enums"]["problem_resolution_enum"]
            | null
          profile_embedding?: string | null
          quality_score_internal?: number | null
          rate_high?: number | null
          rate_low?: number | null
          rate_mid?: number | null
          room_count?: number | null
          room_style?: string[] | null
          scene_level?: number | null
          service_style?:
            | Database["public"]["Enums"]["service_style_enum"]
            | null
          spa_quality?: number | null
          staff_kindness_score?: number | null
          star_rating?: number | null
          startup_friendly?: boolean | null
          transit_access?:
            | Database["public"]["Enums"]["transit_access_enum"]
            | null
          updated_at?: string | null
          walkability_score_internal?: number | null
          website_url?: string | null
          wifi_quality?: number | null
        }
        Update: {
          address?: string
          airport_distance_minutes?: number | null
          atmosphere?: string[] | null
          bar_scene?: Database["public"]["Enums"]["bar_scene_enum"] | null
          bathroom_quality?:
            | Database["public"]["Enums"]["bathroom_quality_enum"]
            | null
          best_known_for?: string | null
          booking_partners?: Json | null
          brand_group?: string | null
          business_cluster_proximity?: string[] | null
          check_in_time?: string | null
          check_out_time?: string | null
          checkin_flexibility_score?: number | null
          concierge_quality?: number | null
          coworking_space?: boolean | null
          created_at?: string | null
          creator_friendly?: boolean | null
          data_freshness?: string | null
          data_quality_notes?: string | null
          design_style?: string[] | null
          desk_in_room?: boolean | null
          discretion_score?: number | null
          family_suitability_score?: number | null
          food_drink_quality?:
            | Database["public"]["Enums"]["food_drink_quality_enum"]
            | null
          good_for_board_meetings?: boolean | null
          good_for_couples?: boolean | null
          good_for_families?: boolean | null
          good_for_long_stays?: boolean | null
          good_for_offsites?: boolean | null
          good_for_solo_work?: boolean | null
          guest_mix?: string[] | null
          gym_quality?: number | null
          id?: string
          image_hero_url?: string | null
          image_sources?: Json | null
          image_url?: string | null
          image_url_2?: string | null
          instagram_handle?: string | null
          instagram_worthy?: boolean | null
          is_active?: boolean | null
          is_experimental?: boolean | null
          last_renovated_year?: number | null
          lat?: number
          late_checkout_friendliness?: number | null
          lng?: number
          loyalty_programs?: string[] | null
          meeting_rooms?: boolean | null
          name?: string
          near_key_areas?: string[] | null
          neighborhood?: string
          noise_level?: number | null
          notes_curated?: string | null
          opening_year?: number | null
          pet_friendly?: boolean | null
          pier_benefits?: string[] | null
          pier_booking_link?: string | null
          pier_perk_level?:
            | Database["public"]["Enums"]["pier_perk_level_enum"]
            | null
          pool_type?: Database["public"]["Enums"]["pool_type_enum"] | null
          power_outlets?:
            | Database["public"]["Enums"]["power_outlets_enum"]
            | null
          primary_city?: Database["public"]["Enums"]["primary_city_enum"]
          problem_resolution?:
            | Database["public"]["Enums"]["problem_resolution_enum"]
            | null
          profile_embedding?: string | null
          quality_score_internal?: number | null
          rate_high?: number | null
          rate_low?: number | null
          rate_mid?: number | null
          room_count?: number | null
          room_style?: string[] | null
          scene_level?: number | null
          service_style?:
            | Database["public"]["Enums"]["service_style_enum"]
            | null
          spa_quality?: number | null
          staff_kindness_score?: number | null
          star_rating?: number | null
          startup_friendly?: boolean | null
          transit_access?:
            | Database["public"]["Enums"]["transit_access_enum"]
            | null
          updated_at?: string | null
          walkability_score_internal?: number | null
          website_url?: string | null
          wifi_quality?: number | null
        }
        Relationships: []
      }
      integrations: {
        Row: {
          access_token: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          metadata: Json | null
          provider: string
          refresh_token: string | null
          scopes: string[] | null
          sync_cursor: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          metadata?: Json | null
          provider: string
          refresh_token?: string | null
          scopes?: string[] | null
          sync_cursor?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          metadata?: Json | null
          provider?: string
          refresh_token?: string | null
          scopes?: string[] | null
          sync_cursor?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      members: {
        Row: {
          cards: Json | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          member_id: string
          membership_level: string
          onboarding_completed: boolean
          phone: string | null
          preferences: Json | null
          role: string
          stripe_customer_id: string | null
          subscription_status: string | null
          subscription_tier: string | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          cards?: Json | null
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          member_id: string
          membership_level?: string
          onboarding_completed?: boolean
          phone?: string | null
          preferences?: Json | null
          role?: string
          stripe_customer_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          cards?: Json | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          member_id?: string
          membership_level?: string
          onboarding_completed?: boolean
          phone?: string | null
          preferences?: Json | null
          role?: string
          stripe_customer_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      membership_changes: {
        Row: {
          created_at: string | null
          id: string
          new_level: string
          previous_level: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          new_level: string
          previous_level: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          new_level?: string
          previous_level?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membership_changes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string | null
          confidence: number | null
          conversation_id: string | null
          created_at: string | null
          direction: string | null
          front_message_id: string | null
          id: string
          intent: Database["public"]["Enums"]["intent_t"] | null
          processed: boolean | null
          processed_at: string | null
          raw: Json | null
          request_id: string | null
          sent_by: string | null
        }
        Insert: {
          body?: string | null
          confidence?: number | null
          conversation_id?: string | null
          created_at?: string | null
          direction?: string | null
          front_message_id?: string | null
          id?: string
          intent?: Database["public"]["Enums"]["intent_t"] | null
          processed?: boolean | null
          processed_at?: string | null
          raw?: Json | null
          request_id?: string | null
          sent_by?: string | null
        }
        Update: {
          body?: string | null
          confidence?: number | null
          conversation_id?: string | null
          created_at?: string | null
          direction?: string | null
          front_message_id?: string | null
          id?: string
          intent?: Database["public"]["Enums"]["intent_t"] | null
          processed?: boolean | null
          processed_at?: string | null
          raw?: Json | null
          request_id?: string | null
          sent_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          created_at: string | null
          id: string
          message: string
          notification_type: string | null
          read_at: string | null
          related_entity_id: string | null
          related_task_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string | null
          id?: string
          message: string
          notification_type?: string | null
          read_at?: string | null
          related_entity_id?: string | null
          related_task_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string | null
          id?: string
          message?: string
          notification_type?: string | null
          read_at?: string | null
          related_entity_id?: string | null
          related_task_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_entity_id_fkey"
            columns: ["related_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_task_id_fkey"
            columns: ["related_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          created_at: string | null
          currency: string | null
          hold_expires_at: string | null
          id: string
          price_cents: number | null
          rank: number | null
          request_id: string | null
          selected: boolean | null
          summary: string | null
          supplier_type: string | null
          terms: Json | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          hold_expires_at?: string | null
          id?: string
          price_cents?: number | null
          rank?: number | null
          request_id?: string | null
          selected?: boolean | null
          summary?: string | null
          supplier_type?: string | null
          terms?: Json | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          hold_expires_at?: string | null
          id?: string
          price_cents?: number | null
          rank?: number | null
          request_id?: string | null
          selected?: boolean | null
          summary?: string | null
          supplier_type?: string | null
          terms?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          approved_at: string | null
          confidence_score: number
          created_at: string
          description: string
          dismissed_reason: string | null
          expires_at: string | null
          id: string
          impact_score: number
          metadata: Json
          related_entity_id: string | null
          related_potential_trip_id: string | null
          related_task_id: string | null
          risk_score: number
          shown_at: string | null
          snoozed_until: string | null
          status: string
          tier: string
          title: string
          type: string
          updated_at: string
          urgency_score: number
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          confidence_score: number
          created_at?: string
          description: string
          dismissed_reason?: string | null
          expires_at?: string | null
          id?: string
          impact_score: number
          metadata?: Json
          related_entity_id?: string | null
          related_potential_trip_id?: string | null
          related_task_id?: string | null
          risk_score: number
          shown_at?: string | null
          snoozed_until?: string | null
          status?: string
          tier: string
          title: string
          type: string
          updated_at?: string
          urgency_score: number
          user_id: string
        }
        Update: {
          approved_at?: string | null
          confidence_score?: number
          created_at?: string
          description?: string
          dismissed_reason?: string | null
          expires_at?: string | null
          id?: string
          impact_score?: number
          metadata?: Json
          related_entity_id?: string | null
          related_potential_trip_id?: string | null
          related_task_id?: string | null
          risk_score?: number
          shown_at?: string | null
          snoozed_until?: string | null
          status?: string
          tier?: string
          title?: string
          type?: string
          updated_at?: string
          urgency_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_opportunities_entity"
            columns: ["related_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_opportunities_task"
            columns: ["related_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_opportunities_trip"
            columns: ["related_potential_trip_id"]
            isOneToOne: false
            referencedRelation: "potential_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      perks: {
        Row: {
          benefits: string[]
          category: string
          city: string
          created_at: string | null
          external_link: string | null
          featured: boolean
          id: string
          image_url: string
          minimum_level: string | null
          partner_description: string
          redemption_instructions: string | null
          reservation_integration: string | null
          short_description: string
          tags: string[]
          title: string
          updated_at: string | null
        }
        Insert: {
          benefits: string[]
          category: string
          city: string
          created_at?: string | null
          external_link?: string | null
          featured?: boolean
          id?: string
          image_url: string
          minimum_level?: string | null
          partner_description: string
          redemption_instructions?: string | null
          reservation_integration?: string | null
          short_description: string
          tags: string[]
          title: string
          updated_at?: string | null
        }
        Update: {
          benefits?: string[]
          category?: string
          city?: string
          created_at?: string | null
          external_link?: string | null
          featured?: boolean
          id?: string
          image_url?: string
          minimum_level?: string | null
          partner_description?: string
          redemption_instructions?: string | null
          reservation_integration?: string | null
          short_description?: string
          tags?: string[]
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      potential_trips: {
        Row: {
          confidence_score: number
          created_at: string
          destination: string
          destination_city: string | null
          destination_country: string | null
          detection_source: string
          end_date: string
          expires_at: string | null
          id: string
          metadata: Json
          related_entity_id: string | null
          related_trip_id: string | null
          source_email_id: string | null
          source_event_id: string | null
          start_date: string
          status: string
          trip_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score: number
          created_at?: string
          destination: string
          destination_city?: string | null
          destination_country?: string | null
          detection_source: string
          end_date: string
          expires_at?: string | null
          id?: string
          metadata?: Json
          related_entity_id?: string | null
          related_trip_id?: string | null
          source_email_id?: string | null
          source_event_id?: string | null
          start_date: string
          status?: string
          trip_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number
          created_at?: string
          destination?: string
          destination_city?: string | null
          destination_country?: string | null
          detection_source?: string
          end_date?: string
          expires_at?: string | null
          id?: string
          metadata?: Json
          related_entity_id?: string | null
          related_trip_id?: string | null
          source_email_id?: string | null
          source_event_id?: string | null
          start_date?: string
          status?: string
          trip_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_potential_trips_related_entity"
            columns: ["related_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_potential_trips_related_trip"
            columns: ["related_trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_potential_trips_source_email"
            columns: ["source_email_id"]
            isOneToOne: false
            referencedRelation: "emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_potential_trips_source_event"
            columns: ["source_event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          communication_preferences: Json | null
          concierge_preferences: Json
          created_at: string | null
          email: string | null
          event_preferences: Json
          front_user_hash: string | null
          full_name: string | null
          id: string
          intercom_user_id: string | null
          member_id: string | null
          metadata: Json | null
          onboarding_completed: boolean | null
          personal_context: Json | null
          phone: string | null
          phone_number: string | null
          profile_photo_url: string | null
          theme_preference: string | null
          time_zone: string | null
          timezone: string | null
          travel_preferences: Json | null
          updated_at: string | null
        }
        Insert: {
          communication_preferences?: Json | null
          concierge_preferences?: Json
          created_at?: string | null
          email?: string | null
          event_preferences?: Json
          front_user_hash?: string | null
          full_name?: string | null
          id?: string
          intercom_user_id?: string | null
          member_id?: string | null
          metadata?: Json | null
          onboarding_completed?: boolean | null
          personal_context?: Json | null
          phone?: string | null
          phone_number?: string | null
          profile_photo_url?: string | null
          theme_preference?: string | null
          time_zone?: string | null
          timezone?: string | null
          travel_preferences?: Json | null
          updated_at?: string | null
        }
        Update: {
          communication_preferences?: Json | null
          concierge_preferences?: Json
          created_at?: string | null
          email?: string | null
          event_preferences?: Json
          front_user_hash?: string | null
          full_name?: string | null
          id?: string
          intercom_user_id?: string | null
          member_id?: string | null
          metadata?: Json | null
          onboarding_completed?: boolean | null
          personal_context?: Json | null
          phone?: string | null
          phone_number?: string | null
          profile_photo_url?: string | null
          theme_preference?: string | null
          time_zone?: string | null
          timezone?: string | null
          travel_preferences?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recommendation_events: {
        Row: {
          asked_for_alternatives: boolean | null
          booking_completed: boolean | null
          candidates_after_filter: number | null
          candidates_shown: string[] | null
          chosen_hotel_id: string | null
          clarifying_questions_asked: string[] | null
          concierge_override: boolean | null
          created_at: string | null
          feedback_tags: string[] | null
          feedback_text: string | null
          final_booked_hotel_id: string | null
          fit_score: number | null
          id: string
          llm_reasoning: string | null
          override_hotel_id: string | null
          override_reason: string | null
          parsed_budget_range: unknown
          parsed_city: string | null
          parsed_constraints: Json | null
          parsed_dates: unknown
          parsed_party_size: number | null
          parsed_trip_type: string | null
          post_stay_rating: number | null
          proceeded_to_booking: boolean | null
          request_text: string
          scores_at_presentation: Json | null
          session_id: string | null
          time_to_selection_seconds: number | null
          user_id: string
          would_rebook: boolean | null
        }
        Insert: {
          asked_for_alternatives?: boolean | null
          booking_completed?: boolean | null
          candidates_after_filter?: number | null
          candidates_shown?: string[] | null
          chosen_hotel_id?: string | null
          clarifying_questions_asked?: string[] | null
          concierge_override?: boolean | null
          created_at?: string | null
          feedback_tags?: string[] | null
          feedback_text?: string | null
          final_booked_hotel_id?: string | null
          fit_score?: number | null
          id?: string
          llm_reasoning?: string | null
          override_hotel_id?: string | null
          override_reason?: string | null
          parsed_budget_range?: unknown
          parsed_city?: string | null
          parsed_constraints?: Json | null
          parsed_dates?: unknown
          parsed_party_size?: number | null
          parsed_trip_type?: string | null
          post_stay_rating?: number | null
          proceeded_to_booking?: boolean | null
          request_text: string
          scores_at_presentation?: Json | null
          session_id?: string | null
          time_to_selection_seconds?: number | null
          user_id: string
          would_rebook?: boolean | null
        }
        Update: {
          asked_for_alternatives?: boolean | null
          booking_completed?: boolean | null
          candidates_after_filter?: number | null
          candidates_shown?: string[] | null
          chosen_hotel_id?: string | null
          clarifying_questions_asked?: string[] | null
          concierge_override?: boolean | null
          created_at?: string | null
          feedback_tags?: string[] | null
          feedback_text?: string | null
          final_booked_hotel_id?: string | null
          fit_score?: number | null
          id?: string
          llm_reasoning?: string | null
          override_hotel_id?: string | null
          override_reason?: string | null
          parsed_budget_range?: unknown
          parsed_city?: string | null
          parsed_constraints?: Json | null
          parsed_dates?: unknown
          parsed_party_size?: number | null
          parsed_trip_type?: string | null
          post_stay_rating?: number | null
          proceeded_to_booking?: boolean | null
          request_text?: string
          scores_at_presentation?: Json | null
          session_id?: string | null
          time_to_selection_seconds?: number | null
          user_id?: string
          would_rebook?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_events_chosen_hotel_id_fkey"
            columns: ["chosen_hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_events_final_booked_hotel_id_fkey"
            columns: ["final_booked_hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_events_override_hotel_id_fkey"
            columns: ["override_hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      relationships: {
        Row: {
          created_at: string | null
          from_entity_id: string
          id: string
          metadata: Json | null
          relationship_type: string
          to_entity_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          from_entity_id: string
          id?: string
          metadata?: Json | null
          relationship_type: string
          to_entity_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          from_entity_id?: string
          id?: string
          metadata?: Json | null
          relationship_type?: string
          to_entity_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationships_from_entity_id_fkey"
            columns: ["from_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_to_entity_id_fkey"
            columns: ["to_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          confidence: number | null
          conversation_id: string | null
          created_at: string | null
          entities: Json | null
          front_conversation_id: string | null
          id: string
          intent: Database["public"]["Enums"]["intent_t"] | null
          mode: Database["public"]["Enums"]["mode_t"] | null
          profile_id: string | null
          raw_text: string | null
          results: Json | null
          sla_due_at: string | null
          status: string | null
          trip_id: string | null
          updated_at: string | null
        }
        Insert: {
          confidence?: number | null
          conversation_id?: string | null
          created_at?: string | null
          entities?: Json | null
          front_conversation_id?: string | null
          id?: string
          intent?: Database["public"]["Enums"]["intent_t"] | null
          mode?: Database["public"]["Enums"]["mode_t"] | null
          profile_id?: string | null
          raw_text?: string | null
          results?: Json | null
          sla_due_at?: string | null
          status?: string | null
          trip_id?: string | null
          updated_at?: string | null
        }
        Update: {
          confidence?: number | null
          conversation_id?: string | null
          created_at?: string | null
          entities?: Json | null
          front_conversation_id?: string | null
          id?: string
          intent?: Database["public"]["Enums"]["intent_t"] | null
          mode?: Database["public"]["Enums"]["mode_t"] | null
          profile_id?: string | null
          raw_text?: string | null
          results?: Json | null
          sla_due_at?: string | null
          status?: string | null
          trip_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requests_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "concierge_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "orphaned_profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "valid_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_agent: string | null
          completed_at: string | null
          confidence_score: number | null
          created_at: string | null
          decision_strategy: string | null
          description: string | null
          due_date: string | null
          escalation_reason: string | null
          id: string
          idempotency_key: string | null
          input_data: Json | null
          llm_reasoning: Json | null
          output_data: Json | null
          payload: Json | null
          priority: number | null
          request_id: string | null
          requires_human: boolean | null
          retries: number | null
          risk_level: string | null
          run_at: string | null
          started_at: string | null
          status: string | null
          task_type: string | null
          title: string | null
          type: string | null
          ui_state: Json | null
          user_id: string | null
        }
        Insert: {
          assigned_agent?: string | null
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string | null
          decision_strategy?: string | null
          description?: string | null
          due_date?: string | null
          escalation_reason?: string | null
          id?: string
          idempotency_key?: string | null
          input_data?: Json | null
          llm_reasoning?: Json | null
          output_data?: Json | null
          payload?: Json | null
          priority?: number | null
          request_id?: string | null
          requires_human?: boolean | null
          retries?: number | null
          risk_level?: string | null
          run_at?: string | null
          started_at?: string | null
          status?: string | null
          task_type?: string | null
          title?: string | null
          type?: string | null
          ui_state?: Json | null
          user_id?: string | null
        }
        Update: {
          assigned_agent?: string | null
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string | null
          decision_strategy?: string | null
          description?: string | null
          due_date?: string | null
          escalation_reason?: string | null
          id?: string
          idempotency_key?: string | null
          input_data?: Json | null
          llm_reasoning?: Json | null
          output_data?: Json | null
          payload?: Json | null
          priority?: number | null
          request_id?: string | null
          requires_human?: boolean | null
          retries?: number | null
          risk_level?: string | null
          run_at?: string | null
          started_at?: string | null
          status?: string | null
          task_type?: string | null
          title?: string | null
          type?: string | null
          ui_state?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_requests: {
        Row: {
          ambiance: string
          budget: string
          created_at: string | null
          description: string
          id: string
          status: string
          travel_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ambiance: string
          budget: string
          created_at?: string | null
          description: string
          id?: string
          status?: string
          travel_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ambiance?: string
          budget?: string
          created_at?: string | null
          description?: string
          id?: string
          status?: string
          travel_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "travel_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          name: string | null
          profile_id: string | null
          start_date: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          name?: string | null
          profile_id?: string | null
          start_date?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          name?: string | null
          profile_id?: string | null
          start_date?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "orphaned_profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "valid_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_context_history: {
        Row: {
          context_data: Json
          context_type: string
          conversation_id: string | null
          created_at: string | null
          id: string
          profile_id: string
        }
        Insert: {
          context_data?: Json
          context_type: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          profile_id: string
        }
        Update: {
          context_data?: Json
          context_type?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_context_history_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "concierge_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_context_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "orphaned_profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_context_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_context_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "valid_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_hotel_preferences: {
        Row: {
          accessibility_needs: string[] | null
          atmosphere_ranked: string[] | null
          company: string | null
          concierge_overrides: Json | null
          created_at: string | null
          deal_sensitivity: number | null
          design_style_ranked: string[] | null
          food_drink_priority: number | null
          gym_priority: number | null
          hard_budget_max: number | null
          hard_no: string[] | null
          home_city: string | null
          location_priority:
            | Database["public"]["Enums"]["location_priority_enum"]
            | null
          loyalty_programs: Json | null
          max_commute_tolerance: number | null
          must_have: string[] | null
          noise_tolerance: number | null
          pet_traveling: boolean | null
          pool_priority: number | null
          preferred_brands: string[] | null
          preferred_neighborhoods: Json | null
          price_bands_by_city: Json | null
          role: string | null
          scene_tolerance: number | null
          service_preference:
            | Database["public"]["Enums"]["service_preference_enum"]
            | null
          spa_priority: number | null
          stay_history: Json | null
          tag_weights: Json | null
          taste_profile_text: string | null
          taste_vector: string | null
          typical_timezones: string[] | null
          updated_at: string | null
          user_id: string
          wifi_priority: number | null
        }
        Insert: {
          accessibility_needs?: string[] | null
          atmosphere_ranked?: string[] | null
          company?: string | null
          concierge_overrides?: Json | null
          created_at?: string | null
          deal_sensitivity?: number | null
          design_style_ranked?: string[] | null
          food_drink_priority?: number | null
          gym_priority?: number | null
          hard_budget_max?: number | null
          hard_no?: string[] | null
          home_city?: string | null
          location_priority?:
            | Database["public"]["Enums"]["location_priority_enum"]
            | null
          loyalty_programs?: Json | null
          max_commute_tolerance?: number | null
          must_have?: string[] | null
          noise_tolerance?: number | null
          pet_traveling?: boolean | null
          pool_priority?: number | null
          preferred_brands?: string[] | null
          preferred_neighborhoods?: Json | null
          price_bands_by_city?: Json | null
          role?: string | null
          scene_tolerance?: number | null
          service_preference?:
            | Database["public"]["Enums"]["service_preference_enum"]
            | null
          spa_priority?: number | null
          stay_history?: Json | null
          tag_weights?: Json | null
          taste_profile_text?: string | null
          taste_vector?: string | null
          typical_timezones?: string[] | null
          updated_at?: string | null
          user_id: string
          wifi_priority?: number | null
        }
        Update: {
          accessibility_needs?: string[] | null
          atmosphere_ranked?: string[] | null
          company?: string | null
          concierge_overrides?: Json | null
          created_at?: string | null
          deal_sensitivity?: number | null
          design_style_ranked?: string[] | null
          food_drink_priority?: number | null
          gym_priority?: number | null
          hard_budget_max?: number | null
          hard_no?: string[] | null
          home_city?: string | null
          location_priority?:
            | Database["public"]["Enums"]["location_priority_enum"]
            | null
          loyalty_programs?: Json | null
          max_commute_tolerance?: number | null
          must_have?: string[] | null
          noise_tolerance?: number | null
          pet_traveling?: boolean | null
          pool_priority?: number | null
          preferred_brands?: string[] | null
          preferred_neighborhoods?: Json | null
          price_bands_by_city?: Json | null
          role?: string | null
          scene_tolerance?: number | null
          service_preference?:
            | Database["public"]["Enums"]["service_preference_enum"]
            | null
          spa_priority?: number | null
          stay_history?: Json | null
          tag_weights?: Json | null
          taste_profile_text?: string | null
          taste_vector?: string | null
          typical_timezones?: string[] | null
          updated_at?: string | null
          user_id?: string
          wifi_priority?: number | null
        }
        Relationships: []
      }
      user_patterns: {
        Row: {
          confidence_score: number
          created_at: string
          first_observed: string
          id: string
          last_observed: string
          observation_count: number
          pattern_data: Json
          pattern_strength: string | null
          pattern_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score: number
          created_at?: string
          first_observed?: string
          id?: string
          last_observed?: string
          observation_count?: number
          pattern_data?: Json
          pattern_strength?: string | null
          pattern_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number
          created_at?: string
          first_observed?: string
          id?: string
          last_observed?: string
          observation_count?: number
          pattern_data?: Json
          pattern_strength?: string | null
          pattern_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          budget_ranges: Json | null
          created_at: string | null
          id: string
          loyalty_programs: Json | null
          payment_preferences: Json | null
          profile_id: string
          special_requirements: Json | null
          travel_preferences: Json | null
          updated_at: string | null
        }
        Insert: {
          budget_ranges?: Json | null
          created_at?: string | null
          id?: string
          loyalty_programs?: Json | null
          payment_preferences?: Json | null
          profile_id: string
          special_requirements?: Json | null
          travel_preferences?: Json | null
          updated_at?: string | null
        }
        Update: {
          budget_ranges?: Json | null
          created_at?: string | null
          id?: string
          loyalty_programs?: Json | null
          payment_preferences?: Json | null
          profile_id?: string
          special_requirements?: Json | null
          travel_preferences?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "orphaned_profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "valid_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      orphaned_profiles_view: {
        Row: {
          channel_count: number | null
          conversation_count: number | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          status: string | null
        }
        Insert: {
          channel_count?: never
          conversation_count?: never
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          status?: never
        }
        Update: {
          channel_count?: never
          conversation_count?: never
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          status?: never
        }
        Relationships: []
      }
      valid_profiles: {
        Row: {
          communication_preferences: Json | null
          first_name: string | null
          front_user_hash: string | null
          full_name: string | null
          id: string | null
          last_name: string | null
          member_email: string | null
          member_id: string | null
          member_role: string | null
          membership_level: string | null
          metadata: Json | null
          onboarding_completed: boolean | null
          personal_context: Json | null
          phone_number: string | null
          profile_created_at: string | null
          profile_email: string | null
          profile_photo_url: string | null
          profile_type: string | null
          profile_updated_at: string | null
          theme_preference: string | null
          time_zone: string | null
          travel_preferences: Json | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_opportunity_tier: {
        Args: { confidence: number; risk: number; urgency: number }
        Returns: string
      }
      delete_old_conversations: { Args: never; Returns: undefined }
      expire_old_opportunities: { Args: never; Returns: number }
      generate_task_idempotency_key: {
        Args: { p_message: string; p_user_id: string }
        Returns: string
      }
      get_task_with_ui_state: {
        Args: { p_task_id: string }
        Returns: {
          confidence_score: number
          created_at: string
          decision_strategy: string
          description: string
          id: string
          risk_level: string
          status: string
          task_type: string
          title: string
          ui_state: Json
          updated_at: string
          user_id: string
        }[]
      }
      get_user_profile_context: {
        Args: { p_user_id: string }
        Returns: {
          communication_preferences: Json
          created_at: string
          email: string
          full_name: string
          onboarding_completed: boolean
          personal_context: Json
          phone_number: string
          profile_id: string
          time_zone: string
          travel_preferences: Json
          updated_at: string
        }[]
      }
      should_profile_exist: { Args: { profile_id: string }; Returns: boolean }
      update_my_capital_member_profile: {
        Args: {
          p_aum_display?: string
          p_aum_numeric?: number
          p_bio?: string
          p_check_size_display?: string
          p_check_size_max?: number
          p_check_size_min?: number
          p_currency_code?: string
          p_display_name?: string
          p_firm?: string
          p_focus_sectors?: string[]
          p_investment_thesis?: string
          p_location?: string
          p_role?: string
          p_title?: string
        }
        Returns: {
          aum_display: string | null
          aum_numeric: number | null
          avatar_url: string | null
          bio: string | null
          check_size_display: string | null
          check_size_max: number | null
          check_size_min: number | null
          created_at: string
          currency_code: string
          display_name: string
          firm: string
          focus_sectors: string[]
          id: string
          investment_thesis: string | null
          location: string | null
          member_id: string | null
          published_at: string | null
          role: string
          slug: string
          sort_order: number
          status: string
          title: string | null
          updated_at: string
          verified: boolean
        }
        SetofOptions: {
          from: "*"
          to: "capital_member_profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      bar_scene_enum: "quiet cocktails" | "lobby hang" | "clubby" | "none"
      bathroom_quality_enum:
        | "standard"
        | "luxury"
        | "rain showers"
        | "soaking tubs"
      food_drink_quality_enum:
        | "destination restaurant"
        | "solid"
        | "meh"
        | "none"
      intent_t:
        | "flight"
        | "hotel"
        | "dining"
        | "experience"
        | "cancel"
        | "other"
      location_priority_enum: "walkability" | "transit" | "quiet"
      mode_t: "auto" | "assisted" | "human"
      pier_perk_level_enum: "none" | "preferred" | "VIP partner"
      pool_type_enum: "rooftop" | "indoor" | "outdoor" | "none"
      power_outlets_enum: "abundant" | "adequate" | "scarce"
      primary_city_enum: "NYC" | "LA" | "Miami" | "SF" | "London" | "Austin"
      problem_resolution_enum: "excellent" | "good" | "poor"
      service_preference_enum: "high-touch" | "balanced" | "leave-me-alone"
      service_style_enum:
        | "ultra-attentive"
        | "discreet"
        | "chill"
        | "inconsistent"
      transit_access_enum: "excellent" | "good" | "poor"
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
      bar_scene_enum: ["quiet cocktails", "lobby hang", "clubby", "none"],
      bathroom_quality_enum: [
        "standard",
        "luxury",
        "rain showers",
        "soaking tubs",
      ],
      food_drink_quality_enum: [
        "destination restaurant",
        "solid",
        "meh",
        "none",
      ],
      intent_t: ["flight", "hotel", "dining", "experience", "cancel", "other"],
      location_priority_enum: ["walkability", "transit", "quiet"],
      mode_t: ["auto", "assisted", "human"],
      pier_perk_level_enum: ["none", "preferred", "VIP partner"],
      pool_type_enum: ["rooftop", "indoor", "outdoor", "none"],
      power_outlets_enum: ["abundant", "adequate", "scarce"],
      primary_city_enum: ["NYC", "LA", "Miami", "SF", "London", "Austin"],
      problem_resolution_enum: ["excellent", "good", "poor"],
      service_preference_enum: ["high-touch", "balanced", "leave-me-alone"],
      service_style_enum: [
        "ultra-attentive",
        "discreet",
        "chill",
        "inconsistent",
      ],
      transit_access_enum: ["excellent", "good", "poor"],
    },
  },
} as const
