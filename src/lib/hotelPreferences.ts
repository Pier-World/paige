/**
 * Hotel Preferences Management
 * 
 * Helper functions for managing user hotel preferences
 * Used in onboarding and profile updates
 */

import { supabase } from './supabase';

export interface HotelPreferences {
  // Identity
  home_city?: string;
  typical_timezones?: string[];
  company?: string;
  role?: string;

  // Budget & Loyalty
  price_bands_by_city?: Record<string, [number, number]>;
  hard_budget_max?: number;
  deal_sensitivity?: number; // 1-5
  loyalty_programs?: Array<{
    program: string;
    status: string;
    priority: number;
  }>;
  preferred_brands?: string[];

  // Style & Vibe
  design_style_ranked?: string[];
  atmosphere_ranked?: string[];
  noise_tolerance?: number; // 1-5
  scene_tolerance?: number; // 1-5
  service_preference?: 'high-touch' | 'balanced' | 'leave-me-alone';

  // Location Priorities
  preferred_neighborhoods?: Record<string, string[]>;
  location_priority?: 'walkability' | 'transit' | 'quiet';
  max_commute_tolerance?: number;

  // Amenity Priorities
  gym_priority?: number; // 0-3
  spa_priority?: number; // 0-3
  pool_priority?: number; // 0-3
  food_drink_priority?: number; // 0-3
  wifi_priority?: number; // 0-3

  // Constraints
  must_have?: string[];
  hard_no?: string[];
  accessibility_needs?: string[];
  pet_traveling?: boolean;
}

/**
 * Get user hotel preferences
 */
export async function getUserHotelPreferences(
  userId: string
): Promise<HotelPreferences | null> {
  const { data, error } = await supabase
    .from('user_hotel_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No preferences found, return null
      return null;
    }
    throw error;
  }

  return data;
}

/**
 * Create or update user hotel preferences
 */
export async function upsertUserHotelPreferences(
  userId: string,
  preferences: Partial<HotelPreferences>
): Promise<HotelPreferences> {
  const { data, error } = await supabase
    .from('user_hotel_preferences')
    .upsert({
      user_id: userId,
      ...preferences,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update specific preference fields
 */
export async function updateHotelPreferences(
  userId: string,
  updates: Partial<HotelPreferences>
): Promise<HotelPreferences> {
  const { data, error } = await supabase
    .from('user_hotel_preferences')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    // If record doesn't exist, create it
    if (error.code === 'PGRST116') {
      return upsertUserHotelPreferences(userId, updates);
    }
    throw error;
  }

  return data;
}

/**
 * Add a preferred brand
 */
export async function addPreferredBrand(
  userId: string,
  brand: string
): Promise<void> {
  const preferences = await getUserHotelPreferences(userId);
  const currentBrands = preferences?.preferred_brands || [];
  
  if (!currentBrands.includes(brand)) {
    await updateHotelPreferences(userId, {
      preferred_brands: [...currentBrands, brand],
    });
  }
}

/**
 * Set price band for a city
 */
export async function setPriceBandForCity(
  userId: string,
  city: string,
  min: number,
  max: number
): Promise<void> {
  const preferences = await getUserHotelPreferences(userId);
  const currentBands = preferences?.price_bands_by_city || {};
  
  await updateHotelPreferences(userId, {
    price_bands_by_city: {
      ...currentBands,
      [city]: [min, max],
    },
  });
}

/**
 * Add a must-have requirement
 */
export async function addMustHave(
  userId: string,
  requirement: string
): Promise<void> {
  const preferences = await getUserHotelPreferences(userId);
  const currentMustHaves = preferences?.must_have || [];
  
  if (!currentMustHaves.includes(requirement)) {
    await updateHotelPreferences(userId, {
      must_have: [...currentMustHaves, requirement],
    });
  }
}

/**
 * Add a hard-no (dealbreaker)
 */
export async function addHardNo(
  userId: string,
  dealbreaker: string
): Promise<void> {
  const preferences = await getUserHotelPreferences(userId);
  const currentHardNos = preferences?.hard_no || [];
  
  if (!currentHardNos.includes(dealbreaker)) {
    await updateHotelPreferences(userId, {
      hard_no: [...currentHardNos, dealbreaker],
    });
  }
}

/**
 * Get default preferences for onboarding
 */
export function getDefaultPreferences(): Partial<HotelPreferences> {
  return {
    deal_sensitivity: 3, // Balanced
    noise_tolerance: 3, // Moderate
    scene_tolerance: 3, // Moderate
    service_preference: 'balanced',
    gym_priority: 1,
    spa_priority: 1,
    pool_priority: 1,
    food_drink_priority: 2,
    wifi_priority: 3, // High priority for WiFi
    must_have: [],
    hard_no: [],
    preferred_brands: [],
    design_style_ranked: [],
    atmosphere_ranked: [],
  };
}

