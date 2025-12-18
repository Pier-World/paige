import { Wine, Car, Sparkles, UtensilsCrossed, Plane, Gift, Clock, TrendingDown, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { PerkDetail, PerkDetailData } from '../components/ui/PerkDetail';
import { HotelProfile } from '../components/ui/HotelProfile';
import { PageLayout } from '../components/layout/PageLayout';
import { perks as mockPerks, perkDetailsData } from '../data/perks';
import { supabase } from '../lib/supabase';
import type { Perk } from '../data/perks';

const iconMap = {
  dining: UtensilsCrossed,
  transportation: Car,
  wellness: Sparkles,
  travel: Plane,
  lifestyle: Wine,
};

interface PerksPageProps {
  onOpenConcierge?: () => void;
}

export function PerksPage({ onOpenConcierge }: PerksPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPerk, setSelectedPerk] = useState<PerkDetailData | null>(null);
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [selectedHotelData, setSelectedHotelData] = useState<any>(null);
  const [perks, setPerks] = useState<Perk[]>(mockPerks);
  const [hotelsMap, setHotelsMap] = useState<Map<string, any>>(new Map()); // Store hotel data for hotel perks
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const categories = [
    { value: 'all', label: 'All Perks' },
    { value: 'dining', label: 'Dining', icon: UtensilsCrossed },
    { value: 'transportation', label: 'Transportation', icon: Car },
    { value: 'wellness', label: 'Wellness', icon: Sparkles },
    { value: 'travel', label: 'Travel', icon: Plane },
    { value: 'lifestyle', label: 'Lifestyle', icon: Wine },
  ];

  // Fetch all perks data from database
  useEffect(() => {
    const fetchAllPerks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<null>((resolve) => {
          setTimeout(() => {
            console.warn('Perks fetch timeout - queries taking too long');
            resolve(null);
          }, 30000); // 30 second timeout
        });

        // Fetch perks and hotels in parallel with timeout
        const perksPromise = supabase
          .from('perks')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50); // Limit to 50 perks

        const hotelsPromise = supabase
          .from('hotels')
          .select('*')
          .eq('is_active', true)
          .order('quality_score_internal', { ascending: false })
          .limit(20);

        // Race between queries and timeout
        let perksResult: any = null;
        let hotelsResult: any = null;
        let timedOut = false;

        try {
          const results = await Promise.race([
            Promise.all([perksPromise, hotelsPromise]),
            timeoutPromise.then(() => {
              timedOut = true;
              return null;
            })
          ]);

          if (timedOut || results === null) {
            console.error('Perks fetch timed out');
            setError('Request timed out. Please try again.');
            setPerks(mockPerks);
            setLoading(false);
            return;
          }

          perksResult = results[0];
          hotelsResult = results[1];
        } catch (err) {
          console.error('Error in Promise.race for perks:', err);
          setError('Failed to load perks. Showing offline data.');
          setPerks(mockPerks);
          setLoading(false);
          return;
        }

        const { data: perksData, error: perksError } = perksResult;
        const { data: hotelsData, error: hotelsError } = hotelsResult;

        // If there's an error, log it but continue with available data
        if (perksError) {
          console.error('Error fetching perks:', perksError);
          setError('Some data failed to load.');
        }
        if (hotelsError) {
          console.error('Error fetching hotels:', hotelsError);
          setError('Some data failed to load.');
        }

        const allPerks: Perk[] = [];

        // Convert perks from database to Perk format
        if (perksData && perksData.length > 0) {
          const convertedPerks = perksData.map((p: any) => {
            // Map category to match Perk interface
            let category: Perk['category'] = 'dining';
            if (p.category === 'hotels') {
              category = 'travel';
            } else if (p.category === 'dining') {
              category = 'dining';
            } else if (p.category === 'wellness') {
              category = 'wellness';
            } else if (p.category === 'transportation') {
              category = 'transportation';
            } else if (p.category === 'lifestyle' || p.category === 'experiences') {
              category = 'lifestyle';
            }

            // Calculate value based on category and benefits
            let calculatedValue = '$50+ value';
            if (category === 'dining') {
              // Dining perks: estimate based on benefits
              const benefitsText = p.benefits?.join(' ') || '';
              if (benefitsText.toLowerCase().includes('complimentary') || benefitsText.toLowerCase().includes('free')) {
                calculatedValue = '$50-100 value';
              } else if (benefitsText.toLowerCase().includes('priority') || benefitsText.toLowerCase().includes('vip')) {
                calculatedValue = '$100+ value';
              } else if (benefitsText.toLowerCase().includes('private') || benefitsText.toLowerCase().includes('exclusive')) {
                calculatedValue = '$200+ value';
              } else {
                calculatedValue = '$50+ value';
              }
            } else if (category === 'travel') {
              calculatedValue = '$300+ value';
            } else if (category === 'wellness') {
              calculatedValue = '$150+ value';
            } else if (category === 'transportation') {
              calculatedValue = '$100+ value';
            } else {
              calculatedValue = '$100+ value';
            }

            return {
              id: p.id,
              title: p.title,
              provider: p.title, // Use title as provider if no separate provider field
              description: p.short_description || p.partner_description || '',
              category,
              benefit: p.benefits?.[0] || 'Member benefit',
              value: calculatedValue,
              locations: p.city || 'Multiple locations',
              terms: p.redemption_instructions || 'Contact concierge',
              imageUrl: p.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
              featured: p.featured || false,
              activationMethod: (p.external_link ? 'code' : 'request') as 'automatic' | 'code' | 'request',
              code: p.external_link ? undefined : undefined,
            };
          });
          allPerks.push(...convertedPerks);
        }

        // Convert hotels to perks and store hotel data
        const hotelsMap = new Map<string, any>();
        if (hotelsData && hotelsData.length > 0) {
          const hotelPerks = hotelsData.map((h: any, index: number) => {
            // Store hotel data for later use
            hotelsMap.set(`hotel-${h.id}`, h);
            
            // Use unique hotel image - try multiple image fields, then generate smart fallback
            let hotelImage = h.image_hero || h.image_url || h.image;
            
            // Check if image is missing or is the default placeholder
            const isDefaultImage = !hotelImage || 
              hotelImage === 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800' ||
              hotelImage.includes('placeholder') ||
              hotelImage.includes('default');
            
            if (isDefaultImage) {
              // Generate unique, relevant image URL based on hotel name and location
              // Use Unsplash Source API with hotel-specific search terms
              const hotelNameSlug = encodeURIComponent(
                (h.name || 'luxury hotel').toLowerCase().replace(/[^a-z0-9]+/g, '-')
              );
              const citySlug = encodeURIComponent(
                (h.primary_city || h.neighborhood || 'hotel').toLowerCase().replace(/[^a-z0-9]+/g, '-')
              );
              
              // Create a deterministic but varied image based on hotel ID
              // Use hotel ID hash to select from curated luxury hotel image IDs
              const luxuryHotelImageIds = [
                '1566073771259', // Luxury hotel interior
                '1582719508461', // Modern hotel room
                '1564501049412', // Hotel lobby
                '1571896083567', // Luxury suite
                '1566073771259', // Hotel exterior
                '1582719508461', // Hotel bar
                '1564501049412', // Hotel pool
                '1571896083567', // Hotel restaurant
              ];
              
              // Use hotel ID to deterministically select image
              const hash = h.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
              const imageIndex = hash % luxuryHotelImageIds.length;
              
              // Build Unsplash URL with hotel-specific search
              // Using Unsplash Source API format: https://source.unsplash.com/800x600/?{query}
              const searchQuery = `${hotelNameSlug}-${citySlug}-hotel`;
              hotelImage = `https://source.unsplash.com/800x600/?${searchQuery}&sig=${h.id.substring(0, 8)}`;
              
              // Fallback to curated image if search fails
              const fallbackImageId = luxuryHotelImageIds[imageIndex];
              hotelImage = `https://images.unsplash.com/photo-${fallbackImageId}?w=800&h=600&fit=crop&q=80&sig=${h.id.substring(0, 8)}`;
            }
            
            return {
              id: `hotel-${h.id}`,
              title: `${h.name} - Pier Benefits`,
              provider: h.name,
              description: h.notes_curated || `Luxury hotel in ${h.neighborhood}, ${h.primary_city} with exclusive Pier member benefits.`,
              category: 'travel' as const,
              benefit: h.pier_benefits?.join(', ') || 'Exclusive benefits',
              value: `$300+ value`,
              locations: `${h.neighborhood}, ${h.primary_city}`,
              terms: 'Book through Pier concierge',
              imageUrl: hotelImage,
              featured: h.pier_perk_level === 'VIP partner' || (h.quality_score_internal && h.quality_score_internal >= 90),
              activationMethod: 'request' as const,
              __isHotel: true, // Flag to identify hotel perks
              __hotelId: h.id, // Store hotel ID
            };
          });
          allPerks.push(...hotelPerks);
          setHotelsMap(hotelsMap);
        }

        // If we have data, use it; otherwise fall back to mock
        if (allPerks.length > 0) {
          setPerks(allPerks);
        } else {
          setPerks(mockPerks);
        }
      } catch (error) {
        console.error('Error fetching perks:', error);
        setPerks(mockPerks);
      } finally {
        setLoading(false);
      }
    };

    // Add abort controller for cleanup
    let isMounted = true;
    fetchAllPerks().then(() => {
      if (!isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Memoize featured perks - limit to 4 maximum (must be defined before filteredPerks)
  const featuredPerks = useMemo(() => {
    return perks.filter(perk => perk.featured).slice(0, 4);
  }, [perks]);

  // Memoize filtered perks to avoid recalculating on every render
  // Sort by: featured first, then by other criteria (for now, by created_at or quality_score)
  // TODO: Add clicks/usage_count field to perks table for proper sorting
  const filteredPerks = useMemo(() => {
    let filtered = selectedCategory === 'all' 
      ? perks 
      : perks.filter(perk => perk.category === selectedCategory);
    
    // When showing "All Perks", exclude featured perks from the main grid
    // (they're already shown in the featured section)
    if (selectedCategory === 'all') {
      const featuredIds = new Set(featuredPerks.map(p => p.id));
      filtered = filtered.filter(perk => !featuredIds.has(perk.id));
    }
    
    // Sort: For hotels, use quality_score_internal if available
    // For regular perks, sort by featured status (though featured are excluded in "all" view)
    filtered.sort((a, b) => {
      // For hotel perks, sort by quality score if available
      if ((a as any).__isHotel && (b as any).__isHotel) {
        const aHotel = hotelsMap.get(a.id);
        const bHotel = hotelsMap.get(b.id);
        const aScore = aHotel?.quality_score_internal || 0;
        const bScore = bHotel?.quality_score_internal || 0;
        if (aScore !== bScore) return bScore - aScore; // Higher score first
      }
      
      // For non-hotel perks, sort by featured status (if not in "all" view)
      if (selectedCategory !== 'all') {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
      }
      
      // Otherwise maintain current order (already sorted by database query)
      return 0;
    });
    
    return filtered;
  }, [perks, selectedCategory, hotelsMap, featuredPerks]);

  const totalValue = perks.length;

  // Memoize handlePerkClick to prevent unnecessary re-renders
  const handlePerkClick = useCallback(async (perk: Perk) => {
    // Check if this is a hotel perk
    if ((perk as any).__isHotel && (perk as any).__hotelId) {
      const hotelId = (perk as any).__hotelId;
      const hotelData = hotelsMap.get(perk.id);
      
      if (hotelData) {
        setSelectedHotelData(hotelData);
        setSelectedHotelId(hotelId);
      } else {
        // Fetch hotel data if not in map
        try {
          const { data } = await supabase
            .from('hotels')
            .select('*')
            .eq('id', hotelId)
            .single();
          
          if (data) {
            setSelectedHotelData(data);
            setSelectedHotelId(hotelId);
          }
        } catch (error) {
          console.error('Error fetching hotel:', error);
        }
      }
      return;
    }

    // Check if we have detail data in the mock data
    const perkDetail = perkDetailsData[perk.id];
    if (perkDetail) {
      setSelectedPerk(perkDetail);
      return;
    }

    // Convert database perk to PerkDetailData format
    // First try to fetch full perk data from database
    try {
      const { data: fullPerkData } = await supabase
        .from('perks')
        .select('*')
        .eq('id', perk.id)
        .single();

      if (fullPerkData) {
        const convertedDetail: PerkDetailData = {
          id: fullPerkData.id,
          title: fullPerkData.title,
          provider: fullPerkData.title,
          category: fullPerkData.category === 'hotels' ? 'Travel' : 
                   fullPerkData.category === 'dining' ? 'Dining' :
                   fullPerkData.category === 'wellness' ? 'Wellness' :
                   fullPerkData.category === 'transportation' ? 'Transportation' :
                   fullPerkData.category === 'lifestyle' || fullPerkData.category === 'experiences' ? 'Lifestyle' : 'Perk',
          tagline: fullPerkData.short_description || fullPerkData.partner_description || '',
          description: fullPerkData.short_description || fullPerkData.partner_description || '',
          about: fullPerkData.partner_description || fullPerkData.short_description || '',
          location: fullPerkData.city || 'Multiple locations',
          imageUrl: fullPerkData.image_url || perk.imageUrl,
          memberBenefits: fullPerkData.benefits || [perk.benefit] || ['Member benefit'],
          value: perk.value || (fullPerkData.category === 'dining' ? '$50-100 value' : '$100+ value'),
          redemptionType: fullPerkData.external_link ? 'external' :
                         perk.activationMethod === 'code' ? 'code' : 
                         perk.activationMethod === 'automatic' ? 'automatic' : 'concierge',
          redemptionInstructions: fullPerkData.redemption_instructions || perk.terms || 'Contact your Pier concierge to redeem this benefit.',
          redemptionDetails: fullPerkData.redemption_instructions ? [fullPerkData.redemption_instructions] : undefined,
          redemptionUrl: fullPerkData.external_link || undefined,
          promoCode: perk.code,
          terms: perk.terms ? [perk.terms] : undefined,
          featured: fullPerkData.featured || perk.featured,
        };
        setSelectedPerk(convertedDetail);
        return;
      }
    } catch (error) {
      console.error('Error fetching full perk data:', error);
    }

    // Fallback to using perk data we already have
    const convertedDetail: PerkDetailData = {
      id: perk.id,
      title: perk.title,
      provider: perk.provider,
      category: perk.category.charAt(0).toUpperCase() + perk.category.slice(1),
      tagline: perk.description,
      description: perk.description,
      about: perk.description,
      location: perk.locations || 'Multiple locations',
      imageUrl: perk.imageUrl,
      memberBenefits: [perk.benefit],
      value: perk.value || (perk.category === 'dining' ? '$50-100 value' : '$100+ value'),
      redemptionType: perk.activationMethod === 'code' ? 'code' : 
                     perk.activationMethod === 'automatic' ? 'automatic' : 'concierge',
      redemptionInstructions: perk.terms || 'Contact your Pier concierge to redeem this benefit.',
      redemptionDetails: perk.terms ? [perk.terms] : undefined,
      promoCode: perk.code,
      terms: perk.terms ? [perk.terms] : undefined,
      featured: perk.featured,
    };
    setSelectedPerk(convertedDetail);
  }, [hotelsMap]);

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-background pt-24 pb-20 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            <p className="text-text-secondary" style={{ fontSize: '14px', fontWeight: 300 }}>
              Loading perks...
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-background pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-3">
              <Gift size={20} className="text-accent" />
              <h1 style={{ fontSize: '36px', fontWeight: 300, letterSpacing: '-0.02em' }} className="text-text-primary">
                Member Perks
              </h1>
            </div>
            <p className="text-text-secondary" style={{ fontSize: '16px', fontWeight: 300 }}>
              Exclusive benefits and preferred access available only to Pier members
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl bg-surface border border-border"
            >
              <div className="flex items-center gap-3 mb-2">
                <Gift size={18} className="text-accent" />
                <span className="text-text-tertiary" style={{ fontSize: '12px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Active Perks
                </span>
              </div>
              <p style={{ fontSize: '32px', fontWeight: 300 }} className="text-text-primary">
                {totalValue}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-xl bg-surface border border-border"
            >
              <div className="flex items-center gap-3 mb-2">
                <TrendingDown size={18} className="text-accent" />
                <span className="text-text-tertiary" style={{ fontSize: '12px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Value
                </span>
              </div>
              <p style={{ fontSize: '32px', fontWeight: 300 }} className="text-text-primary">
                $25k+
              </p>
              <p className="text-text-secondary mt-1" style={{ fontSize: '12px', fontWeight: 300 }}>
                Annual value
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-xl bg-surface border border-border"
            >
              <div className="flex items-center gap-3 mb-2">
                <Clock size={18} className="text-accent" />
                <span className="text-text-tertiary" style={{ fontSize: '12px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  This Month
                </span>
              </div>
              <p style={{ fontSize: '32px', fontWeight: 300 }} className="text-text-primary">
                $3.2k
              </p>
              <p className="text-text-secondary mt-1" style={{ fontSize: '12px', fontWeight: 300 }}>
                Saved in November
              </p>
            </motion.div>
          </div>

          {/* Filter */}
          <div className="mb-12 flex items-center gap-3 overflow-x-auto pb-2">
            <Filter size={18} className="text-text-tertiary flex-shrink-0" />
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all whitespace-nowrap ${
                  selectedCategory === category.value
                    ? 'bg-accent text-background'
                    : 'bg-surface border border-border text-text-secondary hover:border-[#3a3a3a] hover:text-text-primary'
                }`}
                style={{ fontSize: '13px', fontWeight: 400 }}
              >
                {category.value !== 'all' && category.icon && <category.icon size={14} />}
                {category.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-8 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                  <TrendingDown size={16} className="text-red-400" />
                </div>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
              <button
                onClick={handleRetry}
                className="px-4 py-2 rounded-lg bg-surface border border-border hover:border-red-500/40 text-text-primary transition-all text-xs"
              >
                Retry Connection
              </button>
            </div>
          )}

          {/* Featured Perks */}
          {selectedCategory === 'all' && (
            <>
              <div className="mb-8">
                <h2 style={{ fontSize: '24px', fontWeight: 300, letterSpacing: '-0.01em' }} className="text-text-primary mb-2">
                  Featured This Month
                </h2>
                <p className="text-text-secondary" style={{ fontSize: '14px', fontWeight: 300 }}>
                  Highest-value perks selected for you
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
                {featuredPerks.map((perk, index) => {
                  const Icon = iconMap[perk.category];
                  return (
                    <motion.button
                      key={perk.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.05, 0.5) }}
                      whileHover={{ y: -8 }}
                      onClick={() => handlePerkClick(perk)}
                      className="group rounded-2xl bg-surface border border-border hover:border-accent/40 overflow-hidden transition-all text-left w-full"
                    >
                      <div className="relative aspect-[16/9] overflow-hidden bg-surface-elevated">
                        <ImageWithFallback
                          src={perk.imageUrl}
                          alt={perk.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-accent/20">
                          <div className="flex items-center gap-1.5">
                            <Sparkles size={12} className="text-accent" />
                            <span className="text-accent" style={{ fontSize: '11px', fontWeight: 400 }}>
                              Featured
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 rounded-lg bg-surface-elevated">
                            <Icon size={18} className="text-accent" />
                          </div>
                          <div className="flex-1">
                            <h3 style={{ fontSize: '18px', fontWeight: 400 }} className="text-text-primary mb-1">
                              {perk.title}
                            </h3>
                            <p className="text-text-tertiary" style={{ fontSize: '12px', fontWeight: 300 }}>
                              {perk.locations}
                            </p>
                          </div>
                          <span className="px-2 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent" style={{ fontSize: '11px', fontWeight: 400 }}>
                            {perk.value}
                          </span>
                        </div>

                        <p className="text-text-secondary mb-4" style={{ fontSize: '14px', fontWeight: 300, lineHeight: '1.6' }}>
                          {perk.description}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                          <p className="text-text-secondary" style={{ fontSize: '12px', fontWeight: 300 }}>
                            Click to view details
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </>
          )}

          {/* All Perks Grid */}
          <div className="mb-8">
            <h2 style={{ fontSize: '24px', fontWeight: 300, letterSpacing: '-0.01em' }} className="text-text-primary mb-2">
              {selectedCategory === 'all' ? 'All Perks' : `${categories.find(c => c.value === selectedCategory)?.label} Perks`}
            </h2>
            <p className="text-text-secondary" style={{ fontSize: '14px', fontWeight: 300 }}>
              {selectedCategory === 'all' 
                ? `${filteredPerks.length} perks available • Sorted by popularity`
                : `${filteredPerks.length} perks available`}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPerks.map((perk, index) => {
              const Icon = iconMap[perk.category];
              return (
                <motion.button
                  key={perk.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.03, 0.5) }}
                  whileHover={{ y: -8 }}
                  onClick={() => handlePerkClick(perk)}
                  className="group rounded-2xl bg-surface border border-border hover:border-accent/40 overflow-hidden transition-all text-left w-full"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface-elevated">
                    <ImageWithFallback
                      src={perk.imageUrl}
                      alt={perk.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-accent/90 backdrop-blur-sm">
                      <span className="text-background" style={{ fontSize: '10px', fontWeight: 400 }}>
                        {perk.value}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start gap-2 mb-3">
                      <div className="p-2 rounded-lg bg-surface-elevated">
                        <Icon size={16} className="text-accent" />
                      </div>
                      <div className="flex-1">
                        <h4 style={{ fontSize: '16px', fontWeight: 400 }} className="text-text-primary mb-1">
                          {perk.title}
                        </h4>
                        <p className="text-text-tertiary" style={{ fontSize: '11px', fontWeight: 300 }}>
                          {perk.locations}
                        </p>
                      </div>
                    </div>

                    <p className="text-text-secondary mb-4" style={{ fontSize: '13px', fontWeight: 300, lineHeight: '1.6' }}>
                      {perk.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                      <p className="text-accent" style={{ fontSize: '13px', fontWeight: 400 }}>
                        {perk.benefit}
                      </p>
                      {perk.activationMethod === 'automatic' && (
                        <div className="px-2 py-1 rounded bg-accent/10">
                          <span className="text-accent" style={{ fontSize: '10px', fontWeight: 400 }}>
                            AUTO
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Perk Detail Modal */}
        <PerkDetail
          perk={selectedPerk}
          isOpen={!!selectedPerk}
          onClose={() => setSelectedPerk(null)}
          onOpenConcierge={onOpenConcierge}
        />

        {/* Hotel Profile Modal */}
        {selectedHotelId && selectedHotelData && (
          <HotelProfile
            hotelId={selectedHotelId}
            hotelData={selectedHotelData}
            onClose={() => {
              setSelectedHotelId(null);
              setSelectedHotelData(null);
            }}
            onBookWithConcierge={() => {
              if (onOpenConcierge) {
                onOpenConcierge();
              }
            }}
          />
        )}
      </div>
    </PageLayout>
  );
}

export default PerksPage;
