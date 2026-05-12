/*
  # Remote public schema baseline

  Squashed local baseline reconstructed from the linked Supabase project schema.
  The remote project already marks version 20250518192643 as applied, so this
  file is for local replay only and must not be pushed as a new remote change.
*/

CREATE SCHEMA IF NOT EXISTS "public";
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA "public";



SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."bar_scene_enum" AS ENUM (
    'quiet cocktails',
    'lobby hang',
    'clubby',
    'none'
);


ALTER TYPE "public"."bar_scene_enum" OWNER TO "postgres";


CREATE TYPE "public"."bathroom_quality_enum" AS ENUM (
    'standard',
    'luxury',
    'rain showers',
    'soaking tubs'
);


ALTER TYPE "public"."bathroom_quality_enum" OWNER TO "postgres";


CREATE TYPE "public"."food_drink_quality_enum" AS ENUM (
    'destination restaurant',
    'solid',
    'meh',
    'none'
);


ALTER TYPE "public"."food_drink_quality_enum" OWNER TO "postgres";


CREATE TYPE "public"."intent_t" AS ENUM (
    'flight',
    'hotel',
    'dining',
    'experience',
    'cancel',
    'other'
);


ALTER TYPE "public"."intent_t" OWNER TO "postgres";


CREATE TYPE "public"."location_priority_enum" AS ENUM (
    'walkability',
    'transit',
    'quiet'
);


ALTER TYPE "public"."location_priority_enum" OWNER TO "postgres";


CREATE TYPE "public"."mode_t" AS ENUM (
    'auto',
    'assisted',
    'human'
);


ALTER TYPE "public"."mode_t" OWNER TO "postgres";


CREATE TYPE "public"."pier_perk_level_enum" AS ENUM (
    'none',
    'preferred',
    'VIP partner'
);


ALTER TYPE "public"."pier_perk_level_enum" OWNER TO "postgres";


CREATE TYPE "public"."pool_type_enum" AS ENUM (
    'rooftop',
    'indoor',
    'outdoor',
    'none'
);


ALTER TYPE "public"."pool_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."power_outlets_enum" AS ENUM (
    'abundant',
    'adequate',
    'scarce'
);


ALTER TYPE "public"."power_outlets_enum" OWNER TO "postgres";


CREATE TYPE "public"."primary_city_enum" AS ENUM (
    'NYC',
    'LA',
    'Miami',
    'SF',
    'London',
    'Austin'
);


ALTER TYPE "public"."primary_city_enum" OWNER TO "postgres";


CREATE TYPE "public"."problem_resolution_enum" AS ENUM (
    'excellent',
    'good',
    'poor'
);


ALTER TYPE "public"."problem_resolution_enum" OWNER TO "postgres";


CREATE TYPE "public"."service_preference_enum" AS ENUM (
    'high-touch',
    'balanced',
    'leave-me-alone'
);


ALTER TYPE "public"."service_preference_enum" OWNER TO "postgres";


CREATE TYPE "public"."service_style_enum" AS ENUM (
    'ultra-attentive',
    'discreet',
    'chill',
    'inconsistent'
);


ALTER TYPE "public"."service_style_enum" OWNER TO "postgres";


CREATE TYPE "public"."transit_access_enum" AS ENUM (
    'excellent',
    'good',
    'poor'
);


ALTER TYPE "public"."transit_access_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_opportunity_tier"("confidence" integer, "urgency" integer, "risk" integer) RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  -- "Prepared for you": high confidence, high urgency, low risk
  IF confidence > 90 AND urgency > 70 AND risk < 30 THEN
    RETURN 'prepared';
  END IF;
  
  -- "Action needed": medium-high confidence, requires action
  IF confidence > 60 AND urgency > 50 THEN
    RETURN 'action_needed';
  END IF;
  
  -- "Opportunity": everything else
  RETURN 'opportunity';
END;
$$;


ALTER FUNCTION "public"."calculate_opportunity_tier"("confidence" integer, "urgency" integer, "risk" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_opportunity_tier"("confidence" integer, "urgency" integer, "risk" integer) IS 'Calculates the appropriate tier for an opportunity based on its scores';



CREATE OR REPLACE FUNCTION "public"."delete_old_conversations"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
DELETE FROM concierge_conversations
WHERE last_message_at < NOW() - INTERVAL '30 days';
END;
$$;


ALTER FUNCTION "public"."delete_old_conversations"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_old_opportunities"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.opportunities
  SET status = 'expired',
      updated_at = NOW()
  WHERE status IN ('pending', 'shown', 'snoozed')
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$;


ALTER FUNCTION "public"."expire_old_opportunities"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."expire_old_opportunities"() IS 'Marks opportunities as expired when they pass their expiration date';



CREATE OR REPLACE FUNCTION "public"."generate_task_idempotency_key"("p_user_id" "uuid", "p_message" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  -- Generate deterministic key from user_id + normalized message
  RETURN encode(digest(p_user_id::text || lower(trim(p_message)), 'sha256'), 'hex');
END;
$$;


ALTER FUNCTION "public"."generate_task_idempotency_key"("p_user_id" "uuid", "p_message" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_task_with_ui_state"("p_task_id" "uuid") RETURNS TABLE("id" "uuid", "user_id" "uuid", "title" "text", "description" "text", "task_type" "text", "status" "text", "ui_state" "jsonb", "confidence_score" numeric, "risk_level" "text", "decision_strategy" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.user_id,
    t.title,
    t.description,
    t.task_type,
    t.status,
    t.ui_state,
    t.confidence_score,
    t.risk_level,
    t.decision_strategy,
    t.created_at,
    t.updated_at
  FROM tasks t
  WHERE t.id = p_task_id;
END;
$$;


ALTER FUNCTION "public"."get_task_with_ui_state"("p_task_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_profile_context"("p_user_id" "uuid") RETURNS TABLE("profile_id" "uuid", "full_name" "text", "email" "text", "phone_number" "text", "time_zone" "text", "travel_preferences" "jsonb", "personal_context" "jsonb", "communication_preferences" "jsonb", "onboarding_completed" boolean, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.phone_number,
    p.time_zone,
    p.travel_preferences,
    p.personal_context,
    p.communication_preferences,
    p.onboarding_completed,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE p.id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."get_user_profile_context"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."should_profile_exist"("profile_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Profile is valid if:
  -- 1. It exists in members table (actual member)
  -- 2. It exists in auth.users (authenticated user, might not be member yet)
  -- 3. It's referenced in conversations (email parsing context)
  RETURN EXISTS (
    SELECT 1 FROM members WHERE members.id = should_profile_exist.profile_id
  ) OR EXISTS (
    SELECT 1 FROM auth.users WHERE auth.users.id = should_profile_exist.profile_id
  ) OR EXISTS (
    SELECT 1 FROM conversations WHERE conversations.profile_id = should_profile_exist.profile_id
  );
END;
$$;


ALTER FUNCTION "public"."should_profile_exist"("profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_conversation_last_message"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
UPDATE concierge_conversations
SET 
last_message_at = NEW.created_at,
updated_at = NEW.created_at
WHERE id = NEW.conversation_id;
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_conversation_last_message"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_opportunities_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_opportunities_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_potential_trips_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_potential_trips_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_patterns_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_patterns_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_profile_owner"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if the profile id exists in members table
  IF NOT EXISTS (SELECT 1 FROM members WHERE id = NEW.id) THEN
    -- If not in members, check if it exists in auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.id) THEN
      -- Log a warning but don't block (allows email parsing profiles)
      -- In production, you might want to make this an error instead
      RAISE WARNING 'Profile id % does not correspond to a member or auth user. Email: %, Name: %', 
        NEW.id, NEW.email, NEW.full_name;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_profile_owner"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid",
    "conversation_id" "uuid",
    "action_type" "text" NOT NULL,
    "actor" "text" DEFAULT 'system'::"text",
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "activities_actor_check" CHECK (("actor" = ANY (ARRAY['system'::"text", 'agent'::"text", 'customer'::"text", 'assistant'::"text"])))
);


ALTER TABLE "public"."activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_credentials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" "text" NOT NULL,
    "api_key" "text" NOT NULL,
    "api_secret" "text",
    "base_url" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "rate_limit_per_minute" integer DEFAULT 60,
    "priority" smallint DEFAULT 100,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."api_credentials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."automations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "automation_type" "text" NOT NULL,
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "last_run_at" timestamp with time zone,
    "next_run_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."automations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."calendar_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "gcal_event_id" "text" NOT NULL,
    "gcal_calendar_id" "text" NOT NULL,
    "title" "text",
    "description" "text",
    "location" "text",
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "all_day" boolean DEFAULT false,
    "time_zone" "text",
    "status" "text" DEFAULT 'confirmed'::"text",
    "related_trip_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."calendar_events" OWNER TO "postgres";


COMMENT ON COLUMN "public"."calendar_events"."metadata" IS 'Flexible storage for event metadata including attendees';



CREATE TABLE IF NOT EXISTS "public"."channels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text",
    "external_contact_id" "text",
    "profile_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "channels_type_check" CHECK (("type" = ANY (ARRAY['email'::"text", 'whatsapp'::"text", 'sms'::"text", 'front'::"text", 'portal'::"text"])))
);


ALTER TABLE "public"."channels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."concierge_conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" DEFAULT 'New Conversation'::"text" NOT NULL,
    "last_message_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_archived" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."concierge_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."concierge_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "concierge_messages_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text"])))
);


ALTER TABLE "public"."concierge_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "channel_id" "uuid",
    "front_conversation_id" "text",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "last_message_at" timestamp with time zone DEFAULT "now"(),
    "front_inbox_id" "text",
    "profile_id" "uuid",
    "role" "text",
    "content" "text",
    "related_task_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_briefs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "brief_date" "date" NOT NULL,
    "content" "text" NOT NULL,
    "opportunities_count" integer DEFAULT 0 NOT NULL,
    "action_needed_count" integer DEFAULT 0 NOT NULL,
    "prepared_count" integer DEFAULT 0 NOT NULL,
    "opportunity_ids" "uuid"[] DEFAULT ARRAY[]::"uuid"[],
    "generation_method" "text" DEFAULT 'gpt4'::"text",
    "generation_time_ms" integer,
    "generated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "read_at" timestamp with time zone,
    "dismissed_at" timestamp with time zone,
    "notification_sent" boolean DEFAULT false NOT NULL,
    "notification_sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."daily_briefs" OWNER TO "postgres";


COMMENT ON TABLE "public"."daily_briefs" IS 'Stores daily AI-generated summaries of opportunities and actions for users';



CREATE TABLE IF NOT EXISTS "public"."email_context" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email_id" "uuid" NOT NULL,
    "gmail_message_id" "text",
    "confirmation_type" "text" NOT NULL,
    "confirmation_code" "text",
    "parsed_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "extraction_confidence" integer,
    "extraction_method" "text" DEFAULT 'gpt4'::"text",
    "extraction_errors" "text"[],
    "processed" boolean DEFAULT false NOT NULL,
    "related_potential_trip_id" "uuid",
    "parsed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "email_context_confirmation_type_check" CHECK (("confirmation_type" = ANY (ARRAY['flight'::"text", 'hotel'::"text", 'car'::"text", 'event'::"text", 'restaurant'::"text", 'other'::"text"]))),
    CONSTRAINT "email_context_extraction_confidence_check" CHECK ((("extraction_confidence" >= 0) AND ("extraction_confidence" <= 100)))
);


ALTER TABLE "public"."email_context" OWNER TO "postgres";


COMMENT ON TABLE "public"."email_context" IS 'Stores parsed travel confirmation data extracted from emails';



CREATE TABLE IF NOT EXISTS "public"."emails" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "gmail_message_id" "text" NOT NULL,
    "gmail_thread_id" "text",
    "subject" "text",
    "from_address" "text",
    "received_at" timestamp with time zone NOT NULL,
    "body_preview" "text",
    "category" "text",
    "extracted_data" "jsonb" DEFAULT '{}'::"jsonb",
    "processed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."emails" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."entities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "entity_type" "text" NOT NULL,
    "data" "jsonb" NOT NULL,
    "source" "text",
    "source_id" "text",
    "confidence" double precision DEFAULT 1.0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."entities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "short_description" "text" NOT NULL,
    "description" "text" NOT NULL,
    "image_url" "text" NOT NULL,
    "date" "date" NOT NULL,
    "time" "text" NOT NULL,
    "location" "text" NOT NULL,
    "city" "text" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "featured" boolean DEFAULT false NOT NULL,
    "rsvp_instructions" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hotels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "brand_group" "text",
    "address" "text" NOT NULL,
    "lat" numeric(10,8) NOT NULL,
    "lng" numeric(11,8) NOT NULL,
    "neighborhood" "text" NOT NULL,
    "primary_city" "public"."primary_city_enum" NOT NULL,
    "website_url" "text",
    "pier_booking_link" "text",
    "booking_partners" "jsonb" DEFAULT '[]'::"jsonb",
    "star_rating" numeric(2,1),
    "room_count" integer,
    "opening_year" integer,
    "last_renovated_year" integer,
    "rate_low" integer,
    "rate_mid" integer,
    "rate_high" integer,
    "check_in_time" time without time zone,
    "check_out_time" time without time zone,
    "loyalty_programs" "text"[] DEFAULT '{}'::"text"[],
    "business_cluster_proximity" "text"[] DEFAULT '{}'::"text"[],
    "walkability_score_internal" integer,
    "transit_access" "public"."transit_access_enum",
    "airport_distance_minutes" integer,
    "near_key_areas" "text"[] DEFAULT '{}'::"text"[],
    "design_style" "text"[] DEFAULT '{}'::"text"[],
    "room_style" "text"[] DEFAULT '{}'::"text"[],
    "bathroom_quality" "public"."bathroom_quality_enum",
    "instagram_worthy" boolean DEFAULT false,
    "atmosphere" "text"[] DEFAULT '{}'::"text"[],
    "guest_mix" "text"[] DEFAULT '{}'::"text"[],
    "noise_level" integer,
    "scene_level" integer,
    "service_style" "public"."service_style_enum",
    "staff_kindness_score" integer,
    "checkin_flexibility_score" integer,
    "late_checkout_friendliness" integer,
    "discretion_score" integer,
    "concierge_quality" integer,
    "problem_resolution" "public"."problem_resolution_enum",
    "gym_quality" integer,
    "spa_quality" integer,
    "pool_type" "public"."pool_type_enum",
    "food_drink_quality" "public"."food_drink_quality_enum",
    "bar_scene" "public"."bar_scene_enum",
    "coworking_space" boolean DEFAULT false,
    "meeting_rooms" boolean DEFAULT false,
    "pet_friendly" boolean DEFAULT false,
    "wifi_quality" integer,
    "desk_in_room" boolean DEFAULT false,
    "power_outlets" "public"."power_outlets_enum",
    "creator_friendly" boolean DEFAULT false,
    "startup_friendly" boolean DEFAULT false,
    "good_for_solo_work" boolean DEFAULT false,
    "good_for_couples" boolean DEFAULT false,
    "good_for_families" boolean DEFAULT false,
    "good_for_long_stays" boolean DEFAULT false,
    "good_for_offsites" boolean DEFAULT false,
    "good_for_board_meetings" boolean DEFAULT false,
    "pier_perk_level" "public"."pier_perk_level_enum" DEFAULT 'none'::"public"."pier_perk_level_enum",
    "pier_benefits" "text"[] DEFAULT '{}'::"text"[],
    "quality_score_internal" integer,
    "data_freshness" timestamp with time zone DEFAULT "now"(),
    "notes_curated" "text",
    "profile_embedding" "public"."vector"(1536),
    "is_active" boolean DEFAULT true,
    "is_experimental" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "family_suitability_score" integer,
    "best_known_for" "text",
    "image_sources" "jsonb",
    "instagram_handle" "text",
    "data_quality_notes" "text",
    "image_hero_url" "text",
    "image_url" "text",
    "image_url_2" "text",
    CONSTRAINT "hotels_checkin_flexibility_score_check" CHECK ((("checkin_flexibility_score" >= 1) AND ("checkin_flexibility_score" <= 5))),
    CONSTRAINT "hotels_concierge_quality_check" CHECK ((("concierge_quality" >= 0) AND ("concierge_quality" <= 3))),
    CONSTRAINT "hotels_discretion_score_check" CHECK ((("discretion_score" >= 1) AND ("discretion_score" <= 5))),
    CONSTRAINT "hotels_gym_quality_check" CHECK ((("gym_quality" >= 0) AND ("gym_quality" <= 3))),
    CONSTRAINT "hotels_late_checkout_friendliness_check" CHECK ((("late_checkout_friendliness" >= 1) AND ("late_checkout_friendliness" <= 5))),
    CONSTRAINT "hotels_noise_level_check" CHECK ((("noise_level" >= 1) AND ("noise_level" <= 5))),
    CONSTRAINT "hotels_quality_score_internal_check" CHECK ((("quality_score_internal" >= 1) AND ("quality_score_internal" <= 100))),
    CONSTRAINT "hotels_scene_level_check" CHECK ((("scene_level" >= 1) AND ("scene_level" <= 5))),
    CONSTRAINT "hotels_spa_quality_check" CHECK ((("spa_quality" >= 0) AND ("spa_quality" <= 3))),
    CONSTRAINT "hotels_staff_kindness_score_check" CHECK ((("staff_kindness_score" >= 1) AND ("staff_kindness_score" <= 10))),
    CONSTRAINT "hotels_walkability_score_internal_check" CHECK ((("walkability_score_internal" >= 1) AND ("walkability_score_internal" <= 5))),
    CONSTRAINT "hotels_wifi_quality_check" CHECK ((("wifi_quality" >= 1) AND ("wifi_quality" <= 5)))
);


ALTER TABLE "public"."hotels" OWNER TO "postgres";


COMMENT ON TABLE "public"."hotels" IS 'Curated inventory of hotels for AI recommendations. 25-50 properties per geo.';



COMMENT ON COLUMN "public"."hotels"."quality_score_internal" IS 'Overall quality rating 1-100, used for ranking';



COMMENT ON COLUMN "public"."hotels"."data_freshness" IS 'Last time hotel data was scraped/verified';



COMMENT ON COLUMN "public"."hotels"."profile_embedding" IS 'Vector embedding for semantic similarity matching (OpenAI ada-002, 1536 dimensions)';



COMMENT ON COLUMN "public"."hotels"."image_url_2" IS 'Second image of hotel properties';



CREATE TABLE IF NOT EXISTS "public"."integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "access_token" "text",
    "refresh_token" "text",
    "expires_at" timestamp with time zone,
    "scopes" "text"[],
    "is_active" boolean DEFAULT true,
    "last_sync_at" timestamp with time zone,
    "sync_cursor" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."integrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."members" (
    "id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "member_id" "text" NOT NULL,
    "preferences" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "membership_level" "text" DEFAULT 'Standard'::"text" NOT NULL,
    "stripe_customer_id" "text",
    "subscription_status" "text" DEFAULT 'trialing'::"text",
    "trial_ends_at" timestamp with time zone,
    "cards" "jsonb" DEFAULT '[]'::"jsonb",
    "subscription_tier" "text" DEFAULT 'pro'::"text",
    "onboarding_completed" boolean DEFAULT false NOT NULL,
    CONSTRAINT "valid_membership_level" CHECK (("membership_level" = ANY (ARRAY['Standard'::"text", 'Premium'::"text", 'Executive'::"text", 'Founding Member'::"text"])))
);


ALTER TABLE "public"."members" OWNER TO "postgres";


COMMENT ON COLUMN "public"."members"."onboarding_completed" IS 'Whether the member has completed the onboarding flow. Denormalized from profiles for reliable auth routing.';



CREATE TABLE IF NOT EXISTS "public"."membership_changes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "previous_level" "text" NOT NULL,
    "new_level" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_new_level" CHECK (("new_level" = ANY (ARRAY['Standard'::"text", 'Premium'::"text", 'Executive'::"text", 'Founding Member'::"text"]))),
    CONSTRAINT "valid_previous_level" CHECK (("previous_level" = ANY (ARRAY['Standard'::"text", 'Premium'::"text", 'Executive'::"text", 'Founding Member'::"text"])))
);


ALTER TABLE "public"."membership_changes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid",
    "direction" "text",
    "sent_by" "text",
    "body" "text",
    "raw" "jsonb",
    "front_message_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "intent" "public"."intent_t",
    "confidence" numeric,
    "request_id" "uuid",
    "processed" boolean DEFAULT false,
    "processed_at" timestamp with time zone,
    CONSTRAINT "messages_direction_check" CHECK (("direction" = ANY (ARRAY['in'::"text", 'out'::"text"]))),
    CONSTRAINT "messages_sent_by_check" CHECK (("sent_by" = ANY (ARRAY['user'::"text", 'paige'::"text", 'agent'::"text", 'assistant'::"text"])))
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "notification_type" "text" DEFAULT 'info'::"text",
    "action_url" "text",
    "action_label" "text",
    "related_entity_id" "uuid",
    "related_task_id" "uuid",
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."offers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid",
    "supplier_type" "text",
    "summary" "text",
    "terms" "jsonb",
    "price_cents" integer,
    "currency" "text",
    "hold_expires_at" timestamp with time zone,
    "rank" smallint,
    "selected" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "offers_supplier_type_check" CHECK (("supplier_type" = ANY (ARRAY['air'::"text", 'hotel'::"text", 'dining'::"text", 'experience'::"text", 'car'::"text"])))
);


ALTER TABLE "public"."offers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."opportunities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "confidence_score" integer NOT NULL,
    "urgency_score" integer NOT NULL,
    "impact_score" integer NOT NULL,
    "risk_score" integer NOT NULL,
    "tier" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "related_potential_trip_id" "uuid",
    "related_task_id" "uuid",
    "related_entity_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "dismissed_reason" "text",
    "snoozed_until" timestamp with time zone,
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    "shown_at" timestamp with time zone,
    CONSTRAINT "opportunities_confidence_score_check" CHECK ((("confidence_score" >= 0) AND ("confidence_score" <= 100))),
    CONSTRAINT "opportunities_impact_score_check" CHECK ((("impact_score" >= 0) AND ("impact_score" <= 100))),
    CONSTRAINT "opportunities_risk_score_check" CHECK ((("risk_score" >= 0) AND ("risk_score" <= 100))),
    CONSTRAINT "opportunities_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'shown'::"text", 'approved'::"text", 'dismissed'::"text", 'snoozed'::"text", 'expired'::"text", 'completed'::"text"]))),
    CONSTRAINT "opportunities_tier_check" CHECK (("tier" = ANY (ARRAY['action_needed'::"text", 'prepared'::"text", 'opportunity'::"text"]))),
    CONSTRAINT "opportunities_type_check" CHECK (("type" = ANY (ARRAY['trip_gap'::"text", 'price_drop'::"text", 'preparation'::"text", 'upgrade'::"text", 'expiring_benefit'::"text", 'optimization'::"text", 'reminder'::"text", 'other'::"text"]))),
    CONSTRAINT "opportunities_urgency_score_check" CHECK ((("urgency_score" >= 0) AND ("urgency_score" <= 100)))
);


ALTER TABLE "public"."opportunities" OWNER TO "postgres";


COMMENT ON TABLE "public"."opportunities" IS 'Stores proactive suggestions generated for users based on detected context';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_name" "text",
    "email" "text",
    "phone" "text",
    "timezone" "text" DEFAULT 'America/New_York'::"text",
    "member_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "front_user_hash" "text",
    "time_zone" "text" DEFAULT 'America/New_York'::"text",
    "travel_preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "onboarding_completed" boolean DEFAULT false,
    "phone_number" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "personal_context" "jsonb" DEFAULT '{}'::"jsonb",
    "communication_preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "profile_photo_url" "text",
    "theme_preference" "text" DEFAULT 'light'::"text",
    "intercom_user_id" "text",
    CONSTRAINT "profiles_theme_preference_check" CHECK (("theme_preference" = ANY (ARRAY['light'::"text", 'dark'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'User profiles. Should primarily be linked to members table via id. Can also exist for email parsing context.';



COMMENT ON COLUMN "public"."profiles"."travel_preferences" IS 'JSONB structure: {preferred_airlines: [], seat_preference: string, cabin_preference: string, tsa_precheck: string, known_traveler_number: string, meal_preferences: [], special_assistance: [], frequent_destinations: [], booking_preferences: {}}';



COMMENT ON COLUMN "public"."profiles"."personal_context" IS 'JSONB for storing learned preferences, habits, frequent patterns, and other context that helps agents understand the user better';



COMMENT ON COLUMN "public"."profiles"."communication_preferences" IS 'JSONB for notification preferences, communication style, preferred channels, etc.';



COMMENT ON COLUMN "public"."profiles"."metadata" IS 'Flexible storage for additional profile metadata';



COMMENT ON COLUMN "public"."profiles"."profile_photo_url" IS 'URL to user profile photo (stored in Supabase Storage or external)';



COMMENT ON COLUMN "public"."profiles"."theme_preference" IS 'User theme preference: light or dark. Defaults to light for new users.';



COMMENT ON COLUMN "public"."profiles"."intercom_user_id" IS 'Intercom contact ID for this user, used to link Supabase users to Intercom conversations';



CREATE OR REPLACE VIEW "public"."orphaned_profiles_view" AS
 SELECT "p"."id",
    "p"."email",
    "p"."full_name",
    "p"."created_at",
        CASE
            WHEN (EXISTS ( SELECT 1
               FROM "public"."members" "m"
              WHERE ("m"."id" = "p"."id"))) THEN 'member'::"text"
            WHEN (EXISTS ( SELECT 1
               FROM "auth"."users" "u"
              WHERE ("u"."id" = "p"."id"))) THEN 'auth_user_only'::"text"
            WHEN (EXISTS ( SELECT 1
               FROM "public"."conversations" "c"
              WHERE ("c"."profile_id" = "p"."id"))) THEN 'referenced'::"text"
            ELSE 'orphaned'::"text"
        END AS "status",
    ( SELECT "count"(*) AS "count"
           FROM "public"."conversations"
          WHERE ("conversations"."profile_id" = "p"."id")) AS "conversation_count",
    ( SELECT "count"(*) AS "count"
           FROM "public"."channels"
          WHERE ("channels"."profile_id" = "p"."id")) AS "channel_count"
   FROM "public"."profiles" "p"
  WHERE ((NOT (EXISTS ( SELECT 1
           FROM "public"."members"
          WHERE ("members"."id" = "p"."id")))) AND (NOT (EXISTS ( SELECT 1
           FROM "auth"."users"
          WHERE ("users"."id" = "p"."id")))));


ALTER TABLE "public"."orphaned_profiles_view" OWNER TO "postgres";


COMMENT ON VIEW "public"."orphaned_profiles_view" IS 'Shows profiles that are not linked to members or auth.users';



CREATE TABLE IF NOT EXISTS "public"."perks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "short_description" "text" NOT NULL,
    "partner_description" "text" NOT NULL,
    "benefits" "text"[] NOT NULL,
    "image_url" "text" NOT NULL,
    "category" "text" NOT NULL,
    "city" "text" NOT NULL,
    "tags" "text"[] NOT NULL,
    "featured" boolean DEFAULT false NOT NULL,
    "minimum_level" "text",
    "redemption_instructions" "text",
    "external_link" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "reservation_integration" "text",
    CONSTRAINT "perks_minimum_level_check" CHECK (("minimum_level" = ANY (ARRAY['Standard'::"text", 'Premium'::"text", 'Executive'::"text", 'Founding Member'::"text"])))
);


ALTER TABLE "public"."perks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."potential_trips" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "destination" "text" NOT NULL,
    "destination_city" "text",
    "destination_country" "text",
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "detection_source" "text" NOT NULL,
    "source_event_id" "uuid",
    "source_email_id" "uuid",
    "confidence_score" integer NOT NULL,
    "trip_type" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'detected'::"text" NOT NULL,
    "related_trip_id" "uuid",
    "related_entity_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    CONSTRAINT "potential_trips_confidence_score_check" CHECK ((("confidence_score" >= 0) AND ("confidence_score" <= 100))),
    CONSTRAINT "potential_trips_detection_source_check" CHECK (("detection_source" = ANY (ARRAY['calendar'::"text", 'email'::"text", 'manual'::"text"]))),
    CONSTRAINT "potential_trips_status_check" CHECK (("status" = ANY (ARRAY['detected'::"text", 'confirmed'::"text", 'booking_in_progress'::"text", 'booked'::"text", 'dismissed'::"text", 'expired'::"text"]))),
    CONSTRAINT "potential_trips_trip_type_check" CHECK (("trip_type" = ANY (ARRAY['business'::"text", 'leisure'::"text", 'mixed'::"text", 'unknown'::"text"]))),
    CONSTRAINT "valid_trip_dates" CHECK (("end_date" >= "start_date"))
);


ALTER TABLE "public"."potential_trips" OWNER TO "postgres";


COMMENT ON TABLE "public"."potential_trips" IS 'Stores trips detected from calendar and email analysis for proactive intelligence';



CREATE TABLE IF NOT EXISTS "public"."recommendation_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "request_text" "text" NOT NULL,
    "session_id" "uuid",
    "parsed_city" "text",
    "parsed_dates" "daterange",
    "parsed_budget_range" "int4range",
    "parsed_trip_type" "text",
    "parsed_party_size" integer,
    "parsed_constraints" "jsonb" DEFAULT '{}'::"jsonb",
    "clarifying_questions_asked" "text"[] DEFAULT '{}'::"text"[],
    "candidates_after_filter" integer,
    "candidates_shown" "uuid"[] DEFAULT '{}'::"uuid"[],
    "scores_at_presentation" "jsonb" DEFAULT '{}'::"jsonb",
    "llm_reasoning" "text",
    "chosen_hotel_id" "uuid",
    "asked_for_alternatives" boolean DEFAULT false,
    "time_to_selection_seconds" integer,
    "proceeded_to_booking" boolean DEFAULT false,
    "concierge_override" boolean DEFAULT false,
    "override_hotel_id" "uuid",
    "override_reason" "text",
    "booking_completed" boolean DEFAULT false,
    "final_booked_hotel_id" "uuid",
    "post_stay_rating" integer,
    "fit_score" integer,
    "feedback_tags" "text"[] DEFAULT '{}'::"text"[],
    "feedback_text" "text",
    "would_rebook" boolean,
    CONSTRAINT "recommendation_events_fit_score_check" CHECK ((("fit_score" >= 1) AND ("fit_score" <= 10))),
    CONSTRAINT "recommendation_events_post_stay_rating_check" CHECK ((("post_stay_rating" >= 1) AND ("post_stay_rating" <= 10)))
);


ALTER TABLE "public"."recommendation_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."recommendation_events" IS 'Full event logging for recommendation quality metrics and learning. Instrument everything from day one.';



COMMENT ON COLUMN "public"."recommendation_events"."scores_at_presentation" IS 'JSON object with hotel_id keys and {score, breakdown} values for explainability';



COMMENT ON COLUMN "public"."recommendation_events"."fit_score" IS '"How much did this feel like you?" 1-10 scale for post-stay feedback';



CREATE TABLE IF NOT EXISTS "public"."relationships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "from_entity_id" "uuid" NOT NULL,
    "to_entity_id" "uuid" NOT NULL,
    "relationship_type" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."relationships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trip_id" "uuid",
    "profile_id" "uuid",
    "intent" "public"."intent_t",
    "raw_text" "text",
    "entities" "jsonb" DEFAULT '{}'::"jsonb",
    "confidence" numeric,
    "mode" "public"."mode_t" DEFAULT 'assisted'::"public"."mode_t",
    "status" "text" DEFAULT 'new'::"text",
    "sla_due_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "results" "jsonb" DEFAULT '[]'::"jsonb",
    "front_conversation_id" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "conversation_id" "uuid",
    CONSTRAINT "requests_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'collecting'::"text", 'offered'::"text", 'awaiting_approval'::"text", 'booked'::"text", 'failed'::"text", 'canceled'::"text"])))
);


ALTER TABLE "public"."requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid",
    "type" "text",
    "run_at" timestamp with time zone,
    "payload" "jsonb",
    "status" "text" DEFAULT 'queued'::"text",
    "retries" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "task_type" "text",
    "assigned_agent" "text",
    "priority" integer DEFAULT 5,
    "input_data" "jsonb" DEFAULT '{}'::"jsonb",
    "output_data" "jsonb" DEFAULT '{}'::"jsonb",
    "requires_human" boolean DEFAULT false,
    "escalation_reason" "text",
    "due_date" timestamp with time zone,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "title" "text",
    "description" "text",
    "ui_state" "jsonb" DEFAULT '{}'::"jsonb",
    "confidence_score" numeric(3,2),
    "risk_level" "text",
    "decision_strategy" "text",
    "idempotency_key" "text",
    "llm_reasoning" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "tasks_confidence_score_check" CHECK ((("confidence_score" >= (0)::numeric) AND ("confidence_score" <= (1)::numeric))),
    CONSTRAINT "tasks_decision_strategy_check" CHECK (("decision_strategy" = ANY (ARRAY['auto_execute'::"text", 'preview_confirm'::"text", 'clarify'::"text", 'escalate'::"text"]))),
    CONSTRAINT "tasks_risk_level_check" CHECK (("risk_level" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "tasks_status_check" CHECK ((("status" IS NULL) OR ("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'awaiting_human'::"text", 'completed'::"text", 'failed'::"text"]))))
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


COMMENT ON COLUMN "public"."tasks"."status" IS 'Task status: pending, in_progress, awaiting_human, completed, failed';



COMMENT ON COLUMN "public"."tasks"."ui_state" IS 'Rich UI state for component rendering: {current_step, progress, results_preview, needs_decision, rendered_component}';



COMMENT ON COLUMN "public"."tasks"."confidence_score" IS 'LLM confidence in understanding the request (0.00-1.00)';



COMMENT ON COLUMN "public"."tasks"."risk_level" IS 'Risk level of auto-executing: low (read-only), medium (modifications), high (financial)';



COMMENT ON COLUMN "public"."tasks"."decision_strategy" IS 'Execution strategy: auto_execute, preview_confirm, clarify, escalate';



COMMENT ON COLUMN "public"."tasks"."idempotency_key" IS 'Unique key to prevent duplicate task creation from same request';



COMMENT ON COLUMN "public"."tasks"."llm_reasoning" IS 'LLM reasoning and assumptions for transparency';



CREATE TABLE IF NOT EXISTS "public"."travel_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "travel_type" "text" NOT NULL,
    "ambiance" "text" NOT NULL,
    "budget" "text" NOT NULL,
    "description" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_ambiance" CHECK (("ambiance" = ANY (ARRAY['boutique'::"text", 'luxury'::"text", 'modern'::"text", 'classic'::"text"]))),
    CONSTRAINT "valid_status" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "valid_travel_type" CHECK (("travel_type" = ANY (ARRAY['commercial'::"text", 'private'::"text"])))
);


ALTER TABLE "public"."travel_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trips" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid",
    "name" "text",
    "start_date" "date",
    "end_date" "date",
    "status" "text" DEFAULT 'planning'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "trips_status_check" CHECK (("status" = ANY (ARRAY['planning'::"text", 'booked'::"text", 'completed'::"text", 'canceled'::"text"])))
);


ALTER TABLE "public"."trips" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_context_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "conversation_id" "uuid",
    "context_type" "text" NOT NULL,
    "context_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_context_history_context_type_check" CHECK (("context_type" = ANY (ARRAY['preference_learned'::"text", 'search_performed'::"text", 'booking_made'::"text", 'feedback_given'::"text", 'clarification_asked'::"text", 'interest_expressed'::"text"])))
);


ALTER TABLE "public"."user_context_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_hotel_preferences" (
    "user_id" "uuid" NOT NULL,
    "home_city" "text",
    "typical_timezones" "text"[] DEFAULT '{}'::"text"[],
    "company" "text",
    "role" "text",
    "price_bands_by_city" "jsonb" DEFAULT '{}'::"jsonb",
    "hard_budget_max" integer,
    "deal_sensitivity" integer,
    "loyalty_programs" "jsonb" DEFAULT '[]'::"jsonb",
    "preferred_brands" "text"[] DEFAULT '{}'::"text"[],
    "design_style_ranked" "text"[] DEFAULT '{}'::"text"[],
    "atmosphere_ranked" "text"[] DEFAULT '{}'::"text"[],
    "noise_tolerance" integer,
    "scene_tolerance" integer,
    "service_preference" "public"."service_preference_enum",
    "preferred_neighborhoods" "jsonb" DEFAULT '{}'::"jsonb",
    "location_priority" "public"."location_priority_enum",
    "max_commute_tolerance" integer,
    "gym_priority" integer,
    "spa_priority" integer,
    "pool_priority" integer,
    "food_drink_priority" integer,
    "wifi_priority" integer,
    "must_have" "text"[] DEFAULT '{}'::"text"[],
    "hard_no" "text"[] DEFAULT '{}'::"text"[],
    "accessibility_needs" "text"[] DEFAULT '{}'::"text"[],
    "pet_traveling" boolean DEFAULT false,
    "stay_history" "jsonb" DEFAULT '[]'::"jsonb",
    "taste_vector" "public"."vector"(1536),
    "tag_weights" "jsonb" DEFAULT '{}'::"jsonb",
    "concierge_overrides" "jsonb" DEFAULT '[]'::"jsonb",
    "taste_profile_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_hotel_preferences_deal_sensitivity_check" CHECK ((("deal_sensitivity" >= 1) AND ("deal_sensitivity" <= 5))),
    CONSTRAINT "user_hotel_preferences_food_drink_priority_check" CHECK ((("food_drink_priority" >= 0) AND ("food_drink_priority" <= 3))),
    CONSTRAINT "user_hotel_preferences_gym_priority_check" CHECK ((("gym_priority" >= 0) AND ("gym_priority" <= 3))),
    CONSTRAINT "user_hotel_preferences_noise_tolerance_check" CHECK ((("noise_tolerance" >= 1) AND ("noise_tolerance" <= 5))),
    CONSTRAINT "user_hotel_preferences_pool_priority_check" CHECK ((("pool_priority" >= 0) AND ("pool_priority" <= 3))),
    CONSTRAINT "user_hotel_preferences_scene_tolerance_check" CHECK ((("scene_tolerance" >= 1) AND ("scene_tolerance" <= 5))),
    CONSTRAINT "user_hotel_preferences_spa_priority_check" CHECK ((("spa_priority" >= 0) AND ("spa_priority" <= 3))),
    CONSTRAINT "user_hotel_preferences_wifi_priority_check" CHECK ((("wifi_priority" >= 0) AND ("wifi_priority" <= 3)))
);


ALTER TABLE "public"."user_hotel_preferences" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_hotel_preferences" IS 'User preferences for hotel matching. System-updated fields learn from user behavior.';



COMMENT ON COLUMN "public"."user_hotel_preferences"."taste_vector" IS 'Vector embedding computed from loved hotels (OpenAI ada-002, 1536 dimensions)';



COMMENT ON COLUMN "public"."user_hotel_preferences"."tag_weights" IS 'Per-tag affinity scores that adjust based on ratings';



COMMENT ON COLUMN "public"."user_hotel_preferences"."taste_profile_text" IS 'Natural language summary of user taste for LLM context';



CREATE TABLE IF NOT EXISTS "public"."user_patterns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "pattern_type" "text" NOT NULL,
    "pattern_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "confidence_score" integer NOT NULL,
    "observation_count" integer DEFAULT 1 NOT NULL,
    "pattern_strength" "text",
    "last_observed" timestamp with time zone DEFAULT "now"() NOT NULL,
    "first_observed" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_patterns_confidence_score_check" CHECK ((("confidence_score" >= 0) AND ("confidence_score" <= 100))),
    CONSTRAINT "user_patterns_observation_count_check" CHECK (("observation_count" > 0)),
    CONSTRAINT "user_patterns_pattern_strength_check" CHECK (("pattern_strength" = ANY (ARRAY['weak'::"text", 'moderate'::"text", 'strong'::"text", 'very_strong'::"text"]))),
    CONSTRAINT "user_patterns_pattern_type_check" CHECK (("pattern_type" = ANY (ARRAY['airline_preference'::"text", 'hotel_tier'::"text", 'booking_timing'::"text", 'seat_preference'::"text", 'price_sensitivity'::"text", 'destination_frequency'::"text", 'travel_day_preference'::"text", 'booking_window'::"text", 'amenity_preference'::"text", 'loyalty_usage'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."user_patterns" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_patterns" IS 'Stores learned user behavior patterns and preferences for personalized suggestions';



CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "travel_preferences" "jsonb" DEFAULT '{"hotel": {"amenities": [], "room_type": "standard", "preferred_brands": [], "location_preference": "central"}, "dining": {"price_range": "moderate", "dining_style": ["fine_dining", "local"], "cuisine_preferences": []}, "flight": {"cabin_class": "economy", "seat_preference": "window", "nonstop_preferred": true, "preferred_airlines": []}}'::"jsonb",
    "budget_ranges" "jsonb" DEFAULT '{"hotel": {"flexible": true, "per_night_max": 300, "per_night_min": 0}, "dining": {"flexible": true, "per_meal_max": 100, "per_meal_min": 0}, "flight": {"max": 1000, "min": 0, "flexible": true}}'::"jsonb",
    "special_requirements" "jsonb" DEFAULT '{"dietary": [], "allergies": [], "accessibility": []}'::"jsonb",
    "loyalty_programs" "jsonb" DEFAULT '[]'::"jsonb",
    "payment_preferences" "jsonb" DEFAULT '{"default_card_on_file": false, "preferred_payment_method": "card"}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."valid_profiles" AS
 SELECT "p"."id",
    "p"."full_name",
    "p"."email" AS "profile_email",
    "p"."phone_number",
    "p"."time_zone",
    "p"."travel_preferences",
    "p"."onboarding_completed",
    "p"."front_user_hash",
    "p"."personal_context",
    "p"."communication_preferences",
    "p"."metadata",
    "p"."profile_photo_url",
    "p"."theme_preference",
    "p"."created_at" AS "profile_created_at",
    "p"."updated_at" AS "profile_updated_at",
    "m"."first_name",
    "m"."last_name",
    "m"."email" AS "member_email",
    "m"."member_id",
    "m"."membership_level",
    "m"."role" AS "member_role",
        CASE
            WHEN ("m"."id" IS NOT NULL) THEN 'member'::"text"
            WHEN ("u"."id" IS NOT NULL) THEN 'auth_user'::"text"
            ELSE 'orphaned'::"text"
        END AS "profile_type"
   FROM (("public"."profiles" "p"
     LEFT JOIN "public"."members" "m" ON (("p"."id" = "m"."id")))
     LEFT JOIN "auth"."users" "u" ON (("p"."id" = "u"."id")));


ALTER TABLE "public"."valid_profiles" OWNER TO "postgres";


COMMENT ON VIEW "public"."valid_profiles" IS 'Shows all profiles with their member status and type';



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_credentials"
    ADD CONSTRAINT "api_credentials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_credentials"
    ADD CONSTRAINT "api_credentials_provider_key" UNIQUE ("provider");



ALTER TABLE ONLY "public"."automations"
    ADD CONSTRAINT "automations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_user_id_gcal_event_id_key" UNIQUE ("user_id", "gcal_event_id");



ALTER TABLE ONLY "public"."channels"
    ADD CONSTRAINT "channels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."concierge_conversations"
    ADD CONSTRAINT "concierge_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."concierge_messages"
    ADD CONSTRAINT "concierge_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_front_conversation_id_key" UNIQUE ("front_conversation_id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_briefs"
    ADD CONSTRAINT "daily_briefs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_context"
    ADD CONSTRAINT "email_context_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."emails"
    ADD CONSTRAINT "emails_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."emails"
    ADD CONSTRAINT "emails_user_id_gmail_message_id_key" UNIQUE ("user_id", "gmail_message_id");



ALTER TABLE ONLY "public"."entities"
    ADD CONSTRAINT "entities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hotels"
    ADD CONSTRAINT "hotels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integrations"
    ADD CONSTRAINT "integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integrations"
    ADD CONSTRAINT "integrations_user_id_provider_key" UNIQUE ("user_id", "provider");



ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_member_id_key" UNIQUE ("member_id");



ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."membership_changes"
    ADD CONSTRAINT "membership_changes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."opportunities"
    ADD CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."perks"
    ADD CONSTRAINT "perks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."potential_trips"
    ADD CONSTRAINT "potential_trips_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recommendation_events"
    ADD CONSTRAINT "recommendation_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."relationships"
    ADD CONSTRAINT "relationships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."requests"
    ADD CONSTRAINT "requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."travel_requests"
    ADD CONSTRAINT "travel_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trips"
    ADD CONSTRAINT "trips_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_briefs"
    ADD CONSTRAINT "unique_daily_brief" UNIQUE ("user_id", "brief_date");



ALTER TABLE ONLY "public"."user_patterns"
    ADD CONSTRAINT "unique_user_pattern" UNIQUE ("user_id", "pattern_type");



ALTER TABLE ONLY "public"."user_context_history"
    ADD CONSTRAINT "user_context_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_hotel_preferences"
    ADD CONSTRAINT "user_hotel_preferences_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_patterns"
    ADD CONSTRAINT "user_patterns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_profile_id_key" UNIQUE ("profile_id");



CREATE INDEX "idx_activities_created" ON "public"."activities" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_activities_request" ON "public"."activities" USING "btree" ("request_id", "created_at" DESC);



CREATE INDEX "idx_api_credentials_active" ON "public"."api_credentials" USING "btree" ("is_active", "priority");



CREATE INDEX "idx_api_credentials_provider" ON "public"."api_credentials" USING "btree" ("provider");



CREATE INDEX "idx_automations_next_run" ON "public"."automations" USING "btree" ("next_run_at") WHERE ("is_active" = true);



CREATE INDEX "idx_automations_user_active" ON "public"."automations" USING "btree" ("user_id", "is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_calendar_events_trip" ON "public"."calendar_events" USING "btree" ("related_trip_id") WHERE ("related_trip_id" IS NOT NULL);



CREATE INDEX "idx_calendar_events_user_time" ON "public"."calendar_events" USING "btree" ("user_id", "start_time");



CREATE INDEX "idx_channels_profile" ON "public"."channels" USING "btree" ("profile_id");



CREATE INDEX "idx_conversations_channel_id" ON "public"."conversations" USING "btree" ("channel_id");



CREATE INDEX "idx_conversations_front_id" ON "public"."conversations" USING "btree" ("front_conversation_id");



CREATE INDEX "idx_conversations_task" ON "public"."conversations" USING "btree" ("related_task_id") WHERE ("related_task_id" IS NOT NULL);



CREATE INDEX "idx_conversations_user_created" ON "public"."conversations" USING "btree" ("user_id", "created_at" DESC) WHERE ("user_id" IS NOT NULL);



CREATE INDEX "idx_conversations_user_last_message" ON "public"."concierge_conversations" USING "btree" ("user_id", "last_message_at" DESC);



CREATE INDEX "idx_daily_briefs_date" ON "public"."daily_briefs" USING "btree" ("brief_date" DESC);



CREATE INDEX "idx_daily_briefs_generated" ON "public"."daily_briefs" USING "btree" ("generated_at" DESC);



CREATE INDEX "idx_daily_briefs_unread" ON "public"."daily_briefs" USING "btree" ("user_id") WHERE ("read_at" IS NULL);



CREATE INDEX "idx_daily_briefs_user_date" ON "public"."daily_briefs" USING "btree" ("user_id", "brief_date" DESC);



CREATE INDEX "idx_daily_briefs_user_id" ON "public"."daily_briefs" USING "btree" ("user_id");



CREATE INDEX "idx_email_context_created" ON "public"."email_context" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_email_context_email_id" ON "public"."email_context" USING "btree" ("email_id");



CREATE INDEX "idx_email_context_processed" ON "public"."email_context" USING "btree" ("processed") WHERE (NOT "processed");



CREATE INDEX "idx_email_context_type" ON "public"."email_context" USING "btree" ("confirmation_type");



CREATE INDEX "idx_email_context_user_id" ON "public"."email_context" USING "btree" ("user_id");



CREATE INDEX "idx_emails_category" ON "public"."emails" USING "btree" ("user_id", "category") WHERE ("category" IS NOT NULL);



CREATE INDEX "idx_emails_unprocessed" ON "public"."emails" USING "btree" ("user_id") WHERE ("processed" = false);



CREATE INDEX "idx_emails_user_received" ON "public"."emails" USING "btree" ("user_id", "received_at" DESC);



CREATE INDEX "idx_entities_created" ON "public"."entities" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_entities_source" ON "public"."entities" USING "btree" ("source", "source_id");



CREATE INDEX "idx_entities_user_type" ON "public"."entities" USING "btree" ("user_id", "entity_type");



CREATE INDEX "idx_hotels_is_active" ON "public"."hotels" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_hotels_location" ON "public"."hotels" USING "gist" ("point"(("lng")::double precision, ("lat")::double precision));



CREATE INDEX "idx_hotels_neighborhood" ON "public"."hotels" USING "btree" ("neighborhood");



CREATE INDEX "idx_hotels_primary_city" ON "public"."hotels" USING "btree" ("primary_city");



CREATE INDEX "idx_hotels_profile_embedding" ON "public"."hotels" USING "ivfflat" ("profile_embedding" "public"."vector_cosine_ops") WITH ("lists"='100');



CREATE INDEX "idx_hotels_quality_score" ON "public"."hotels" USING "btree" ("quality_score_internal" DESC);



CREATE INDEX "idx_integrations_active" ON "public"."integrations" USING "btree" ("user_id", "is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_integrations_user_provider" ON "public"."integrations" USING "btree" ("user_id", "provider");



CREATE INDEX "idx_members_stripe_customer_id" ON "public"."members" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_members_subscription_status" ON "public"."members" USING "btree" ("subscription_status");



CREATE INDEX "idx_membership_changes_user_id" ON "public"."membership_changes" USING "btree" ("user_id");



CREATE INDEX "idx_messages_conversation" ON "public"."messages" USING "btree" ("conversation_id", "created_at");



CREATE INDEX "idx_messages_processed" ON "public"."messages" USING "btree" ("processed", "created_at") WHERE ("processed" = false);



CREATE INDEX "idx_messages_request_id" ON "public"."messages" USING "btree" ("request_id");



CREATE INDEX "idx_notifications_user_unread" ON "public"."notifications" USING "btree" ("user_id", "created_at" DESC) WHERE ("read_at" IS NULL);



CREATE INDEX "idx_offers_request_selected" ON "public"."offers" USING "btree" ("request_id", "selected");



CREATE INDEX "idx_opportunities_created" ON "public"."opportunities" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_opportunities_expires" ON "public"."opportunities" USING "btree" ("expires_at") WHERE (("expires_at" IS NOT NULL) AND ("status" <> ALL (ARRAY['expired'::"text", 'completed'::"text"])));



CREATE INDEX "idx_opportunities_scores" ON "public"."opportunities" USING "btree" ("urgency_score" DESC, "impact_score" DESC) WHERE ("status" = ANY (ARRAY['pending'::"text", 'shown'::"text"]));



CREATE INDEX "idx_opportunities_status" ON "public"."opportunities" USING "btree" ("status") WHERE ("status" = ANY (ARRAY['pending'::"text", 'shown'::"text", 'snoozed'::"text"]));



CREATE INDEX "idx_opportunities_tier" ON "public"."opportunities" USING "btree" ("tier");



CREATE INDEX "idx_opportunities_trip" ON "public"."opportunities" USING "btree" ("related_potential_trip_id") WHERE ("related_potential_trip_id" IS NOT NULL);



CREATE INDEX "idx_opportunities_type" ON "public"."opportunities" USING "btree" ("type");



CREATE INDEX "idx_opportunities_user_id" ON "public"."opportunities" USING "btree" ("user_id");



CREATE INDEX "idx_potential_trips_confidence" ON "public"."potential_trips" USING "btree" ("confidence_score") WHERE ("confidence_score" > 60);



CREATE INDEX "idx_potential_trips_created" ON "public"."potential_trips" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_potential_trips_dates" ON "public"."potential_trips" USING "btree" ("user_id", "start_date", "end_date");



CREATE INDEX "idx_potential_trips_status" ON "public"."potential_trips" USING "btree" ("status") WHERE ("status" = ANY (ARRAY['detected'::"text", 'confirmed'::"text"]));



CREATE INDEX "idx_potential_trips_user_id" ON "public"."potential_trips" USING "btree" ("user_id");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email") WHERE ("email" IS NOT NULL);



CREATE INDEX "idx_profiles_id" ON "public"."profiles" USING "btree" ("id");



CREATE INDEX "idx_profiles_intercom_user_id" ON "public"."profiles" USING "btree" ("intercom_user_id");



CREATE INDEX "idx_profiles_member" ON "public"."profiles" USING "btree" ("member_id");



CREATE INDEX "idx_profiles_onboarding" ON "public"."profiles" USING "btree" ("onboarding_completed") WHERE ("onboarding_completed" = false);



CREATE INDEX "idx_profiles_personal_context_gin" ON "public"."profiles" USING "gin" ("personal_context");



CREATE INDEX "idx_profiles_time_zone" ON "public"."profiles" USING "btree" ("time_zone") WHERE ("time_zone" IS NOT NULL);



CREATE INDEX "idx_profiles_travel_preferences_gin" ON "public"."profiles" USING "gin" ("travel_preferences");



CREATE INDEX "idx_recommendation_events_chosen_hotel" ON "public"."recommendation_events" USING "btree" ("chosen_hotel_id") WHERE ("chosen_hotel_id" IS NOT NULL);



CREATE INDEX "idx_recommendation_events_created_at" ON "public"."recommendation_events" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_recommendation_events_final_booked" ON "public"."recommendation_events" USING "btree" ("final_booked_hotel_id") WHERE ("final_booked_hotel_id" IS NOT NULL);



CREATE INDEX "idx_recommendation_events_session_id" ON "public"."recommendation_events" USING "btree" ("session_id");



CREATE INDEX "idx_recommendation_events_user_id" ON "public"."recommendation_events" USING "btree" ("user_id");



CREATE INDEX "idx_relationships_from" ON "public"."relationships" USING "btree" ("from_entity_id");



CREATE INDEX "idx_relationships_to" ON "public"."relationships" USING "btree" ("to_entity_id");



CREATE INDEX "idx_relationships_user" ON "public"."relationships" USING "btree" ("user_id");



CREATE INDEX "idx_requests_conversation_id" ON "public"."requests" USING "btree" ("conversation_id");



CREATE INDEX "idx_requests_created_at" ON "public"."requests" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_requests_profile_id" ON "public"."requests" USING "btree" ("profile_id");



CREATE INDEX "idx_requests_trip_id" ON "public"."requests" USING "btree" ("trip_id");



CREATE INDEX "idx_tasks_agent" ON "public"."tasks" USING "btree" ("assigned_agent", "status") WHERE ("assigned_agent" IS NOT NULL);



CREATE INDEX "idx_tasks_confidence" ON "public"."tasks" USING "btree" ("confidence_score") WHERE ("confidence_score" IS NOT NULL);



CREATE UNIQUE INDEX "idx_tasks_idempotency_key" ON "public"."tasks" USING "btree" ("idempotency_key") WHERE ("idempotency_key" IS NOT NULL);



CREATE INDEX "idx_tasks_request" ON "public"."tasks" USING "btree" ("request_id");



CREATE INDEX "idx_tasks_status_runat" ON "public"."tasks" USING "btree" ("status", "run_at");



CREATE INDEX "idx_tasks_ui_state_gin" ON "public"."tasks" USING "gin" ("ui_state");



CREATE INDEX "idx_tasks_user_created" ON "public"."tasks" USING "btree" ("user_id", "created_at" DESC) WHERE ("user_id" IS NOT NULL);



CREATE INDEX "idx_tasks_user_status" ON "public"."tasks" USING "btree" ("user_id", "status") WHERE ("user_id" IS NOT NULL);



CREATE INDEX "idx_tasks_user_status_realtime" ON "public"."tasks" USING "btree" ("user_id", "status", "created_at" DESC);



CREATE INDEX "idx_travel_requests_user_id" ON "public"."travel_requests" USING "btree" ("user_id");



CREATE INDEX "idx_trips_profile_id" ON "public"."trips" USING "btree" ("profile_id");



CREATE INDEX "idx_user_context_history_conversation_id" ON "public"."user_context_history" USING "btree" ("conversation_id");



CREATE INDEX "idx_user_context_history_created_at" ON "public"."user_context_history" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_user_context_history_profile_id" ON "public"."user_context_history" USING "btree" ("profile_id");



CREATE INDEX "idx_user_hotel_prefs_taste_vector" ON "public"."user_hotel_preferences" USING "ivfflat" ("taste_vector" "public"."vector_cosine_ops") WITH ("lists"='100');



CREATE INDEX "idx_user_hotel_prefs_user_id" ON "public"."user_hotel_preferences" USING "btree" ("user_id");



CREATE INDEX "idx_user_patterns_confidence" ON "public"."user_patterns" USING "btree" ("confidence_score") WHERE ("confidence_score" > 60);



CREATE INDEX "idx_user_patterns_strength" ON "public"."user_patterns" USING "btree" ("pattern_strength") WHERE ("pattern_strength" = ANY (ARRAY['strong'::"text", 'very_strong'::"text"]));



CREATE INDEX "idx_user_patterns_type" ON "public"."user_patterns" USING "btree" ("pattern_type");



CREATE INDEX "idx_user_patterns_user_id" ON "public"."user_patterns" USING "btree" ("user_id");



CREATE INDEX "idx_user_preferences_profile_id" ON "public"."user_preferences" USING "btree" ("profile_id");



CREATE OR REPLACE TRIGGER "check_profile_owner" BEFORE INSERT OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."validate_profile_owner"();



CREATE OR REPLACE TRIGGER "opportunities_updated_at" BEFORE UPDATE ON "public"."opportunities" FOR EACH ROW EXECUTE FUNCTION "public"."update_opportunities_updated_at"();



CREATE OR REPLACE TRIGGER "potential_trips_updated_at" BEFORE UPDATE ON "public"."potential_trips" FOR EACH ROW EXECUTE FUNCTION "public"."update_potential_trips_updated_at"();



CREATE OR REPLACE TRIGGER "update_automations_updated_at" BEFORE UPDATE ON "public"."automations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_calendar_events_updated_at" BEFORE UPDATE ON "public"."calendar_events" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_conversation_timestamp" AFTER INSERT ON "public"."concierge_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_conversation_last_message"();



CREATE OR REPLACE TRIGGER "update_entities_updated_at" BEFORE UPDATE ON "public"."entities" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_integrations_updated_at" BEFORE UPDATE ON "public"."integrations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_members_updated_at" BEFORE UPDATE ON "public"."members" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_requests_updated_at" BEFORE UPDATE ON "public"."requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_travel_requests_updated_at" BEFORE UPDATE ON "public"."travel_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_preferences_updated_at" BEFORE UPDATE ON "public"."user_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "user_patterns_updated_at" BEFORE UPDATE ON "public"."user_patterns" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_patterns_updated_at"();



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automations"
    ADD CONSTRAINT "automations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_related_trip_id_fkey" FOREIGN KEY ("related_trip_id") REFERENCES "public"."entities"("id");



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."channels"
    ADD CONSTRAINT "channels_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."concierge_conversations"
    ADD CONSTRAINT "concierge_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."concierge_messages"
    ADD CONSTRAINT "concierge_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."concierge_conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_related_task_id_fkey" FOREIGN KEY ("related_task_id") REFERENCES "public"."tasks"("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_briefs"
    ADD CONSTRAINT "daily_briefs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_context"
    ADD CONSTRAINT "email_context_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."emails"
    ADD CONSTRAINT "emails_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."entities"
    ADD CONSTRAINT "entities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_briefs"
    ADD CONSTRAINT "fk_daily_briefs_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_context"
    ADD CONSTRAINT "fk_email_context_email" FOREIGN KEY ("email_id") REFERENCES "public"."emails"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_context"
    ADD CONSTRAINT "fk_email_context_potential_trip" FOREIGN KEY ("related_potential_trip_id") REFERENCES "public"."potential_trips"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."email_context"
    ADD CONSTRAINT "fk_email_context_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."opportunities"
    ADD CONSTRAINT "fk_opportunities_entity" FOREIGN KEY ("related_entity_id") REFERENCES "public"."entities"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."opportunities"
    ADD CONSTRAINT "fk_opportunities_task" FOREIGN KEY ("related_task_id") REFERENCES "public"."tasks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."opportunities"
    ADD CONSTRAINT "fk_opportunities_trip" FOREIGN KEY ("related_potential_trip_id") REFERENCES "public"."potential_trips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."opportunities"
    ADD CONSTRAINT "fk_opportunities_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."potential_trips"
    ADD CONSTRAINT "fk_potential_trips_related_entity" FOREIGN KEY ("related_entity_id") REFERENCES "public"."entities"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."potential_trips"
    ADD CONSTRAINT "fk_potential_trips_related_trip" FOREIGN KEY ("related_trip_id") REFERENCES "public"."trips"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."potential_trips"
    ADD CONSTRAINT "fk_potential_trips_source_email" FOREIGN KEY ("source_email_id") REFERENCES "public"."emails"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."potential_trips"
    ADD CONSTRAINT "fk_potential_trips_source_event" FOREIGN KEY ("source_event_id") REFERENCES "public"."calendar_events"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."potential_trips"
    ADD CONSTRAINT "fk_potential_trips_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "fk_user" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_patterns"
    ADD CONSTRAINT "fk_user_patterns_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integrations"
    ADD CONSTRAINT "integrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."membership_changes"
    ADD CONSTRAINT "membership_changes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_related_entity_id_fkey" FOREIGN KEY ("related_entity_id") REFERENCES "public"."entities"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_related_task_id_fkey" FOREIGN KEY ("related_task_id") REFERENCES "public"."tasks"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."opportunities"
    ADD CONSTRAINT "opportunities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."potential_trips"
    ADD CONSTRAINT "potential_trips_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recommendation_events"
    ADD CONSTRAINT "recommendation_events_chosen_hotel_id_fkey" FOREIGN KEY ("chosen_hotel_id") REFERENCES "public"."hotels"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."recommendation_events"
    ADD CONSTRAINT "recommendation_events_final_booked_hotel_id_fkey" FOREIGN KEY ("final_booked_hotel_id") REFERENCES "public"."hotels"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."recommendation_events"
    ADD CONSTRAINT "recommendation_events_override_hotel_id_fkey" FOREIGN KEY ("override_hotel_id") REFERENCES "public"."hotels"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."recommendation_events"
    ADD CONSTRAINT "recommendation_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."relationships"
    ADD CONSTRAINT "relationships_from_entity_id_fkey" FOREIGN KEY ("from_entity_id") REFERENCES "public"."entities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."relationships"
    ADD CONSTRAINT "relationships_to_entity_id_fkey" FOREIGN KEY ("to_entity_id") REFERENCES "public"."entities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."relationships"
    ADD CONSTRAINT "relationships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."requests"
    ADD CONSTRAINT "requests_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."concierge_conversations"("id");



ALTER TABLE ONLY "public"."requests"
    ADD CONSTRAINT "requests_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."requests"
    ADD CONSTRAINT "requests_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."travel_requests"
    ADD CONSTRAINT "travel_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trips"
    ADD CONSTRAINT "trips_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_context_history"
    ADD CONSTRAINT "user_context_history_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."concierge_conversations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_context_history"
    ADD CONSTRAINT "user_context_history_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_hotel_preferences"
    ADD CONSTRAINT "user_hotel_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_patterns"
    ADD CONSTRAINT "user_patterns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can delete events" ON "public"."events" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("members"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can insert events" ON "public"."events" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("members"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can update events" ON "public"."events" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("members"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("members"."role" = 'admin'::"text")))));



CREATE POLICY "Anyone can read active hotels" ON "public"."hotels" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view events" ON "public"."events" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can view perks" ON "public"."perks" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."perks" FOR INSERT TO "supabase_admin" WITH CHECK (true);



CREATE POLICY "Service role can insert messages" ON "public"."messages" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service role can manage all activities" ON "public"."activities" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage all offers" ON "public"."offers" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage all tasks" ON "public"."tasks" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can read all messages" ON "public"."messages" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "Service role can read all requests" ON "public"."requests" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "Service role can update all requests" ON "public"."requests" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access" ON "public"."hotels" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access" ON "public"."recommendation_events" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access" ON "public"."user_hotel_preferences" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role only" ON "public"."api_credentials" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "System can insert context history" ON "public"."user_context_history" FOR INSERT TO "authenticated" WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users access own automations" ON "public"."automations" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users access own calendar_events" ON "public"."calendar_events" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users access own emails" ON "public"."emails" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users access own entities" ON "public"."entities" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users access own integrations" ON "public"."integrations" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users access own notifications" ON "public"."notifications" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users access own relationships" ON "public"."relationships" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create messages in their conversations" ON "public"."concierge_messages" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."concierge_conversations"
  WHERE (("concierge_conversations"."id" = "concierge_messages"."conversation_id") AND ("concierge_conversations"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create own conversations" ON "public"."concierge_conversations" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own travel requests" ON "public"."travel_requests" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete messages in their conversations" ON "public"."concierge_messages" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."concierge_conversations"
  WHERE (("concierge_conversations"."id" = "concierge_messages"."conversation_id") AND ("concierge_conversations"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own conversations" ON "public"."concierge_conversations" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own tasks" ON "public"."tasks" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete own trips" ON "public"."trips" FOR DELETE TO "authenticated" USING (("profile_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete their own daily briefs" ON "public"."daily_briefs" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own opportunities" ON "public"."opportunities" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own patterns" ON "public"."user_patterns" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own potential trips" ON "public"."potential_trips" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own channels" ON "public"."channels" FOR INSERT TO "authenticated" WITH CHECK (("profile_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert own conversations" ON "public"."conversations" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."channels"
  WHERE (("channels"."id" = "conversations"."channel_id") AND ("channels"."profile_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can insert own membership changes" ON "public"."membership_changes" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert own messages" ON "public"."messages" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."conversations"
     JOIN "public"."channels" ON (("channels"."id" = "conversations"."channel_id")))
  WHERE (("conversations"."id" = "messages"."conversation_id") AND ("channels"."profile_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can insert own preferences" ON "public"."user_hotel_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own preferences" ON "public"."user_preferences" FOR INSERT TO "authenticated" WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert own requests" ON "public"."requests" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."trips"
  WHERE (("trips"."id" = "requests"."trip_id") AND ("trips"."profile_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can insert own tasks" ON "public"."tasks" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own trips" ON "public"."trips" FOR INSERT TO "authenticated" WITH CHECK (("profile_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert their own daily briefs" ON "public"."daily_briefs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own email context" ON "public"."email_context" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own opportunities" ON "public"."opportunities" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own patterns" ON "public"."user_patterns" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own potential trips" ON "public"."potential_trips" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own data" ON "public"."members" FOR SELECT TO "authenticated" USING (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can read own events" ON "public"."recommendation_events" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own membership changes" ON "public"."membership_changes" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can read own preferences" ON "public"."user_hotel_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read their own travel requests" ON "public"."travel_requests" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update messages in their conversations" ON "public"."concierge_messages" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."concierge_conversations"
  WHERE (("concierge_conversations"."id" = "concierge_messages"."conversation_id") AND ("concierge_conversations"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."concierge_conversations"
  WHERE (("concierge_conversations"."id" = "concierge_messages"."conversation_id") AND ("concierge_conversations"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own conversations" ON "public"."concierge_conversations" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own data" ON "public"."members" FOR UPDATE TO "authenticated" USING (("id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own preferences" ON "public"."user_hotel_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own preferences" ON "public"."user_preferences" FOR UPDATE TO "authenticated" USING (("profile_id" = "auth"."uid"())) WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own requests" ON "public"."requests" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."trips"
  WHERE (("trips"."id" = "requests"."trip_id") AND ("trips"."profile_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."trips"
  WHERE (("trips"."id" = "requests"."trip_id") AND ("trips"."profile_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can update own tasks" ON "public"."tasks" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own trips" ON "public"."trips" FOR UPDATE TO "authenticated" USING (("profile_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("profile_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update their own daily briefs" ON "public"."daily_briefs" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own email context" ON "public"."email_context" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own opportunities" ON "public"."opportunities" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own patterns" ON "public"."user_patterns" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own potential trips" ON "public"."potential_trips" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view activities for their conversations" ON "public"."activities" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."conversations"
     JOIN "public"."channels" ON (("channels"."id" = "conversations"."channel_id")))
  WHERE (("conversations"."id" = "activities"."conversation_id") AND ("channels"."profile_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can view messages in their conversations" ON "public"."concierge_messages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."concierge_conversations"
  WHERE (("concierge_conversations"."id" = "concierge_messages"."conversation_id") AND ("concierge_conversations"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view offers for their requests" ON "public"."offers" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."travel_requests"
  WHERE (("travel_requests"."id" = "offers"."request_id") AND ("travel_requests"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can view own channels" ON "public"."channels" FOR SELECT TO "authenticated" USING (("profile_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own context history" ON "public"."user_context_history" FOR SELECT TO "authenticated" USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can view own conversations" ON "public"."concierge_conversations" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own conversations" ON "public"."conversations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."channels"
  WHERE (("channels"."id" = "conversations"."channel_id") AND ("channels"."profile_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can view own messages" ON "public"."messages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."conversations"
     JOIN "public"."channels" ON (("channels"."id" = "conversations"."channel_id")))
  WHERE (("conversations"."id" = "messages"."conversation_id") AND ("channels"."profile_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can view own preferences" ON "public"."user_preferences" FOR SELECT TO "authenticated" USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own requests" ON "public"."requests" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."trips"
  WHERE (("trips"."id" = "requests"."trip_id") AND ("trips"."profile_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can view own tasks" ON "public"."tasks" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own trips" ON "public"."trips" FOR SELECT TO "authenticated" USING (("profile_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view their own daily briefs" ON "public"."daily_briefs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own email context" ON "public"."email_context" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own opportunities" ON "public"."opportunities" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own patterns" ON "public"."user_patterns" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own potential trips" ON "public"."potential_trips" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."api_credentials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."automations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."calendar_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."channels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."concierge_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."concierge_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_briefs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_context" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."emails" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."entities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hotels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."integrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."membership_changes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."offers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."opportunities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."perks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."potential_trips" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."recommendation_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."relationships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."travel_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trips" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_context_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_hotel_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_patterns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_opportunity_tier"("confidence" integer, "urgency" integer, "risk" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_opportunity_tier"("confidence" integer, "urgency" integer, "risk" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_opportunity_tier"("confidence" integer, "urgency" integer, "risk" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_old_conversations"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_old_conversations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_old_conversations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_old_opportunities"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_old_opportunities"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_old_opportunities"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_task_idempotency_key"("p_user_id" "uuid", "p_message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_task_idempotency_key"("p_user_id" "uuid", "p_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_task_idempotency_key"("p_user_id" "uuid", "p_message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_task_with_ui_state"("p_task_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_task_with_ui_state"("p_task_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_task_with_ui_state"("p_task_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_profile_context"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_profile_context"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_profile_context"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."should_profile_exist"("profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."should_profile_exist"("profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."should_profile_exist"("profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_conversation_last_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_conversation_last_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_conversation_last_message"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_opportunities_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_opportunities_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_opportunities_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_potential_trips_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_potential_trips_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_potential_trips_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_patterns_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_patterns_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_patterns_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_profile_owner"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_profile_owner"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_profile_owner"() TO "service_role";



GRANT ALL ON TABLE "public"."activities" TO "anon";
GRANT ALL ON TABLE "public"."activities" TO "authenticated";
GRANT ALL ON TABLE "public"."activities" TO "service_role";



GRANT ALL ON TABLE "public"."api_credentials" TO "anon";
GRANT ALL ON TABLE "public"."api_credentials" TO "authenticated";
GRANT ALL ON TABLE "public"."api_credentials" TO "service_role";



GRANT ALL ON TABLE "public"."automations" TO "anon";
GRANT ALL ON TABLE "public"."automations" TO "authenticated";
GRANT ALL ON TABLE "public"."automations" TO "service_role";



GRANT ALL ON TABLE "public"."calendar_events" TO "anon";
GRANT ALL ON TABLE "public"."calendar_events" TO "authenticated";
GRANT ALL ON TABLE "public"."calendar_events" TO "service_role";



GRANT ALL ON TABLE "public"."channels" TO "anon";
GRANT ALL ON TABLE "public"."channels" TO "authenticated";
GRANT ALL ON TABLE "public"."channels" TO "service_role";



GRANT ALL ON TABLE "public"."concierge_conversations" TO "anon";
GRANT ALL ON TABLE "public"."concierge_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."concierge_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."concierge_messages" TO "anon";
GRANT ALL ON TABLE "public"."concierge_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."concierge_messages" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."daily_briefs" TO "anon";
GRANT ALL ON TABLE "public"."daily_briefs" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_briefs" TO "service_role";



GRANT ALL ON TABLE "public"."email_context" TO "anon";
GRANT ALL ON TABLE "public"."email_context" TO "authenticated";
GRANT ALL ON TABLE "public"."email_context" TO "service_role";



GRANT ALL ON TABLE "public"."emails" TO "anon";
GRANT ALL ON TABLE "public"."emails" TO "authenticated";
GRANT ALL ON TABLE "public"."emails" TO "service_role";



GRANT ALL ON TABLE "public"."entities" TO "anon";
GRANT ALL ON TABLE "public"."entities" TO "authenticated";
GRANT ALL ON TABLE "public"."entities" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."hotels" TO "anon";
GRANT ALL ON TABLE "public"."hotels" TO "authenticated";
GRANT ALL ON TABLE "public"."hotels" TO "service_role";



GRANT ALL ON TABLE "public"."integrations" TO "anon";
GRANT ALL ON TABLE "public"."integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."integrations" TO "service_role";



GRANT ALL ON TABLE "public"."members" TO "anon";
GRANT ALL ON TABLE "public"."members" TO "authenticated";
GRANT ALL ON TABLE "public"."members" TO "service_role";



GRANT ALL ON TABLE "public"."membership_changes" TO "anon";
GRANT ALL ON TABLE "public"."membership_changes" TO "authenticated";
GRANT ALL ON TABLE "public"."membership_changes" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."offers" TO "anon";
GRANT ALL ON TABLE "public"."offers" TO "authenticated";
GRANT ALL ON TABLE "public"."offers" TO "service_role";



GRANT ALL ON TABLE "public"."opportunities" TO "anon";
GRANT ALL ON TABLE "public"."opportunities" TO "authenticated";
GRANT ALL ON TABLE "public"."opportunities" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."orphaned_profiles_view" TO "anon";
GRANT ALL ON TABLE "public"."orphaned_profiles_view" TO "authenticated";
GRANT ALL ON TABLE "public"."orphaned_profiles_view" TO "service_role";



GRANT ALL ON TABLE "public"."perks" TO "anon";
GRANT ALL ON TABLE "public"."perks" TO "authenticated";
GRANT ALL ON TABLE "public"."perks" TO "service_role";



GRANT ALL ON TABLE "public"."potential_trips" TO "anon";
GRANT ALL ON TABLE "public"."potential_trips" TO "authenticated";
GRANT ALL ON TABLE "public"."potential_trips" TO "service_role";



GRANT ALL ON TABLE "public"."recommendation_events" TO "anon";
GRANT ALL ON TABLE "public"."recommendation_events" TO "authenticated";
GRANT ALL ON TABLE "public"."recommendation_events" TO "service_role";



GRANT ALL ON TABLE "public"."relationships" TO "anon";
GRANT ALL ON TABLE "public"."relationships" TO "authenticated";
GRANT ALL ON TABLE "public"."relationships" TO "service_role";



GRANT ALL ON TABLE "public"."requests" TO "anon";
GRANT ALL ON TABLE "public"."requests" TO "authenticated";
GRANT ALL ON TABLE "public"."requests" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON TABLE "public"."travel_requests" TO "anon";
GRANT ALL ON TABLE "public"."travel_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."travel_requests" TO "service_role";



GRANT ALL ON TABLE "public"."trips" TO "anon";
GRANT ALL ON TABLE "public"."trips" TO "authenticated";
GRANT ALL ON TABLE "public"."trips" TO "service_role";



GRANT ALL ON TABLE "public"."user_context_history" TO "anon";
GRANT ALL ON TABLE "public"."user_context_history" TO "authenticated";
GRANT ALL ON TABLE "public"."user_context_history" TO "service_role";



GRANT ALL ON TABLE "public"."user_hotel_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_hotel_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_hotel_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."user_patterns" TO "anon";
GRANT ALL ON TABLE "public"."user_patterns" TO "authenticated";
GRANT ALL ON TABLE "public"."user_patterns" TO "service_role";



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."valid_profiles" TO "anon";
GRANT ALL ON TABLE "public"."valid_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."valid_profiles" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






