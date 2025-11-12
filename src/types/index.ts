export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'member' | 'admin';
  member_id: string;
  phone?: string;
  preferences?: UserPreferences;
  membership_level: 'Standard' | 'Premium' | 'Executive' | 'Founding Member';
  created_at: string;
  full_name?: string;
  front_user_hash?: string | null;
  membership_tier?: string;
}

export interface UserPreferences {
  preferred_cities?: string[];
  interests?: string[];
}

export interface Perk {
  id: string;
  title: string;
  description: string;
  short_description: string;
  partner_description: string;
  benefits: string[];
  image_url: string;
  category: 'dining' | 'hotels' | 'experiences' | 'lifestyle';
  city: string;
  tags: string[];
  featured: boolean;
  redemption_instructions?: string;
  external_link?: string;
  minimum_level?: 'Standard' | 'Premium' | 'Executive' | 'Founding Member';
}

export interface Event {
  id: string;
  title: string;
  description: string;
  short_description: string;
  image_url: string;
  date: string;
  time: string;
  location: string;
  city: string;
  tags: string[];
  featured: boolean;
  rsvp_instructions?: string;
  external_link?: string;
}

export interface Partner {
  id: string;
  name: string;
  description: string;
  image_url: string;
  category: 'dining' | 'hotels' | 'experiences' | 'lifestyle';
  location?: string;
  contact_info?: string;
  external_link?: string;
}