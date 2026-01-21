import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PageLayout } from '../components/layout/PageLayout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Sparkles, Building, Plane, UtensilsCrossed,
  Wine, Heart, Briefcase, Users, Calendar, Star, DollarSign,
  Clock, Filter, CheckCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PreferenceCategory {
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  preferences: Array<{
    label: string;
    value: any;
    source: string;
    updatedAt?: string;
  }>;
}

export function AllPreferencesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<PreferenceCategory[]>([]);

  useEffect(() => {
    if (user) {
      loadAllPreferences();
    } else {
      setLoading(false);
    }
  }, [user]);

  async function loadAllPreferences() {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch all preference sources in parallel
      const [profileData, hotelPrefs, travelPrefs, contextHistory] = await Promise.all([
        // Profile data - use SELECT * to avoid 406 errors if columns don't exist
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle(),
        
        // Hotel preferences
        supabase
          .from('user_hotel_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        
        // Travel preferences
        supabase
          .from('user_preferences')
          .select('*')
          .eq('profile_id', user.id)
          .maybeSingle(),
        
        // Context history (preferences learned over time)
        supabase
          .from('user_context_history')
          .select('*')
          .eq('profile_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      const allCategories: PreferenceCategory[] = [];

      // 1. Travel & Location Preferences
      const travelPrefsList: PreferenceCategory['preferences'] = [];
      
      // Preferred cities from personal_context
      if (profileData.data?.personal_context?.preferred_cities) {
        profileData.data.personal_context.preferred_cities.forEach((city: string) => {
          travelPrefsList.push({
            label: city,
            value: city,
            source: 'Profile',
            updatedAt: profileData.data?.updated_at,
          });
        });
      }

      // Home city from hotel preferences
      if (hotelPrefs.data?.home_city) {
        travelPrefsList.push({
          label: `Home City: ${hotelPrefs.data.home_city}`,
          value: hotelPrefs.data.home_city,
          source: 'Hotel Preferences',
        });
      }

      // Preferred neighborhoods
      if (hotelPrefs.data?.preferred_neighborhoods) {
        Object.entries(hotelPrefs.data.preferred_neighborhoods).forEach(([city, neighborhoods]) => {
          if (Array.isArray(neighborhoods)) {
            neighborhoods.forEach((neighborhood: string) => {
              travelPrefsList.push({
                label: `${neighborhood}, ${city}`,
                value: neighborhood,
                source: 'Hotel Preferences',
              });
            });
          }
        });
      }

      if (travelPrefsList.length > 0) {
        allCategories.push({
          name: 'Travel & Location',
          icon: MapPin,
          preferences: travelPrefsList,
        });
      }

      // 2. Interests
      if (profileData.data?.personal_context?.interests?.length > 0) {
        allCategories.push({
          name: 'Interests',
          icon: Sparkles,
          preferences: profileData.data.personal_context.interests.map((interest: string) => ({
            label: interest,
            value: interest,
            source: 'Profile',
            updatedAt: profileData.data?.updated_at,
          })),
        });
      }

      // 3. Hotel Preferences
      const hotelPrefsList: PreferenceCategory['preferences'] = [];

      if (hotelPrefs.data) {
        // Preferred brands
        if (hotelPrefs.data.preferred_brands?.length > 0) {
          hotelPrefs.data.preferred_brands.forEach((brand: string) => {
            hotelPrefsList.push({
              label: brand,
              value: brand,
              source: 'Hotel Preferences',
            });
          });
        }

        // Design style
        if (hotelPrefs.data.design_style_ranked?.length > 0) {
          hotelPrefs.data.design_style_ranked.forEach((style: string) => {
            hotelPrefsList.push({
              label: `Design: ${style}`,
              value: style,
              source: 'Hotel Preferences',
            });
          });
        }

        // Atmosphere
        if (hotelPrefs.data.atmosphere_ranked?.length > 0) {
          hotelPrefs.data.atmosphere_ranked.forEach((atmosphere: string) => {
            hotelPrefsList.push({
              label: `Atmosphere: ${atmosphere}`,
              value: atmosphere,
              source: 'Hotel Preferences',
            });
          });
        }

        // Service preference
        if (hotelPrefs.data.service_preference) {
          hotelPrefsList.push({
            label: `Service: ${hotelPrefs.data.service_preference}`,
            value: hotelPrefs.data.service_preference,
            source: 'Hotel Preferences',
          });
        }

        // Must haves
        if (hotelPrefs.data.must_have?.length > 0) {
          hotelPrefs.data.must_have.forEach((item: string) => {
            hotelPrefsList.push({
              label: `Must Have: ${item}`,
              value: item,
              source: 'Hotel Preferences',
            });
          });
        }

        // Hard nos
        if (hotelPrefs.data.hard_no?.length > 0) {
          hotelPrefs.data.hard_no.forEach((item: string) => {
            hotelPrefsList.push({
              label: `Avoid: ${item}`,
              value: item,
              source: 'Hotel Preferences',
            });
          });
        }
      }

      if (hotelPrefsList.length > 0) {
        allCategories.push({
          name: 'Hotel',
          icon: Building,
          preferences: hotelPrefsList,
        });
      }

      // 4. Dining Preferences
      const diningPrefsList: PreferenceCategory['preferences'] = [];

      if (travelPrefs.data?.travel_preferences?.dining) {
        const dining = travelPrefs.data.travel_preferences.dining;
        
        if (dining.cuisine_preferences?.length > 0) {
          dining.cuisine_preferences.forEach((cuisine: string) => {
            diningPrefsList.push({
              label: cuisine,
              value: cuisine,
              source: 'Travel Preferences',
            });
          });
        }

        if (dining.dining_style?.length > 0) {
          dining.dining_style.forEach((style: string) => {
            diningPrefsList.push({
              label: `Style: ${style}`,
              value: style,
              source: 'Travel Preferences',
            });
          });
        }

        if (dining.price_range) {
          diningPrefsList.push({
            label: `Price Range: ${dining.price_range}`,
            value: dining.price_range,
            source: 'Travel Preferences',
          });
        }
      }

      if (diningPrefsList.length > 0) {
        allCategories.push({
          name: 'Dining',
          icon: UtensilsCrossed,
          preferences: diningPrefsList,
        });
      }

      // 5. Lifestyle Preferences
      const lifestylePrefsList: PreferenceCategory['preferences'] = [];

      // Extract from context history
      if (contextHistory.data) {
        contextHistory.data
          .filter(item => item.context_type === 'preference_learned' || item.context_type === 'interest_expressed')
          .forEach(item => {
            const data = item.context_data || {};
            if (data.interest || data.preference) {
              lifestylePrefsList.push({
                label: data.interest || data.preference || 'Learned preference',
                value: data.interest || data.preference,
                source: 'AI Learned',
                updatedAt: item.created_at,
              });
            }
          });
      }

      if (lifestylePrefsList.length > 0) {
        allCategories.push({
          name: 'Lifestyle',
          icon: Wine,
          preferences: lifestylePrefsList,
        });
      }

      // 6. Family Preferences
      const familyPrefsList: PreferenceCategory['preferences'] = [];

      if (hotelPrefs.data?.good_for_families) {
        familyPrefsList.push({
          label: 'Family-friendly hotels preferred',
          value: true,
          source: 'Hotel Preferences',
        });
      }

      if (familyPrefsList.length > 0) {
        allCategories.push({
          name: 'Family',
          icon: Users,
          preferences: familyPrefsList,
        });
      }

      // 7. Budget Preferences
      const budgetPrefsList: PreferenceCategory['preferences'] = [];

      if (hotelPrefs.data?.hard_budget_max) {
        budgetPrefsList.push({
          label: `Max Budget: $${hotelPrefs.data.hard_budget_max}/night`,
          value: hotelPrefs.data.hard_budget_max,
          source: 'Hotel Preferences',
        });
      }

      if (hotelPrefs.data?.price_bands_by_city) {
        Object.entries(hotelPrefs.data.price_bands_by_city).forEach(([city, range]) => {
          if (Array.isArray(range) && range.length === 2) {
            budgetPrefsList.push({
              label: `${city}: $${range[0]}-$${range[1]}/night`,
              value: range,
              source: 'Hotel Preferences',
            });
          }
        });
      }

      if (travelPrefs.data?.budget_ranges) {
        const budgets = travelPrefs.data.budget_ranges;
        if (budgets.hotel) {
          budgetPrefsList.push({
            label: `Hotel Budget: $${budgets.hotel.per_night_min || 0}-$${budgets.hotel.per_night_max || 'unlimited'}/night`,
            value: budgets.hotel,
            source: 'Travel Preferences',
          });
        }
      }

      if (budgetPrefsList.length > 0) {
        allCategories.push({
          name: 'Budget',
          icon: DollarSign,
          preferences: budgetPrefsList,
        });
      }

      setCategories(allCategories);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-background pt-24 pb-20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-background pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-4"
            >
              <ArrowLeft size={18} />
              <span style={{ fontSize: '14px', fontWeight: 400 }}>Back to Profile</span>
            </button>
            <h1 style={{ fontSize: '36px', fontWeight: 300, letterSpacing: '-0.02em' }} className="text-text-primary mb-2">
              All Preferences
            </h1>
            <p className="text-text-secondary" style={{ fontSize: '16px', fontWeight: 300 }}>
              Complete view of all preferences we've recorded for you
            </p>
          </div>

          {/* Categories */}
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-tertiary mb-4" style={{ fontSize: '16px', fontWeight: 300 }}>
                No preferences recorded yet
              </p>
              <button
                onClick={() => navigate('/profile')}
                className="px-6 py-2.5 rounded-lg bg-accent hover:bg-[#d4c4a6] text-background transition-all"
                style={{ fontSize: '14px', fontWeight: 400 }}
              >
                Add Preferences
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {categories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <motion.div
                    key={category.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="rounded-2xl bg-surface border border-border p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-accent/10">
                        <Icon size={20} className="text-accent" />
                      </div>
                      <h2 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary">
                        {category.name}
                      </h2>
                      <span className="ml-auto px-2.5 py-1 rounded-full bg-surface-elevated text-text-tertiary text-xs">
                        {category.preferences.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {category.preferences.map((pref, prefIndex) => (
                        <div
                          key={`${category.name}-${prefIndex}`}
                          className="flex items-center gap-2 p-3 rounded-lg bg-surface-elevated border border-border"
                        >
                          <CheckCircle size={16} className="text-accent flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-text-primary truncate" style={{ fontSize: '14px', fontWeight: 400 }}>
                              {pref.label}
                            </p>
                            <p className="text-text-tertiary text-xs">{pref.source}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

export default AllPreferencesPage;

