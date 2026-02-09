import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import { OnboardingData } from '../../../types/onboarding';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Force a page reload to refresh auth context
const reloadPage = () => {
  window.location.href = '/';
};

interface FinalStepProps {
  data: OnboardingData;
  onBack: () => void;
}

export function FinalStep({ data, onBack }: FinalStepProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleComplete = async () => {
    if (!user?.id) return;
    
    setIsCompleting(true);
    
    try {
      // Prepare profile data - MUST include id for upsert
      const profileData: any = {
        id: user.id, // Required for upsert to work
        personal_context: {
          name: data.name,
          goals: data.goals,
          memberships: data.memberships,
          travel_preferences: {
            style: data.preferences.travelStyle,
            interests: data.preferences.interests,
          },
        },
        onboarding_completed: true,
      };

      // Use UPSERT to create profile if it doesn't exist, or update if it does
      // This is critical - .update() silently succeeds with 0 rows if profile doesn't exist
      console.log('Saving onboarding data with upsert for user:', user.id);
      
      // Try with all fields first, then fall back if columns don't exist
      let profileSaved = false;
      
      // Attempt 1: Try with onboarding_completed and personal_context
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (profileError) {
        console.warn('First upsert attempt failed:', profileError.message);
        
        // Attempt 2: Try with just personal_context (maybe onboarding_completed doesn't exist)
        const { error: retryError1 } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            personal_context: profileData.personal_context,
          }, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          });
        
        if (retryError1) {
          console.warn('Second upsert attempt failed:', retryError1.message);
          
          // Attempt 3: Try with just the ID (maybe personal_context column doesn't exist either)
          const { error: retryError2 } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
            }, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            });
          
          if (retryError2) {
            console.error('All profile upsert attempts failed:', retryError2);
            // Don't block onboarding completion - the user data will be in members table
          } else {
            console.log('Profile created with just ID');
            profileSaved = true;
          }
        } else {
          console.log('Profile saved with personal_context (no onboarding_completed column)');
          profileSaved = true;
        }
      } else {
        console.log('Profile upsert successful with all fields');
        profileSaved = true;
      }
      
      if (!profileSaved) {
        console.warn('Could not save to profiles table, but continuing with onboarding completion');
      }

      // Map onboarding interests (IDs from PreferencesStep) to labels and merge with any existing from admin
      const onboardingInterests = [
        ...data.preferences.interests,
        ...data.goals.map((goal: string) => {
          const goalMap: Record<string, string> = {
            'maximize-points': 'Points Maximization',
            'travel-optimization': 'Travel',
            'track-benefits': 'Travel',
            'discover-opportunities': 'Travel',
            'redeem-rewards': 'Travel',
          };
          return goalMap[goal] || 'Travel';
        }),
      ];
      const idToLabel: Record<string, string> = {
        'points-maximization': 'Points Maximization',
        'lounge-access': 'Lounge Access',
        'status-matching': 'Status Matching',
        'elite-perks': 'Elite Status Perks',
        'concierge': 'Concierge Services',
        'Travel': 'Travel',
      };
      const onboardingAsLabels = onboardingInterests.map(
        (id: string) => idToLabel[id] || id
      );

      // Fetch existing member preferences so we don't overwrite admin-selected interests
      const { data: existingMember } = await supabase
        .from('members')
        .select('preferences')
        .eq('id', user.id)
        .maybeSingle();

      const existingInterests: string[] = Array.isArray(
        (existingMember?.preferences as { interests?: string[] })?.interests
      )
        ? (existingMember!.preferences as { interests: string[] }).interests
        : [];
      const mergedInterests = Array.from(
        new Set([...existingInterests, ...onboardingAsLabels])
      );

      // Update members: preferences (merged interests) and onboarding_completed
      const memberUpdate: { preferences: { interests: string[]; preferred_cities: string[] }; onboarding_completed?: boolean } = {
        preferences: {
          interests: mergedInterests,
          preferred_cities: (existingMember?.preferences as { preferred_cities?: string[] })?.preferred_cities ?? [],
        },
      };
      // Set onboarding_completed on members if column exists (denormalized for reliable routing)
      memberUpdate.onboarding_completed = true;

      const { error: memberError } = await supabase
        .from('members')
        .update(memberUpdate)
        .eq('id', user.id);

      if (memberError) {
        console.warn('Error updating members (non-critical):', memberError);
        // Try without onboarding_completed in case column doesn't exist yet
        const { error: memberError2 } = await supabase
          .from('members')
          .update({ preferences: memberUpdate.preferences })
          .eq('id', user.id);
        if (memberError2) {
          console.warn('Members preferences update failed:', memberError2);
        }
      }

      // Extract hotel brands and airlines from memberships
      const hotelBrands = data.memberships
        .map(m => {
          const brandMap: Record<string, string> = {
            'marriott-bonvoy': 'Marriott',
            'hilton-honors': 'Hilton',
          };
          return brandMap[m] || null;
        })
        .filter(Boolean) as string[];

      const airlines = data.memberships
        .map(m => {
          const airlineMap: Record<string, string> = {
            'delta-skymiles': 'Delta',
            'united-mileageplus': 'United',
          };
          return airlineMap[m] || null;
        })
        .filter(Boolean) as string[];

      // Map travel styles to design/atmosphere preferences
      const designStyles: string[] = [];
      const atmospheres: string[] = [];
      
      if (data.preferences.travelStyle.includes('luxury')) {
        designStyles.push('luxury', 'classic');
        atmospheres.push('refined', 'elegant');
      }
      if (data.preferences.travelStyle.includes('adventure')) {
        atmospheres.push('energetic', 'vibrant');
      }
      if (data.preferences.travelStyle.includes('beach')) {
        designStyles.push('modern', 'tropical');
        atmospheres.push('relaxed', 'casual');
      }
      if (data.preferences.travelStyle.includes('city')) {
        designStyles.push('modern', 'contemporary');
        atmospheres.push('urban', 'sophisticated');
      }
      if (data.preferences.travelStyle.includes('foodie')) {
        atmospheres.push('social', 'culinary');
      }
      if (data.preferences.travelStyle.includes('cultural')) {
        atmospheres.push('authentic', 'immersive');
      }

      // Update or create user_preferences table with travel preferences
      const travelPreferencesData = {
        travel_preferences: {
          hotel: {
            preferred_brands: hotelBrands,
            amenities: [],
            room_type: 'standard',
            location_preference: 'central',
          },
          dining: {
            cuisine_preferences: [],
            dining_style: data.preferences.travelStyle.includes('foodie') 
              ? ['fine_dining', 'local'] 
              : ['local'],
            price_range: 'moderate',
          },
          flight: {
            preferred_airlines: airlines,
            seat_preference: 'window',
            cabin_class: 'economy',
            nonstop_preferred: true,
          },
        },
      };

      // Check if user_preferences exists
      const { data: existingPrefs } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (existingPrefs) {
        // Update existing preferences
        const { error: prefsError } = await supabase
          .from('user_preferences')
          .update(travelPreferencesData)
          .eq('profile_id', user.id);

        if (prefsError) {
          console.warn('Error updating user_preferences (non-critical):', prefsError);
        }
      } else {
        // Create new preferences
        const { error: prefsError } = await supabase
          .from('user_preferences')
          .insert({
            profile_id: user.id,
            ...travelPreferencesData,
          });

        if (prefsError) {
          console.warn('Error creating user_preferences (non-critical):', prefsError);
        }
      }

      // Update or create user_hotel_preferences (used by recommendation system)
      const hotelPreferencesData: any = {
        preferred_brands: hotelBrands,
        design_style_ranked: designStyles.length > 0 ? designStyles : [],
        atmosphere_ranked: atmospheres.length > 0 ? atmospheres : [],
        loyalty_programs: data.memberships
          .filter(m => ['marriott-bonvoy', 'hilton-honors'].includes(m))
          .map(m => ({
            program: m === 'marriott-bonvoy' ? 'Marriott Bonvoy' : 'Hilton Honors',
            status: 'member',
            priority: 1,
          })),
      };

      // Check if user_hotel_preferences exists
      const { data: existingHotelPrefs } = await supabase
        .from('user_hotel_preferences')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingHotelPrefs) {
        // Update existing hotel preferences
        const { error: hotelPrefsError } = await supabase
          .from('user_hotel_preferences')
          .update(hotelPreferencesData)
          .eq('user_id', user.id);

        if (hotelPrefsError) {
          console.warn('Error updating user_hotel_preferences (non-critical):', hotelPrefsError);
        }
      } else {
        // Create new hotel preferences
        const { error: hotelPrefsError } = await supabase
          .from('user_hotel_preferences')
          .insert({
            user_id: user.id,
            ...hotelPreferencesData,
          });

        if (hotelPrefsError) {
          console.warn('Error creating user_hotel_preferences (non-critical):', hotelPrefsError);
        }
      }

      // Simulate a brief loading state, then reload to refresh auth context
      setTimeout(() => {
        reloadPage();
      }, 1500);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setIsCompleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6">
      {!isCompleting ? (
        <div className="min-h-screen flex flex-col justify-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="space-y-16"
          >
            {/* Header */}
            <div className="space-y-8">
              <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                006
              </div>
              
              <h2 className="text-[28px] md:text-[32px] leading-[1.2] tracking-[-0.02em] text-foreground font-light">
                Configuration complete
              </h2>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-3 gap-8 py-8 border-t border-b border-border">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="space-y-2"
              >
                <div className="text-[32px] font-light text-foreground">
                  {data.goals.length}
                </div>
                <div className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
                  Goals
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="space-y-2"
              >
                <div className="text-[32px] font-light text-foreground">
                  {data.memberships.length}
                </div>
                <div className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
                  Cards
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="space-y-2"
              >
                <div className="text-[32px] font-light text-foreground">
                  {data.preferences.travelStyle.length + data.preferences.interests.length}
                </div>
                <div className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
                  Prefs
                </div>
              </motion.div>
            </div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="space-y-3"
            >
              {[
                'Personalized benefit tracking',
                'Smart recommendations',
                'Real-time alerts',
                'Optimized redemptions',
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.08, duration: 0.4 }}
                  className="flex items-center gap-3 py-2 text-[14px] text-foreground/70 font-light"
                >
                  <div className="w-1 h-1 bg-foreground/40" />
                  {feature}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="fixed bottom-12 left-6 right-6 flex items-center justify-between"
          >
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground hover:text-foreground h-9 px-0"
            >
              Back
            </Button>
            
            <Button
              onClick={handleComplete}
              size="sm"
              className="bg-foreground text-background hover:bg-foreground/90 h-9 px-8 dark:bg-foreground dark:text-background"
            >
              <span className="text-[10px] tracking-[0.25em] uppercase font-medium">
                Enter
              </span>
            </Button>
          </motion.div>
        </div>
      ) : (
        /* Completion State */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="min-h-screen flex flex-col items-center justify-center text-center space-y-8"
        >
          <motion.div
            animate={{ 
              opacity: [0.3, 1, 0.3],
            }}
            transition={{ 
              duration: 2,
              ease: "easeInOut",
              repeat: Infinity,
            }}
            className="space-y-6"
          >
            <div className="h-[1px] w-16 bg-foreground mx-auto" />
            <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              Loading
            </p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

