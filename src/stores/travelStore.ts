import { create } from 'zustand';
import type { TravelIntent } from '../lib/travelParser';

export interface TravelMessage {
  id: string;
  conversation_id?: string;
  direction: 'in' | 'out';
  sent_by: 'user' | 'paige' | 'agent' | 'assistant';
  body: string;
  created_at: Date;
}

export interface TravelOffer {
  id: string;
  supplier_type: 'air' | 'hotel' | 'dining' | 'experience' | 'car';
  summary: string;
  terms: Record<string, any>;
  price_cents: number;
  currency: string;
  rank: number;
  selected: boolean;
  image_url?: string;
}

export interface TravelRequest {
  id: string;
  profile_id?: string;
  intent: string;
  raw_text: string;
  entities: TravelIntent;
  status: 'new' | 'collecting' | 'offered' | 'awaiting_approval' | 'booked' | 'failed' | 'canceled';
  results: TravelOffer[];
  front_conversation_id?: string;
  created_at: Date;
}

interface TravelStore {
  activeTravelRequest: TravelRequest | null;
  messages: TravelMessage[];
  chips: ChipData[];
  isSearching: boolean;
  conversationId: string | null;

  setActiveTravelRequest: (request: TravelRequest | null) => void;
  addMessage: (message: TravelMessage) => void;
  setMessages: (messages: TravelMessage[]) => void;
  updateIntent: (entities: Partial<TravelIntent>) => void;
  generateChips: () => void;
  updateChip: (chipId: string, value: any) => void;
  setSearching: (searching: boolean) => void;
  addResult: (offer: TravelOffer) => void;
  setResults: (offers: TravelOffer[]) => void;
  updateRequestStatus: (status: TravelRequest['status']) => void;
  setConversationId: (id: string | null) => void;
  reset: () => void;
}

export interface ChipData {
  id: string;
  label: string;
  value: string;
  type: 'flight' | 'hotel' | 'addon' | 'general';
  field: string;
  editable: boolean;
  options?: string[];
}

const useTravelStore = create<TravelStore>((set, get) => ({
  activeTravelRequest: null,
  messages: [],
  chips: [],
  isSearching: false,
  conversationId: null,

  setActiveTravelRequest: (request) => {
    set({ activeTravelRequest: request });
    if (request) {
      get().generateChips();
    }
  },

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  setMessages: (messages) => {
    set({ messages });
  },

  updateIntent: (entities) => {
    set((state) => {
      if (!state.activeTravelRequest) return state;

      return {
        activeTravelRequest: {
          ...state.activeTravelRequest,
          entities: {
            ...state.activeTravelRequest.entities,
            ...entities,
            flight: {
              ...state.activeTravelRequest.entities.flight,
              ...entities.flight,
            },
            hotel: {
              ...state.activeTravelRequest.entities.hotel,
              ...entities.hotel,
            },
            add_ons: {
              ...state.activeTravelRequest.entities.add_ons,
              ...entities.add_ons,
            },
          },
        },
      };
    });
    get().generateChips();
  },

  generateChips: () => {
    const request = get().activeTravelRequest;
    if (!request) {
      set({ chips: [] });
      return;
    }

    const chips: ChipData[] = [];
    const { entities } = request;

    if (entities.flight) {
      const { from, to, depart, return: ret, cabin, passengers, nonstop } = entities.flight;

      if (from && to) {
        chips.push({
          id: 'route',
          label: 'Route',
          value: `${from} → ${to}`,
          type: 'flight',
          field: 'route',
          editable: true,
        });
      }

      if (depart) {
        chips.push({
          id: 'depart',
          label: 'Departure',
          value: new Date(depart).toLocaleDateString(),
          type: 'flight',
          field: 'depart',
          editable: true,
        });
      }

      if (ret) {
        chips.push({
          id: 'return',
          label: 'Return',
          value: new Date(ret).toLocaleDateString(),
          type: 'flight',
          field: 'return',
          editable: true,
        });
      }

      if (cabin) {
        chips.push({
          id: 'cabin',
          label: 'Cabin',
          value: cabin,
          type: 'flight',
          field: 'cabin',
          editable: true,
          options: ['Economy', 'Premium Economy', 'Business', 'First'],
        });
      }

      if (passengers) {
        chips.push({
          id: 'passengers',
          label: 'Passengers',
          value: `${passengers} ${passengers === 1 ? 'passenger' : 'passengers'}`,
          type: 'flight',
          field: 'passengers',
          editable: true,
        });
      }

      if (nonstop !== undefined) {
        chips.push({
          id: 'nonstop',
          label: 'Flight Type',
          value: nonstop ? 'Nonstop only' : 'Any stops',
          type: 'flight',
          field: 'nonstop',
          editable: true,
          options: ['Nonstop only', 'Any stops'],
        });
      }
    }

    if (entities.hotel) {
      const { city, check_in, check_out, brand_prefs, budget_nightly_usd } = entities.hotel;

      if (city) {
        chips.push({
          id: 'city',
          label: 'City',
          value: city,
          type: 'hotel',
          field: 'city',
          editable: true,
        });
      }

      if (check_in) {
        chips.push({
          id: 'check_in',
          label: 'Check-in',
          value: new Date(check_in).toLocaleDateString(),
          type: 'hotel',
          field: 'check_in',
          editable: true,
        });
      }

      if (check_out) {
        chips.push({
          id: 'check_out',
          label: 'Check-out',
          value: new Date(check_out).toLocaleDateString(),
          type: 'hotel',
          field: 'check_out',
          editable: true,
        });
      }

      if (brand_prefs && brand_prefs.length > 0) {
        chips.push({
          id: 'brand',
          label: 'Brand',
          value: brand_prefs.join(', '),
          type: 'hotel',
          field: 'brand_prefs',
          editable: true,
        });
      }

      if (budget_nightly_usd) {
        chips.push({
          id: 'budget',
          label: 'Budget',
          value: `$${budget_nightly_usd}/night`,
          type: 'hotel',
          field: 'budget_nightly_usd',
          editable: true,
        });
      }
    }

    if (entities.add_ons) {
      const addOnsArray = Object.entries(entities.add_ons)
        .filter(([_, value]) => value)
        .map(([key]) => key.replace(/_/g, ' '));

      if (addOnsArray.length > 0) {
        chips.push({
          id: 'add_ons',
          label: 'Add-ons',
          value: addOnsArray.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', '),
          type: 'addon',
          field: 'add_ons',
          editable: false,
        });
      }
    }

    set({ chips });
  },

  updateChip: (chipId, value) => {
    const request = get().activeTravelRequest;
    if (!request) return;

    const chip = get().chips.find(c => c.id === chipId);
    if (!chip) return;

    const entities = { ...request.entities };

    if (chip.type === 'flight' && entities.flight) {
      if (chip.field === 'cabin') {
        entities.flight.cabin = value as any;
      } else if (chip.field === 'nonstop') {
        entities.flight.nonstop = value === 'Nonstop only';
      } else if (chip.field === 'passengers') {
        entities.flight.passengers = parseInt(value);
      }
    } else if (chip.type === 'hotel' && entities.hotel) {
      if (chip.field === 'budget_nightly_usd') {
        entities.hotel.budget_nightly_usd = parseInt(value);
      }
    }

    get().updateIntent(entities);
  },

  setSearching: (searching) => {
    set({ isSearching: searching });
  },

  addResult: (offer) => {
    set((state) => {
      if (!state.activeTravelRequest) return state;

      return {
        activeTravelRequest: {
          ...state.activeTravelRequest,
          results: [...state.activeTravelRequest.results, offer],
        },
      };
    });
  },

  setResults: (offers) => {
    set((state) => {
      if (!state.activeTravelRequest) return state;

      return {
        activeTravelRequest: {
          ...state.activeTravelRequest,
          results: offers,
        },
      };
    });
  },

  updateRequestStatus: (status) => {
    set((state) => {
      if (!state.activeTravelRequest) return state;

      return {
        activeTravelRequest: {
          ...state.activeTravelRequest,
          status,
        },
      };
    });
  },

  setConversationId: (id) => {
    set({ conversationId: id });
  },

  reset: () => {
    set({
      activeTravelRequest: null,
      messages: [],
      chips: [],
      isSearching: false,
      conversationId: null,
    });
  },
}));

export default useTravelStore;