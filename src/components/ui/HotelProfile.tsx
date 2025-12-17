import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Star, Sparkles, Check, X, Heart, Share2, ArrowLeft, Calendar,
  VolumeX, Briefcase, History
} from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

// Types
interface HotelData {
  id: string;
  name: string;
  brand_group?: string;
  address: string;
  neighborhood: string;
  primary_city: string;
  star_rating?: number;
  quality_score_internal?: number;
  room_count?: number;
  opening_year?: number;
  last_renovated_year?: number;
  rate_low?: number;
  rate_mid?: number;
  rate_high?: number;
  check_in_time?: string;
  check_out_time?: string;
  
  // Location
  walkability_score_internal?: number;
  transit_access?: string;
  airport_distance_minutes?: number;
  near_key_areas?: string[];
  business_cluster_proximity?: string[];
  
  // Atmosphere
  design_style?: string[];
  atmosphere?: string[];
  guest_mix?: string[];
  noise_level?: number;
  scene_level?: number;
  
  // Service
  service_style?: string;
  staff_kindness_score?: number;
  checkin_flexibility_score?: number;
  late_checkout_friendliness?: number;
  discretion_score?: number;
  concierge_quality?: number;
  problem_resolution?: string;
  
  // Amenities
  gym_quality?: number;
  spa_quality?: number;
  pool_type?: string;
  food_drink_quality?: string;
  bar_scene?: string;
  wifi_quality?: number;
  desk_in_room?: boolean;
  coworking_space?: boolean;
  meeting_rooms?: boolean;
  pet_friendly?: boolean;
  power_outlets?: string;
  creator_friendly?: boolean;
  startup_friendly?: boolean;
  
  // Use cases
  good_for_solo_work?: boolean;
  good_for_couples?: boolean;
  good_for_families?: boolean;
  good_for_long_stays?: boolean;
  good_for_offsites?: boolean;
  good_for_board_meetings?: boolean;
  
  // Pier
  pier_perk_level?: string;
  pier_benefits?: string[];
  booking_partners?: string[];
  notes_curated?: string;
  best_known_for?: string;
  
  // Images
  image_hero?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  location?: string;
  description?: string;
}

interface PersonalizedReason {
  icon: 'calendar' | 'quiet' | 'work' | 'history';
  headline: string;
  detail: string;
  confidence: number;
}

interface HotelProfileProps {
  hotelId: string;
  hotelData?: Partial<HotelData>;
  parsedDates?: string;
  onClose: () => void;
  onBookWithConcierge: () => void;
}

export function HotelProfile({ 
  hotelId, 
  hotelData: initialHotelData,
  parsedDates,
  onClose,
  onBookWithConcierge 
}: HotelProfileProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'experience' | 'amenities' | 'location'>('overview');
  const [hotel, setHotel] = useState<HotelData | null>(initialHotelData as HotelData | null);
  const [loading, setLoading] = useState(!initialHotelData);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [personalizedReasons, setPersonalizedReasons] = useState<PersonalizedReason[]>([]);
  const [showAllReasons, setShowAllReasons] = useState(false);
  const [showAllMeetings, setShowAllMeetings] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Fetch full hotel data
  useEffect(() => {
    if (initialHotelData && initialHotelData.id) {
      setHotel(initialHotelData as HotelData);
      setLoading(false);
      return;
    }
    
    if (!hotelId) {
      setLoading(false);
      return;
    }
    
    const fetchHotel = async () => {
      try {
        const { data, error } = await supabase
          .from('hotels')
          .select('*')
          .eq('id', hotelId)
          .single();
        
        if (error) throw error;
        if (data) {
          setHotel(data as HotelData);
        }
      } catch (error) {
        console.error('Error fetching hotel:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHotel();
  }, [hotelId, initialHotelData]);

  // Fetch calendar events for personalization
  useEffect(() => {
    if (!user || !hotel) return;
    
    const fetchCalendarEvents = async () => {
      try {
        const now = new Date();
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        const { data, error } = await supabase
          .from('calendar_events')
          .select('*')
          .eq('user_id', user.id)
          .gte('start_time', now.toISOString())
          .lte('start_time', nextWeek.toISOString())
          .order('start_time', { ascending: true })
          .limit(10);
        
        if (!error && data) {
          setCalendarEvents(data as CalendarEvent[]);
          generatePersonalizedReasons(data as CalendarEvent[]);
        }
      } catch (error) {
        console.error('Error fetching calendar events:', error);
      }
    };
    
    fetchCalendarEvents();
  }, [user, hotel]);

  // Generate personalized reasons
  const generatePersonalizedReasons = (events: CalendarEvent[]) => {
    if (!hotel) return;
    
    const reasons: PersonalizedReason[] = [];
    
    // Check for nearby meetings
    if (events.length > 0 && hotel.neighborhood) {
      const nearbyEvents = events.filter(e => 
        e.location && e.location.toLowerCase().includes(hotel.neighborhood?.toLowerCase() || '')
      );
      
      if (nearbyEvents.length > 0) {
        const event = nearbyEvents[0];
        const eventDate = new Date(event.start_time);
        const timeStr = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        const dateStr = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        reasons.push({
          icon: 'calendar',
          headline: `Close to your ${timeStr} meeting`,
          detail: `${event.title} on ${dateStr} is nearby.`,
          confidence: 0.9,
        });
      }
    }
    
    // Check noise preference
    if (hotel.noise_level && hotel.noise_level <= 2) {
      reasons.push({
        icon: 'quiet',
        headline: 'Quiet rooms available',
        detail: 'Interior courtyard rooms match your preference for quiet spaces.',
        confidence: 0.85,
      });
    }
    
    // Check work amenities
    if (hotel.good_for_solo_work || (hotel.wifi_quality && hotel.wifi_quality >= 4 && hotel.desk_in_room)) {
      reasons.push({
        icon: 'work',
        headline: 'Optimized for work trips',
        detail: 'In-room desk, fast WiFi, and work-friendly spaces.',
        confidence: 0.88,
      });
    }
    
    // Check if matches previous preferences (would need hotel history)
    if (hotel.quality_score_internal && hotel.quality_score_internal >= 90) {
      reasons.push({
        icon: 'history',
        headline: 'Matches your hotel preferences',
        detail: 'High Pier Score indicates alignment with your travel style.',
        confidence: 0.82,
      });
    }
    
    setPersonalizedReasons(reasons);
  };

  if (loading || !hotel) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="text-text-primary">Loading hotel details...</div>
      </div>
    );
  }

  const imageUrl = hotel.image_hero || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';
  const rateDisplay = hotel.rate_mid 
    ? `$${hotel.rate_mid}` 
    : hotel.rate_low 
    ? `Starting at $${hotel.rate_low}`
    : 'Rate on request';
  
  const visibleReasons = showAllReasons ? personalizedReasons : personalizedReasons.slice(0, 2);
  const visibleMeetings = showAllMeetings ? calendarEvents : calendarEvents.slice(0, 2);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[100] overflow-y-auto pointer-events-none">
        <div className="min-h-screen px-4 py-8 flex items-start justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[430px] rounded-2xl bg-background border border-border shadow-2xl overflow-hidden my-8 pointer-events-auto"
          >
            {/* Hero Section */}
            <div className="relative h-[280px]">
              <ImageWithFallback
                src={imageUrl}
                alt={hotel.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
              
              {/* Back Button */}
              <button
                onClick={onClose}
                className="absolute top-4 left-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background transition-colors flex items-center justify-center"
              >
                <ArrowLeft size={18} className="text-text-primary" />
              </button>
              
              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background transition-colors flex items-center justify-center">
                  <Heart size={18} className={isSaved ? 'text-accent fill-accent' : 'text-text-primary'} />
                </button>
                <button className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background transition-colors flex items-center justify-center">
                  <Share2 size={18} className="text-text-primary" />
                </button>
              </div>
              
              {/* Pier Partner Badge */}
              {hotel.pier_perk_level && hotel.pier_perk_level.toLowerCase().includes('vip') && (
                <div className="absolute bottom-20 left-5 px-3 py-1.5 rounded-md bg-accent">
                  <span className="text-background text-xs font-semibold">◆ Pier Partner</span>
                </div>
              )}
              
              {/* Hotel Info */}
              <div className="absolute bottom-4 left-5 right-5">
                <div className="flex items-center gap-2 mb-2">
                  {hotel.star_rating && (
                    <div className="flex items-center gap-1">
                      {[...Array(Math.floor(hotel.star_rating))].map((_, i) => (
                        <Star key={i} size={11} className="text-accent fill-accent" />
                      ))}
                    </div>
                  )}
                  {hotel.brand_group && (
                    <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded">
                      {hotel.brand_group}
                    </span>
                  )}
                </div>
                <h1 className="text-white text-2xl font-normal mb-2" style={{ fontFamily: 'Instrument Serif, serif' }}>
                  {hotel.name}
                </h1>
                <div className="flex items-center gap-1.5 text-white/80 text-sm">
                  <MapPin size={14} />
                  <span>{hotel.neighborhood}, {hotel.primary_city}</span>
                </div>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="flex items-center justify-around py-3.5 px-5 border-b border-border/50">
              <div className="flex flex-col items-center">
                <span className="text-text-primary text-base font-semibold">
                  {hotel.quality_score_internal || '—'}
                </span>
                <span className="text-text-tertiary text-[10px] uppercase tracking-wider mt-0.5">
                  Pier Score
                </span>
              </div>
              <div className="w-px h-8 bg-border/50" />
              <div className="flex flex-col items-center">
                <span className="text-text-primary text-base font-semibold">
                  {rateDisplay}
                </span>
                <span className="text-text-tertiary text-[10px] uppercase tracking-wider mt-0.5">
                  avg/night
                </span>
              </div>
              <div className="w-px h-8 bg-border/50" />
              <div className="flex flex-col items-center">
                <span className="text-text-primary text-base font-semibold">
                  {hotel.pier_benefits?.find(b => b.toLowerCase().includes('checkout'))?.match(/\d+PM/i)?.[0] || '—'}
                </span>
                <span className="text-text-tertiary text-[10px] uppercase tracking-wider mt-0.5">
                  late checkout
                </span>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-border/50 sticky top-0 bg-background/98 backdrop-blur-sm z-10">
              {(['overview', 'experience', 'amenities', 'location'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3.5 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab
                      ? 'text-accent border-accent'
                      : 'text-text-tertiary border-transparent hover:text-text-secondary'
                  }`}
                  style={{ textTransform: 'capitalize' }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="pb-24">
              {activeTab === 'overview' && (
                <OverviewTab
                  hotel={hotel}
                  personalizedReasons={visibleReasons}
                  showAllReasons={showAllReasons}
                  onToggleReasons={() => setShowAllReasons(!showAllReasons)}
                  calendarEvents={visibleMeetings}
                  showAllMeetings={showAllMeetings}
                  onToggleMeetings={() => setShowAllMeetings(!showAllMeetings)}
                />
              )}
              {activeTab === 'experience' && <ExperienceTab hotel={hotel} />}
              {activeTab === 'amenities' && <AmenitiesTab hotel={hotel} />}
              {activeTab === 'location' && <LocationTab hotel={hotel} calendarEvents={calendarEvents} />}
            </div>

            {/* Booking Bar */}
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-5 py-3.5 bg-background/98 backdrop-blur-sm border-t border-border/50 flex items-center gap-4">
              <div className="flex items-baseline">
                <span className="text-text-primary text-xl font-semibold">{rateDisplay}</span>
                <span className="text-text-tertiary text-xs ml-1">/night</span>
              </div>
              <button
                onClick={onBookWithConcierge}
                className="flex-1 px-5 py-3.5 bg-accent hover:bg-[#d4c4a6] text-background rounded-xl transition-all"
              >
                <span className="text-sm font-semibold">Book with Pier</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}

// Overview Tab Component
function OverviewTab({
  hotel,
  personalizedReasons,
  showAllReasons,
  onToggleReasons,
  calendarEvents,
  showAllMeetings,
  onToggleMeetings,
}: {
  hotel: HotelData;
  personalizedReasons: PersonalizedReason[];
  showAllReasons: boolean;
  onToggleReasons: () => void;
  calendarEvents: CalendarEvent[];
  showAllMeetings: boolean;
  onToggleMeetings: () => void;
}) {
  const ReasonIcon = ({ type }: { type: PersonalizedReason['icon'] }) => {
    const icons = {
      calendar: Calendar,
      quiet: VolumeX,
      work: Briefcase,
      history: History,
    };
    const Icon = icons[type] || Calendar;
    return <Icon size={16} className="text-accent" />;
  };

  return (
    <div className="px-5 pt-6 space-y-6">
      {/* Personalized Reasons */}
      {personalizedReasons.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-text-primary text-lg font-normal" style={{ fontFamily: 'Instrument Serif, serif' }}>
              Why this hotel
            </h2>
            <span className="text-text-tertiary text-[10px] bg-white/5 px-2.5 py-1 rounded-full">
              Based on your data
            </span>
          </div>
          
          <div className="space-y-3">
            {personalizedReasons.map((reason, idx) => (
              <div key={idx} className="flex gap-3.5 p-3.5 rounded-xl bg-accent/5 border border-accent/10">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  <ReasonIcon type={reason.icon} />
                </div>
                <div className="flex-1">
                  <h4 className="text-text-primary text-sm font-semibold mb-1">{reason.headline}</h4>
                  <p className="text-text-secondary text-xs leading-relaxed">{reason.detail}</p>
                </div>
              </div>
            ))}
          </div>
          
          {personalizedReasons.length > 2 && (
            <button
              onClick={onToggleReasons}
              className="mt-3 w-full py-2.5 text-xs text-text-secondary border border-border/50 rounded-lg hover:bg-surface transition-colors"
            >
              {showAllReasons ? 'Show less' : `+${personalizedReasons.length - 2} more`}
            </button>
          )}
        </section>
      )}

      {/* Calendar Preview */}
      {calendarEvents.length > 0 && (
        <section className="p-4 rounded-xl bg-[#8B9F8B]/6 border border-[#8B9F8B]/10">
          <div className="flex items-center gap-2 mb-3.5 text-[#8B9F8B]">
            <Calendar size={14} />
            <span className="text-xs font-semibold uppercase tracking-wide">Your schedule</span>
          </div>
          <div className="space-y-2.5">
            {calendarEvents.map((event, idx) => {
              const eventDate = new Date(event.start_time);
              const dateStr = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const timeStr = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
              
              return (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-white/2">
                  <div className="min-w-[56px]">
                    <span className="block text-[10px] text-text-tertiary">{dateStr}</span>
                    <span className="block text-sm font-medium text-text-primary">{timeStr}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm text-text-primary truncate">{event.title}</span>
                    {event.location && (
                      <span className="block text-xs text-text-tertiary truncate">{event.location}</span>
                    )}
                  </div>
                  {event.location && hotel.neighborhood && event.location.toLowerCase().includes(hotel.neighborhood.toLowerCase()) && (
                    <span className="text-xs font-semibold text-[#8B9F8B] bg-[#8B9F8B]/12 px-2 py-1 rounded">
                      Nearby
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {calendarEvents.length > 2 && (
            <button
              onClick={onToggleMeetings}
              className="mt-3 w-full py-2.5 text-xs text-text-secondary border border-border/50 rounded-lg hover:bg-surface transition-colors"
            >
              {showAllMeetings ? 'Show less' : 'Show all meetings'}
            </button>
          )}
        </section>
      )}

      {/* Pier Benefits */}
      {hotel.pier_benefits && hotel.pier_benefits.length > 0 && (
        <section>
          <h2 className="text-text-primary text-lg font-normal mb-4" style={{ fontFamily: 'Instrument Serif, serif' }}>
            Your Pier benefits
          </h2>
          <div className="rounded-xl bg-accent/5 border border-accent/10 overflow-hidden">
            <div className="p-4 space-y-3">
              {hotel.pier_benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Check size={16} className="text-[#8B9F8B] flex-shrink-0" />
                  <span className="text-text-primary text-sm">{benefit}</span>
                </div>
              ))}
            </div>
            <div className="px-4 py-3.5 bg-black/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-text-tertiary uppercase tracking-wide block">Estimated value</span>
                <span className="text-[#8B9F8B] text-lg font-semibold">$380+</span>
              </div>
              {hotel.booking_partners && hotel.booking_partners.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-text-tertiary">Also via</span>
                  {hotel.booking_partners.map((partner, i) => (
                    <span key={i} className="text-[10px] text-text-secondary bg-white/5 px-2 py-1 rounded">
                      {partner}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Quick Info */}
      <section>
        <h2 className="text-text-primary text-lg font-normal mb-4" style={{ fontFamily: 'Instrument Serif, serif' }}>
          At a glance
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          {hotel.check_in_time && (
            <div className="p-3 rounded-lg bg-white/2">
              <span className="text-[10px] text-text-tertiary uppercase tracking-wide block mb-1">Check-in</span>
              <span className="text-text-primary text-sm font-medium">
                {new Date(`2000-01-01T${hotel.check_in_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
          )}
          {hotel.check_out_time && (
            <div className="p-3 rounded-lg bg-white/2">
              <span className="text-[10px] text-text-tertiary uppercase tracking-wide block mb-1">Check-out</span>
              <span className="text-text-primary text-sm font-medium">
                {new Date(`2000-01-01T${hotel.check_out_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
          )}
          {hotel.room_count && (
            <div className="p-3 rounded-lg bg-white/2">
              <span className="text-[10px] text-text-tertiary uppercase tracking-wide block mb-1">Rooms</span>
              <span className="text-text-primary text-sm font-medium">{hotel.room_count}</span>
            </div>
          )}
          {hotel.last_renovated_year && (
            <div className="p-3 rounded-lg bg-white/2">
              <span className="text-[10px] text-text-tertiary uppercase tracking-wide block mb-1">Renovated</span>
              <span className="text-text-primary text-sm font-medium">{hotel.last_renovated_year}</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// Experience Tab Component
function ExperienceTab({ hotel }: { hotel: HotelData }) {
  return (
    <div className="px-5 pt-6 space-y-6">
      {/* Editorial */}
      {hotel.notes_curated && (
        <section>
          <h2 className="text-text-primary text-lg font-normal mb-4" style={{ fontFamily: 'Instrument Serif, serif' }}>
            The experience
          </h2>
          <p className="text-text-secondary text-sm leading-relaxed mb-4">{hotel.notes_curated}</p>
          
          {hotel.best_known_for && (
            <div className="p-3.5 rounded-lg bg-white/2 border-l-2 border-accent">
              <span className="text-[10px] text-accent uppercase tracking-wider font-semibold block mb-1.5">
                Known for
              </span>
              <p className="text-text-primary text-sm leading-relaxed">{hotel.best_known_for}</p>
            </div>
          )}
        </section>
      )}

      {/* Atmosphere */}
      {hotel.atmosphere && hotel.atmosphere.length > 0 && (
        <section>
          <h2 className="text-text-primary text-lg font-normal mb-4" style={{ fontFamily: 'Instrument Serif, serif' }}>
            Atmosphere
          </h2>
          <div className="flex flex-wrap gap-2">
            {hotel.atmosphere.map((tag, idx) => (
              <span key={idx} className="px-3 py-1.5 rounded-full text-xs text-accent bg-accent/8 border border-accent/15">
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Guest Mix */}
      {hotel.guest_mix && hotel.guest_mix.length > 0 && (
        <section>
          <h2 className="text-text-primary text-lg font-normal mb-4" style={{ fontFamily: 'Instrument Serif, serif' }}>
            Who stays here
          </h2>
          <div className="flex flex-wrap gap-2">
            {hotel.guest_mix.map((tag, idx) => (
              <span key={idx} className="px-3 py-1.5 rounded-full text-xs text-text-secondary bg-white/4">
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Vibe Meters */}
      {(hotel.noise_level !== undefined || hotel.scene_level !== undefined) && (
        <section>
          <h2 className="text-text-primary text-lg font-normal mb-4" style={{ fontFamily: 'Instrument Serif, serif' }}>
            Vibe
          </h2>
          <div className="space-y-3.5">
            {hotel.noise_level !== undefined && (
              <VibeMeter 
                label="Noise level" 
                value={hotel.noise_level} 
                max={5} 
                descriptor="Quiet" 
              />
            )}
            {hotel.scene_level !== undefined && (
              <VibeMeter 
                label="Scene level" 
                value={hotel.scene_level} 
                max={5} 
                descriptor="Moderate" 
              />
            )}
          </div>
        </section>
      )}

      {/* Design */}
      {hotel.design_style && hotel.design_style.length > 0 && (
        <section>
          <h2 className="text-text-primary text-lg font-normal mb-4" style={{ fontFamily: 'Instrument Serif, serif' }}>
            Design
          </h2>
          <div className="flex flex-wrap gap-2">
            {hotel.design_style.map((tag, idx) => (
              <span key={idx} className="px-3 py-1.5 rounded-full text-xs text-text-secondary bg-white/4">
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// Amenities Tab Component
function AmenitiesTab({ hotel }: { hotel: HotelData }) {
  const useCases = [
    { key: 'good_for_solo_work', label: 'Solo work', active: hotel.good_for_solo_work },
    { key: 'good_for_couples', label: 'Couples', active: hotel.good_for_couples },
    { key: 'good_for_families', label: 'Families', active: hotel.good_for_families },
    { key: 'good_for_long_stays', label: 'Extended stays', active: hotel.good_for_long_stays },
    { key: 'good_for_offsites', label: 'Team offsites', active: hotel.good_for_offsites },
    { key: 'good_for_board_meetings', label: 'Board meetings', active: hotel.good_for_board_meetings },
  ];

  return (
    <div className="px-5 pt-6 space-y-6">
      {/* Service */}
      <section>
        <h2 className="text-text-primary text-lg font-normal mb-4" style={{ fontFamily: 'Instrument Serif, serif' }}>
          Service
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          {hotel.service_style && (
            <ServiceItem label="Style" value={hotel.service_style} />
          )}
          {hotel.concierge_quality !== undefined && (
            <ServiceItem 
              label="Concierge" 
              value={hotel.concierge_quality === 3 ? 'Exceptional' : hotel.concierge_quality === 2 ? 'Good' : 'Standard'} 
            />
          )}
          {hotel.staff_kindness_score !== undefined && (
            <ServiceItem label="Staff" value={`${hotel.staff_kindness_score}/10`} type="rating" />
          )}
          {hotel.discretion_score !== undefined && (
            <ServiceItem label="Discretion" value={hotel.discretion_score} max={5} type="dots" />
          )}
          {hotel.checkin_flexibility_score !== undefined && (
            <ServiceItem label="Check-in flex" value={hotel.checkin_flexibility_score} max={5} type="dots" />
          )}
          {hotel.late_checkout_friendliness !== undefined && (
            <ServiceItem label="Late checkout" value={hotel.late_checkout_friendliness} max={5} type="dots" />
          )}
        </div>
      </section>

      {/* Facilities */}
      <section>
        <h2 className="text-text-primary text-lg font-normal mb-4" style={{ fontFamily: 'Instrument Serif, serif' }}>
          Facilities
        </h2>
        
        {/* Work */}
        <div className="mb-5">
          <h4 className="text-[10px] text-text-tertiary uppercase tracking-wide font-semibold mb-3">Work</h4>
          <div className="space-y-2.5">
            {hotel.wifi_quality !== undefined && (
              <AmenityRow label="WiFi" value={hotel.wifi_quality} type="dots" />
            )}
            {hotel.desk_in_room !== undefined && (
              <AmenityRow label="In-room desk" value={hotel.desk_in_room} type="bool" />
            )}
            {hotel.coworking_space !== undefined && (
              <AmenityRow label="Coworking space" value={hotel.coworking_space} type="bool" />
            )}
            {hotel.meeting_rooms !== undefined && (
              <AmenityRow label="Meeting rooms" value={hotel.meeting_rooms} type="bool" />
            )}
          </div>
        </div>

        {/* Wellness */}
        <div className="mb-5">
          <h4 className="text-[10px] text-text-tertiary uppercase tracking-wide font-semibold mb-3">Wellness</h4>
          <div className="space-y-2.5">
            {hotel.gym_quality !== undefined && (
              <AmenityRow label="Gym" value={hotel.gym_quality} type="dots" />
            )}
            {hotel.spa_quality !== undefined && (
              <AmenityRow label="Spa" value={hotel.spa_quality} type="dots" />
            )}
            {hotel.pool_type && (
              <AmenityRow label="Pool" value={hotel.pool_type} type="text" />
            )}
          </div>
        </div>

        {/* Dining */}
        <div className="mb-5">
          <h4 className="text-[10px] text-text-tertiary uppercase tracking-wide font-semibold mb-3">Dining</h4>
          <div className="space-y-2.5">
            {hotel.food_drink_quality && (
              <AmenityRow label="Food quality" value={hotel.food_drink_quality} type="text" />
            )}
            {hotel.bar_scene && (
              <AmenityRow label="Bar" value={hotel.bar_scene} type="text" />
            )}
          </div>
        </div>

        {/* Other */}
        <div>
          <h4 className="text-[10px] text-text-tertiary uppercase tracking-wide font-semibold mb-3">Other</h4>
          <div className="space-y-2.5">
            {hotel.pet_friendly !== undefined && (
              <AmenityRow label="Pet friendly" value={hotel.pet_friendly} type="bool" />
            )}
          </div>
        </div>
      </section>

      {/* Perfect For */}
      <section>
        <h2 className="text-text-primary text-lg font-normal mb-4" style={{ fontFamily: 'Instrument Serif, serif' }}>
          Perfect for
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {useCases.map(uc => (
            <div
              key={uc.key}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                uc.active
                  ? 'bg-[#8B9F8B]/8 border-[#8B9F8B]/15'
                  : 'bg-white/2 border-border/50 opacity-40'
              }`}
            >
              <span className="text-text-primary text-sm">{uc.label}</span>
              {uc.active && <Check size={14} className="text-[#8B9F8B]" />}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// Location Tab Component
function LocationTab({ hotel, calendarEvents }: { hotel: HotelData; calendarEvents: CalendarEvent[] }) {
  return (
    <div className="px-5 pt-6 space-y-6">
      {/* Map */}
      <section>
        <div className="h-40 rounded-xl bg-white/2 flex flex-col items-center justify-center gap-2.5">
          <MapPin size={28} className="text-text-tertiary" />
          <span className="text-text-secondary text-xs text-center px-5">{hotel.address}</span>
        </div>
      </section>

      {/* Transit */}
      <section>
        <h2 className="text-text-primary text-lg font-normal mb-4" style={{ fontFamily: 'Instrument Serif, serif' }}>
          Getting around
        </h2>
        <div className="grid grid-cols-3 gap-2.5">
          {hotel.walkability_score_internal !== undefined && (
            <div className="p-3 rounded-lg bg-white/2 text-center">
              <span className="text-[10px] text-text-tertiary uppercase tracking-wide block mb-1">Walkability</span>
              <span className="text-text-primary text-sm font-medium">{hotel.walkability_score_internal}/5</span>
            </div>
          )}
          {hotel.transit_access && (
            <div className="p-3 rounded-lg bg-white/2 text-center">
              <span className="text-[10px] text-text-tertiary uppercase tracking-wide block mb-1">Transit</span>
              <span className="text-text-primary text-sm font-medium capitalize">{hotel.transit_access}</span>
            </div>
          )}
          {hotel.airport_distance_minutes !== undefined && (
            <div className="p-3 rounded-lg bg-white/2 text-center">
              <span className="text-[10px] text-text-tertiary uppercase tracking-wide block mb-1">Airport</span>
              <span className="text-text-primary text-sm font-medium">{hotel.airport_distance_minutes} min</span>
            </div>
          )}
        </div>
      </section>

      {/* Distance to Meetings */}
      {calendarEvents.length > 0 && (
        <section>
          <h2 className="text-text-primary text-lg font-normal mb-4" style={{ fontFamily: 'Instrument Serif, serif' }}>
            Distance to your meetings
          </h2>
          <div className="space-y-2">
            {calendarEvents
              .filter(e => e.location)
              .map((event, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/2">
                  <div>
                    <span className="block text-sm text-text-primary">{event.title}</span>
                    <span className="block text-xs text-text-tertiary">{event.location}</span>
                  </div>
                  {hotel.neighborhood && event.location?.toLowerCase().includes(hotel.neighborhood.toLowerCase()) && (
                    <span className="text-sm font-semibold text-[#8B9F8B]">Nearby</span>
                  )}
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Nearby */}
      {hotel.near_key_areas && hotel.near_key_areas.length > 0 && (
        <section>
          <h2 className="text-text-primary text-lg font-normal mb-4" style={{ fontFamily: 'Instrument Serif, serif' }}>
            Nearby
          </h2>
          <div className="flex flex-wrap gap-2">
            {hotel.near_key_areas.map((area, idx) => (
              <span key={idx} className="px-3 py-1.5 rounded-lg text-xs text-text-secondary bg-white/4">
                {area}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// Helper Components
function VibeMeter({ label, value, max, descriptor }: { label: string; value: number; max: number; descriptor: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-text-tertiary text-sm w-24">{label}</span>
      <div className="flex-1 h-1.5 bg-white/6 rounded-full overflow-hidden">
        <div 
          className="h-full bg-accent rounded-full transition-all"
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
      <span className="text-text-primary text-xs w-20 text-right">{descriptor}</span>
    </div>
  );
}

function ServiceItem({ label, value, max, type }: { label: string; value: string | number; max?: number; type?: 'dots' | 'rating' }) {
  return (
    <div className="p-3 rounded-lg bg-white/2">
      <span className="text-[10px] text-text-tertiary uppercase tracking-wide block mb-1.5">{label}</span>
      {type === 'dots' && max ? (
        <div className="flex gap-1">
          {[...Array(max)].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${i < value ? 'bg-accent' : 'bg-white/10'}`}
            />
          ))}
        </div>
      ) : type === 'rating' ? (
        <span className="text-text-primary text-sm font-medium">{value}</span>
      ) : (
        <span className="text-text-primary text-sm font-medium">{value}</span>
      )}
    </div>
  );
}

function AmenityRow({ label, value, type }: { label: string; value: string | number | boolean; type: 'dots' | 'bool' | 'text' }) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/2">
      <span className="text-text-secondary text-sm">{label}</span>
      {type === 'dots' && typeof value === 'number' ? (
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${i < value ? 'bg-accent' : 'bg-white/10'}`}
            />
          ))}
        </div>
      ) : type === 'bool' ? (
        <span className={`text-sm ${value ? 'text-[#8B9F8B]' : 'text-text-tertiary'}`}>
          {value ? 'Yes' : '—'}
        </span>
      ) : (
        <span className="text-text-primary text-sm">{value || '—'}</span>
      )}
    </div>
  );
}

