/**
 * TypeScript interfaces for email parser Edge Function
 */

/**
 * Email from the database that needs processing
 */
export interface EmailToProcess {
  id: string;
  user_id: string;
  gmail_message_id: string;
  subject: string | null;
  from_address: string | null;
  body_preview: string | null;
  received_at: string;
  category?: string | null;
  extracted_data?: any; // Data from gmail-sync classification
}

/**
 * Extracted booking data from GPT-4
 */
export interface ExtractedBooking {
  type: 'flight' | 'hotel' | 'car' | 'event' | 'restaurant' | 'unknown';
  confidence: number; // 0-100
  confirmation_code: string | null;
  dates: {
    start: string | null; // YYYY-MM-DD
    end: string | null; // YYYY-MM-DD
  };
  location: {
    city: string | null;
    state: string | null;
    country: string | null;
    airport_code: string | null; // flights only
    address: string | null; // hotels only
  };
  cost: {
    amount: number | null;
    currency: string | null;
  };
  details: {
    airline?: string;
    flight_number?: string;
    hotel_name?: string;
    passenger_name?: string;
    guest_name?: string;
    event_name?: string;
    [key: string]: any;
  };
}

/**
 * Result of the entire parse operation
 */
export interface ParseResult {
  success: boolean;
  emails_processed: number;
  bookings_found: number;
  trips_created: number;
  trips_updated: number;
  errors: Array<{ email_id: string; error: string }>;
  execution_time_ms: number;
}

