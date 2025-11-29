// Shared types for Edge Functions

export interface GmailMessage {
  id: string;
  threadId: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: {
      data?: string;
    };
  };
}

export interface TravelConfirmation {
  confirmation_number?: string;
  airline?: string;
  hotel?: string;
  flight_number?: string;
  from?: string;
  to?: string;
  destination?: string;
  departure?: string;
  arrival?: string;
  check_in?: string;
  check_out?: string;
}

export interface EmailCategory {
  category: 'travel_confirmation' | 'receipt' | 'other';
  extracted_data?: TravelConfirmation;
}

export interface CalendarEventInput {
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
  all_day?: boolean;
  time_zone?: string;
}

export interface Intent {
  type: 'travel' | 'scheduling' | 'loyalty' | 'other';
  confidence: number;
  parameters?: Record<string, any>;
}

export interface AgentResult {
  success: boolean;
  data?: any;
  requires_human?: boolean;
  confidence?: number;
  message?: string;
}

