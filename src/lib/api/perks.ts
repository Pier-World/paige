import { supabase } from '../supabase';
import { mockAllPerks, mockFeaturedPerks } from '../../mocks/perksData';
import type { Perk } from '../../types';

export async function getPerks(): Promise<Perk[]> {
  try {
    const { data, error } = await supabase
      .from('perks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching perks from database, falling back to mock data:', error);
      return mockAllPerks;
    }

    // If no data from database, return mock data
    if (!data || data.length === 0) {
      console.warn('No perks found in database, using mock data');
      return mockAllPerks;
    }

    return data as Perk[];
  } catch (error) {
    console.warn('Error in getPerks, falling back to mock data:', error);
    return mockAllPerks;
  }
}

export async function getFeaturedPerks(): Promise<Perk[]> {
  try {
    const { data, error } = await supabase
      .from('perks')
      .select('*')
      .eq('featured', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching featured perks from database, falling back to mock data:', error);
      return mockFeaturedPerks;
    }

    // If no data from database, return mock data
    if (!data || data.length === 0) {
      console.warn('No featured perks found in database, using mock data');
      return mockFeaturedPerks;
    }

    return data as Perk[];
  } catch (error) {
    console.warn('Error in getFeaturedPerks, falling back to mock data:', error);
    return mockFeaturedPerks;
  }
}

export async function getPerkById(id: string): Promise<Perk | null> {
  try {
    const { data, error } = await supabase
      .from('perks')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching perk by ID from database, falling back to mock data:', error);
      const mockPerk = mockAllPerks.find(perk => perk.id === id);
      return mockPerk || null;
    }

    // If no data from database, try mock data
    if (!data) {
      console.warn('No perk found in database, checking mock data');
      const mockPerk = mockAllPerks.find(perk => perk.id === id);
      return mockPerk || null;
    }

    return data as Perk;
  } catch (error) {
    console.warn('Error in getPerkById, falling back to mock data:', error);
    const mockPerk = mockAllPerks.find(perk => perk.id === id);
    return mockPerk || null;
  }
}

export async function getPerksByCategory(category: string): Promise<Perk[]> {
  try {
    const { data, error } = await supabase
      .from('perks')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching perks by category from database, falling back to mock data:', error);
      return mockAllPerks.filter(perk => perk.category === category);
    }

    // If no data from database, return mock data
    if (!data || data.length === 0) {
      console.warn('No perks found for category in database, using mock data');
      return mockAllPerks.filter(perk => perk.category === category);
    }

    return data as Perk[];
  } catch (error) {
    console.warn('Error in getPerksByCategory, falling back to mock data:', error);
    return mockAllPerks.filter(perk => perk.category === category);
  }
}