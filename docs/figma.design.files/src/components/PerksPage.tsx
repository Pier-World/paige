import { Wine, Car, Sparkles, UtensilsCrossed, Bed, Dumbbell, Plane, Gift, Clock, TrendingDown, Filter, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useState } from 'react';

interface Perk {
  id: string;
  title: string;
  provider: string;
  description: string;
  category: 'dining' | 'transportation' | 'wellness' | 'travel' | 'lifestyle';
  benefit: string;
  value: string;
  locations?: string;
  terms?: string;
  imageUrl: string;
  featured: boolean;
  activationMethod: 'automatic' | 'code' | 'request';
  code?: string;
}

const perks: Perk[] = [
  {
    id: '1',
    title: 'Complimentary Cocktails & Appetizers',
    provider: 'NoMad Bar, San Francisco',
    description: 'Enjoy two complimentary cocktails and a selection of appetizers every visit',
    category: 'dining',
    benefit: '2 cocktails + appetizers',
    value: '~$85 value',
    locations: 'San Francisco, New York',
    terms: 'Valid Monday-Thursday, reservation required',
    imageUrl: 'https://images.unsplash.com/photo-1674654659741-6246f1db40d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjb2NrdGFpbCUyMGJhcnxlbnwxfHx8fDE3NjQ1MjYzNDB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    featured: true,
    activationMethod: 'automatic',
  },
  {
    id: '2',
    title: 'Preferred Driver Pricing',
    provider: 'BlackLane',
    description: 'Access to executive chauffeur service with 25% member discount on all rides',
    category: 'transportation',
    benefit: '25% discount',
    value: 'Save $50-200 per ride',
    locations: 'Global coverage in 50+ countries',
    terms: 'Available 24/7, book via concierge or app',
    imageUrl: 'https://images.unsplash.com/photo-1698840059740-ba83e510733b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBjaGF1ZmZldXJ8ZW58MXx8fHwxNzY0NTI2MzQxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    featured: true,
    activationMethod: 'code',
    code: 'PIER2025',
  },
  {
    id: '3',
    title: 'Longevity Retreat Priority Access',
    provider: 'The Ranch Malibu',
    description: 'Priority booking and 20% discount on transformative wellness retreats',
    category: 'wellness',
    benefit: '20% off + priority booking',
    value: 'Save $1,200+ per retreat',
    locations: 'Malibu, CA',
    terms: 'Subject to availability, 30-day advance booking',
    imageUrl: 'https://images.unsplash.com/photo-1667235195726-a7c440bca9bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWxsbmVzcyUyMHNwYSUyMGx1eHVyeXxlbnwxfHx8fDE3NjQ0NzEzNzB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    featured: true,
    activationMethod: 'request',
  },
  {
    id: '4',
    title: 'Chef\'s Table Priority Reservations',
    provider: 'Michelin-Star Partner Network',
    description: 'Skip waitlists at 50+ top restaurants with guaranteed priority seating',
    category: 'dining',
    benefit: 'Priority access',
    value: 'Priceless',
    locations: 'NYC, SF, LA, Chicago, Miami',
    terms: 'Book through Pier concierge',
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaW5lJTIwZGluaW5nJTIwcmVzdGF1cmFudHxlbnwxfHx8fDE3NjQ1MDc1NDh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    featured: false,
    activationMethod: 'request',
  },
  {
    id: '5',
    title: 'Luxury Hotel Suite Upgrades',
    provider: 'Fine Hotels & Resorts',
    description: 'Automatic room upgrades, early check-in, late checkout, and daily breakfast',
    category: 'travel',
    benefit: 'Suite upgrades + amenities',
    value: '$300-800 per stay',
    locations: '1,000+ properties worldwide',
    terms: 'Based on availability at check-in',
    imageUrl: 'https://images.unsplash.com/photo-1759223198981-661cadbbff36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob3RlbCUyMHN1aXRlfGVufDF8fHx8MTc2NDQxNzMxOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    featured: false,
    activationMethod: 'automatic',
  },
  {
    id: '6',
    title: 'Private Fitness Studios',
    provider: 'Equinox, Lifetime, Barry\'s',
    description: 'Complimentary access to premium fitness clubs in major cities',
    category: 'wellness',
    benefit: 'Free access',
    value: '$300/month value',
    locations: '25+ cities',
    terms: 'Up to 10 visits per month',
    imageUrl: 'https://images.unsplash.com/photo-1758957646695-ec8bce3df462?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcml2YXRlJTIwZml0bmVzcyUyMGd5bXxlbnwxfHx8fDE3NjQ1MjYzNDJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    featured: false,
    activationMethod: 'code',
    code: 'PIERFITNESS',
  },
  {
    id: '7',
    title: 'Wine Tasting Experiences',
    provider: 'Napa & Sonoma Partner Vineyards',
    description: 'Complimentary private tastings at exclusive vineyards',
    category: 'lifestyle',
    benefit: 'Free private tastings',
    value: '$150-400 per session',
    locations: 'Napa Valley, Sonoma',
    terms: 'Book 2 weeks in advance',
    imageUrl: 'https://images.unsplash.com/photo-1705941077230-45abe11fe7dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYXBhJTIwdmluZXlhcmQlMjBsdXh1cnl8ZW58MXx8fHwxNzY0NTI1NjMxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    featured: false,
    activationMethod: 'request',
  },
  {
    id: '8',
    title: 'Last-Minute Flight Deals',
    provider: 'Private Jet Partners',
    description: 'Access to empty-leg private flights at 40-60% off',
    category: 'travel',
    benefit: '40-60% discount',
    value: 'Save $3,000-15,000',
    locations: 'US & International',
    terms: 'Based on availability, 72hr notice',
    imageUrl: 'https://images.unsplash.com/photo-1625513123245-fcb02d69ad12?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcml2YXRlJTIwamV0JTIwaW50ZXJpb3J8ZW58MXx8fHwxNzY0NTI1OTk1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    featured: false,
    activationMethod: 'request',
  },
  {
    id: '9',
    title: 'Spa & Wellness Credits',
    provider: 'Leading Spas Worldwide',
    description: '$200 monthly credit towards spa treatments and wellness services',
    category: 'wellness',
    benefit: '$200/month credit',
    value: '$2,400/year',
    locations: 'Partner spas globally',
    terms: 'Credit resets monthly, non-transferable',
    imageUrl: 'https://images.unsplash.com/photo-1582498674105-ad104fcc5784?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBzcGElMjByZXNvcnR8ZW58MXx8fHwxNzY0NDgxNzEyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    featured: true,
    activationMethod: 'automatic',
  },
];

const iconMap = {
  dining: UtensilsCrossed,
  transportation: Car,
  wellness: Sparkles,
  travel: Plane,
  lifestyle: Wine,
};

export function PerksPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { value: 'all', label: 'All Perks' },
    { value: 'dining', label: 'Dining', icon: UtensilsCrossed },
    { value: 'transportation', label: 'Transportation', icon: Car },
    { value: 'wellness', label: 'Wellness', icon: Sparkles },
    { value: 'travel', label: 'Travel', icon: Plane },
    { value: 'lifestyle', label: 'Lifestyle', icon: Wine },
  ];

  const filteredPerks = selectedCategory === 'all' 
    ? perks 
    : perks.filter(perk => perk.category === selectedCategory);

  const featuredPerks = perks.filter(perk => perk.featured);
  const totalValue = perks.reduce((sum, perk) => sum + 1, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-3">
            <Gift size={20} className="text-[#c9b896]" />
            <h1 style={{ fontSize: '36px', fontWeight: 300, letterSpacing: '-0.02em' }} className="text-[#e8e8e8]">
              Member Perks
            </h1>
          </div>
          <p className="text-[#a0a0a0]" style={{ fontSize: '16px', fontWeight: 300 }}>
            Exclusive benefits and preferred access available only to Pier members
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl bg-[#141414] border border-[#2a2a2a]"
          >
            <div className="flex items-center gap-3 mb-2">
              <Gift size={18} className="text-[#c9b896]" />
              <span className="text-[#6a6a6a]" style={{ fontSize: '12px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active Perks
              </span>
            </div>
            <p style={{ fontSize: '32px', fontWeight: 300 }} className="text-[#e8e8e8]">
              {totalValue}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl bg-[#141414] border border-[#2a2a2a]"
          >
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown size={18} className="text-[#c9b896]" />
              <span className="text-[#6a6a6a]" style={{ fontSize: '12px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Value
              </span>
            </div>
            <p style={{ fontSize: '32px', fontWeight: 300 }} className="text-[#e8e8e8]">
              $25k+
            </p>
            <p className="text-[#a0a0a0] mt-1" style={{ fontSize: '12px', fontWeight: 300 }}>
              Annual value
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-xl bg-[#141414] border border-[#2a2a2a]"
          >
            <div className="flex items-center gap-3 mb-2">
              <Clock size={18} className="text-[#c9b896]" />
              <span className="text-[#6a6a6a]" style={{ fontSize: '12px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                This Month
              </span>
            </div>
            <p style={{ fontSize: '32px', fontWeight: 300 }} className="text-[#e8e8e8]">
              $3.2k
            </p>
            <p className="text-[#a0a0a0] mt-1" style={{ fontSize: '12px', fontWeight: 300 }}>
              Saved in November
            </p>
          </motion.div>
        </div>

        {/* Filter */}
        <div className="mb-12 flex items-center gap-3 overflow-x-auto pb-2">
          <Filter size={18} className="text-[#6a6a6a] flex-shrink-0" />
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all whitespace-nowrap ${
                selectedCategory === category.value
                  ? 'bg-[#c9b896] text-[#0a0a0a]'
                  : 'bg-[#141414] border border-[#2a2a2a] text-[#a0a0a0] hover:border-[#3a3a3a] hover:text-[#e8e8e8]'
              }`}
              style={{ fontSize: '13px', fontWeight: 400 }}
            >
              {category.value !== 'all' && category.icon && <category.icon size={14} />}
              {category.label}
            </button>
          ))}
        </div>

        {/* Featured Perks */}
        {selectedCategory === 'all' && (
          <>
            <div className="mb-8">
              <h2 style={{ fontSize: '24px', fontWeight: 300, letterSpacing: '-0.01em' }} className="text-[#e8e8e8] mb-2">
                Featured This Month
              </h2>
              <p className="text-[#a0a0a0]" style={{ fontSize: '14px', fontWeight: 300 }}>
                Highest-value perks selected for you
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
              {featuredPerks.map((perk, index) => {
                const Icon = iconMap[perk.category];
                return (
                  <motion.div
                    key={perk.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -8 }}
                    className="group rounded-2xl bg-[#141414] border border-[#2a2a2a] hover:border-[#c9b896]/40 overflow-hidden transition-all"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-[#1a1a1a]">
                      <ImageWithFallback
                        src={perk.imageUrl}
                        alt={perk.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-[#0a0a0a]/80 backdrop-blur-sm border border-[#c9b896]/20">
                        <div className="flex items-center gap-1.5">
                          <Sparkles size={12} className="text-[#c9b896]" />
                          <span className="text-[#c9b896]" style={{ fontSize: '11px', fontWeight: 400 }}>
                            Featured
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-[#1a1a1a]">
                          <Icon size={18} className="text-[#c9b896]" />
                        </div>
                        <div className="flex-1">
                          <h3 style={{ fontSize: '18px', fontWeight: 400 }} className="text-[#e8e8e8] mb-1">
                            {perk.title}
                          </h3>
                          <p className="text-[#6a6a6a]" style={{ fontSize: '12px', fontWeight: 300 }}>
                            {perk.provider}
                          </p>
                        </div>
                        <span className="px-2 py-1 rounded-full bg-[#c9b896]/10 border border-[#c9b896]/20 text-[#c9b896]" style={{ fontSize: '11px', fontWeight: 400 }}>
                          {perk.value}
                        </span>
                      </div>

                      <p className="text-[#a0a0a0] mb-4" style={{ fontSize: '14px', fontWeight: 300, lineHeight: '1.6' }}>
                        {perk.description}
                      </p>

                      <div className="space-y-2 mb-4 pb-4 border-b border-[#1f1f1f]">
                        <div className="flex items-start gap-2">
                          <Check size={14} className="text-[#c9b896] mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-[#e8e8e8]" style={{ fontSize: '13px', fontWeight: 400 }}>
                              {perk.benefit}
                            </p>
                            {perk.locations && (
                              <p className="text-[#6a6a6a]" style={{ fontSize: '12px', fontWeight: 300 }}>
                                {perk.locations}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {perk.activationMethod === 'automatic' && (
                        <div className="flex items-center justify-between">
                          <p className="text-[#a0a0a0]" style={{ fontSize: '12px', fontWeight: 300 }}>
                            Automatically applied
                          </p>
                          <div className="px-3 py-1.5 rounded-lg bg-[#c9b896]/10 border border-[#c9b896]/20">
                            <span className="text-[#c9b896]" style={{ fontSize: '12px', fontWeight: 400 }}>
                              Active
                            </span>
                          </div>
                        </div>
                      )}

                      {perk.activationMethod === 'code' && perk.code && (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[#6a6a6a] mb-1" style={{ fontSize: '11px', fontWeight: 300, textTransform: 'uppercase' }}>
                              Promo Code
                            </p>
                            <p className="text-[#c9b896] font-mono" style={{ fontSize: '14px', fontWeight: 400 }}>
                              {perk.code}
                            </p>
                          </div>
                          <button className="px-4 py-2 rounded-lg bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#e8e8e8] transition-colors" style={{ fontSize: '13px', fontWeight: 400 }}>
                            Copy Code
                          </button>
                        </div>
                      )}

                      {perk.activationMethod === 'request' && (
                        <button className="w-full px-4 py-2.5 rounded-lg bg-[#c9b896] hover:bg-[#d4c4a6] text-[#0a0a0a] transition-all" style={{ fontSize: '13px', fontWeight: 400 }}>
                          Request via Concierge
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {/* All Perks Grid */}
        <div className="mb-8">
          <h2 style={{ fontSize: '24px', fontWeight: 300, letterSpacing: '-0.01em' }} className="text-[#e8e8e8] mb-2">
            {selectedCategory === 'all' ? 'All Perks' : `${categories.find(c => c.value === selectedCategory)?.label} Perks`}
          </h2>
          <p className="text-[#a0a0a0]" style={{ fontSize: '14px', fontWeight: 300 }}>
            {filteredPerks.length} perks available
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPerks.map((perk, index) => {
            const Icon = iconMap[perk.category];
            return (
              <motion.div
                key={perk.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -8 }}
                className="group rounded-2xl bg-[#141414] border border-[#2a2a2a] hover:border-[#c9b896]/40 overflow-hidden transition-all"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#1a1a1a]">
                  <ImageWithFallback
                    src={perk.imageUrl}
                    alt={perk.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#c9b896]/90 backdrop-blur-sm">
                    <span className="text-[#0a0a0a]" style={{ fontSize: '10px', fontWeight: 400 }}>
                      {perk.value}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-[#1a1a1a]">
                      <Icon size={16} className="text-[#c9b896]" />
                    </div>
                    <div className="flex-1">
                      <h4 style={{ fontSize: '16px', fontWeight: 400 }} className="text-[#e8e8e8] mb-1">
                        {perk.title}
                      </h4>
                      <p className="text-[#6a6a6a]" style={{ fontSize: '11px', fontWeight: 300 }}>
                        {perk.provider}
                      </p>
                    </div>
                  </div>

                  <p className="text-[#a0a0a0] mb-4" style={{ fontSize: '13px', fontWeight: 300, lineHeight: '1.6' }}>
                    {perk.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-[#1f1f1f]">
                    <p className="text-[#c9b896]" style={{ fontSize: '13px', fontWeight: 400 }}>
                      {perk.benefit}
                    </p>
                    {perk.activationMethod === 'automatic' && (
                      <div className="px-2 py-1 rounded bg-[#c9b896]/10">
                        <span className="text-[#c9b896]" style={{ fontSize: '10px', fontWeight: 400 }}>
                          AUTO
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
