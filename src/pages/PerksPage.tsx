import { Wine, Car, Sparkles, UtensilsCrossed, Plane, Gift, Clock, TrendingDown, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';
import { useState } from 'react';
import { PerkDetail, PerkDetailData } from '../components/ui/PerkDetail';
import { PageLayout } from '../components/layout/PageLayout';
import { perks, perkDetailsData } from '../data/perks';

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

  const handlePerkClick = (perkId: string) => {
    const perkDetail = perkDetailsData[perkId];
    if (perkDetail) {
      setSelectedPerk(perkDetail);
    }
  };

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
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -8 }}
                      onClick={() => handlePerkClick(perk.id)}
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
                              {perk.provider}
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
              {filteredPerks.length} perks available
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
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -8 }}
                  onClick={() => handlePerkClick(perk.id)}
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
                          {perk.provider}
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
      </div>
    </PageLayout>
  );
}

export default PerksPage;
