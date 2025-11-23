export interface OrchestratorRequest {
  userId: string;
  input: string;
  source: 'portal';
  context?: {
    page?: 'home' | 'perks';
    perkId?: string;
  };
  conversationId?: string;
}

export interface FlightOptionsModule {
  type: 'flight_options';
  headline: string;
  options: Array<{
    label: string;
    description?: string;
  }>;
}

export interface BonusModule {
  type: 'bonus_tip';
  text: string;
}

export interface SavingsModule {
  type: 'savings_badge';
  amountText: string;
}

export interface PerkRecommendationsModule {
  type: 'perk_recommendations';
  headline: string;
  perkIds: string[];
}

export interface HandoffModule {
  type: 'handoff_to_human';
  channel: 'whatsapp' | 'email';
  message: string;
}

export type Module =
  | FlightOptionsModule
  | BonusModule
  | SavingsModule
  | PerkRecommendationsModule
  | HandoffModule;

export interface OrchestratorMessage {
  role: 'assistant' | 'user';
  text: string;
  modules?: Module[];
}

export interface OrchestratorResponse {
  conversationId: string;
  messages: OrchestratorMessage[];
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  modules?: Module[];
  timestamp: Date;
}
