import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PageLayout } from '../components/layout/PageLayout';
import { Sparkles, Users, MapPin, Calendar, Clock, ArrowUpRight, Filter } from 'lucide-react';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';
import { ExperienceDetail, ExperienceDetailData } from '../components/ui/ExperienceDetail';

interface Experience {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  date: string;
  location: string;
  duration: string;
  capacity: string;
  spotsLeft: number;
  category: 'dining' | 'travel' | 'wellness' | 'culture' | 'networking';
  price: string;
  imageUrl: string;
  featured: boolean;
}

const defaultExperiences: Experience[] = [
  {
    id: '1',
    title: 'Private Dinner with Founders',
    description: 'An intimate evening with leading founders and investors',
    longDescription: 'Join us for an exclusive evening at a three-Michelin-starred restaurant. Connect with industry leaders in an intimate setting designed for meaningful conversation and relationship building.',
    date: 'Dec 15, 2025',
    location: 'San Francisco, CA',
    duration: '3 hours',
    capacity: '12 seats',
    spotsLeft: 3,
    category: 'dining',
    price: 'Included',
    imageUrl: 'https://images.unsplash.com/photo-1759646827844-bbbdbfd0ada2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcml2YXRlJTIwZGlubmVyJTIwZXZlbnR8ZW58MXx8fHwxNzY0NTI1OTk0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    featured: true,
  },
  {
    id: '2',
    title: 'Mediterranean Yacht Experience',
    description: 'Three-day sailing journey along the Amalfi Coast',
    longDescription: 'Experience the ultimate luxury aboard a private yacht. This curated journey includes gourmet dining, exclusive shore excursions, and unparalleled views of the Mediterranean coastline.',
    date: 'Jan 20-22, 2026',
    location: 'Amalfi Coast, Italy',
    duration: '3 days',
    capacity: '8 guests',
    spotsLeft: 2,
    category: 'travel',
    price: '$4,500',
    imageUrl: 'https://images.unsplash.com/photo-1740482882563-bccef548b8dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjB5YWNodCUyMHN1bnNldHxlbnwxfHx8fDE3NjQ1MjU5OTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    featured: true,
  },
  {
    id: '3',
    title: 'Exclusive Golf & Whiskey Weekend',
    description: 'Championship golf with rare whiskey tastings',
    longDescription: 'Play on one of the world\'s most exclusive courses followed by private tastings of rare single malts with a master distiller. Limited to serious golf enthusiasts.',
    date: 'Feb 10-12, 2026',
    location: 'Pebble Beach, CA',
    duration: '2 days',
    capacity: '16 players',
    spotsLeft: 5,
    category: 'networking',
    price: '$3,200',
    imageUrl: 'https://images.unsplash.com/photo-1662196992613-fc005f1f1869?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxleGNsdXNpdmUlMjBnb2xmJTIwY291cnNlfGVufDF8fHx8MTc2NDUyNTk5NXww&ixlib=rb-4.1.0&q=80&w=1080',
    featured: false,
  },
  {
    id: '4',
    title: 'Private Jet Wine Country Tour',
    description: 'Curated vineyard visits via private aviation',
    longDescription: 'Travel in style to Napa and Sonoma\'s most prestigious vineyards. Meet winemakers, taste library vintages, and enjoy chef-prepared meals at each location.',
    date: 'Mar 5, 2026',
    location: 'Napa Valley, CA',
    duration: '1 day',
    capacity: '6 guests',
    spotsLeft: 1,
    category: 'travel',
    price: '$2,800',
    imageUrl: 'https://images.unsplash.com/photo-1625513123245-fcb02d69ad12?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcml2YXRlJTIwamV0JTIwaW50ZXJpb3J8ZW58MXx8fHwxNzY0NTI1OTk1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    featured: true,
  },
  {
    id: '5',
    title: 'Rare Wine Cellar Experience',
    description: 'Private access to legendary wine collections',
    longDescription: 'Gain exclusive access to private cellars featuring some of the world\'s rarest wines. Led by a master sommelier, this intimate tasting is limited to true connoisseurs.',
    date: 'Mar 18, 2026',
    location: 'Bordeaux, France',
    duration: '4 hours',
    capacity: '10 guests',
    spotsLeft: 4,
    category: 'culture',
    price: '$1,800',
    imageUrl: 'https://images.unsplash.com/photo-1674649204328-6b49e7a7e817?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaW5lJTIwd2luZSUyMGNlbGxhcnxlbnwxfHx8fDE3NjQ1MjU5OTZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    featured: false,
  },
  {
    id: '6',
    title: 'Wellness Retreat in Bali',
    description: 'Five-day transformation at a private resort',
    longDescription: 'Rejuvenate at an exclusive wellness sanctuary. This experience includes private yoga sessions, spa treatments, meditation coaching, and organic farm-to-table cuisine.',
    date: 'Apr 15-20, 2026',
    location: 'Ubud, Bali',
    duration: '5 days',
    capacity: '12 guests',
    spotsLeft: 7,
    category: 'wellness',
    price: '$5,200',
    imageUrl: 'https://images.unsplash.com/photo-1582498674105-ad104fcc5784?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBzcGElMjByZXNvcnR8ZW58MXx8fHwxNzY0NDgxNzEyfDA&ixlib=rb-4.1.0&q=80&w=1080',
    featured: false,
  },
];

const ExperiencesPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedExperience, setSelectedExperience] = useState<ExperienceDetailData | null>(null);

  const categories = [
    { value: 'all', label: 'All Experiences' },
    { value: 'dining', label: 'Dining' },
    { value: 'travel', label: 'Travel' },
    { value: 'wellness', label: 'Wellness' },
    { value: 'culture', label: 'Culture' },
    { value: 'networking', label: 'Networking' },
  ];

  const filteredExperiences = selectedCategory === 'all' 
    ? defaultExperiences 
    : defaultExperiences.filter(exp => exp.category === selectedCategory);

  const featuredExperiences = defaultExperiences.filter(exp => exp.featured);

  const handleExperienceClick = (experience: Experience) => {
    // Convert Experience to ExperienceDetailData
    const detailData: ExperienceDetailData = {
      id: experience.id,
      title: experience.title,
      description: experience.description,
      longDescription: experience.longDescription,
      date: experience.date,
      location: experience.location,
      duration: experience.duration,
      capacity: experience.capacity,
      spotsLeft: experience.spotsLeft,
      category: experience.category,
      price: experience.price,
      imageUrl: experience.imageUrl,
      featured: experience.featured,
    };
    setSelectedExperience(detailData);
  };

  const handleRequestInvitation = async (experienceId: string) => {
    // TODO: Implement invitation request logic
    console.log('Requesting invitation for experience:', experienceId);
    // This could call an API endpoint or open concierge chat
  };

  return (
    <PageLayout>
      <main className="pt-24 pb-20 bg-background min-h-screen">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={20} className="text-accent" />
              <h1 style={{ fontSize: '36px', fontWeight: 300, letterSpacing: '-0.02em' }} className="text-text-primary">
                Exclusive Experiences
              </h1>
            </div>
            <p className="text-text-secondary" style={{ fontSize: '16px', fontWeight: 300 }}>
              Curated opportunities and events available only to Pier members
            </p>
          </div>

          {/* Filter */}
          <div className="mb-12 flex items-center gap-3 overflow-x-auto pb-2">
            <Filter size={18} className="text-text-tertiary flex-shrink-0" />
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-full transition-all whitespace-nowrap ${
                  selectedCategory === category.value
                    ? 'bg-accent text-background'
                    : 'bg-surface border border-border text-text-secondary hover:border-[#3a3a3a] hover:text-text-primary'
                }`}
                style={{ fontSize: '13px', fontWeight: 400 }}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Featured Section */}
          {selectedCategory === 'all' && (
            <>
              <div className="mb-8">
                <h2 style={{ fontSize: '24px', fontWeight: 300, letterSpacing: '-0.01em' }} className="text-text-primary mb-2">
                  Featured This Month
                </h2>
                <p className="text-text-secondary" style={{ fontSize: '14px', fontWeight: 300 }}>
                  Hand-selected experiences with limited availability
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
                {featuredExperiences.map((experience, index) => (
                  <motion.div
                    key={experience.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -8 }}
                    onClick={() => handleExperienceClick(experience)}
                    className="group rounded-2xl bg-surface border border-border hover:border-accent/40 overflow-hidden transition-all cursor-pointer"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-surface-elevated">
                      <ImageWithFallback
                        src={experience.imageUrl}
                        alt={experience.title}
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
                      {experience.spotsLeft <= 3 && (
                        <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-accent/90 backdrop-blur-sm">
                          <span className="text-background" style={{ fontSize: '11px', fontWeight: 400 }}>
                            Only {experience.spotsLeft} spots left
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <h3 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary mb-2">
                        {experience.title}
                      </h3>
                      <p className="text-text-secondary mb-4" style={{ fontSize: '14px', fontWeight: 300, lineHeight: '1.6' }}>
                        {experience.longDescription}
                      </p>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-text-secondary" style={{ fontSize: '13px', fontWeight: 300 }}>
                          <Calendar size={14} />
                          <span>{experience.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-secondary" style={{ fontSize: '13px', fontWeight: 300 }}>
                          <Clock size={14} />
                          <span>{experience.duration}</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-secondary" style={{ fontSize: '13px', fontWeight: 300 }}>
                          <MapPin size={14} />
                          <span>{experience.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-secondary" style={{ fontSize: '13px', fontWeight: 300 }}>
                          <Users size={14} />
                          <span>{experience.capacity}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                        <div>
                          <p className="text-text-tertiary mb-1" style={{ fontSize: '11px', fontWeight: 300, textTransform: 'uppercase' }}>
                            Member Price
                          </p>
                          <p className="text-accent" style={{ fontSize: '18px', fontWeight: 400 }}>
                            {experience.price}
                          </p>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExperienceClick(experience);
                          }}
                          className="px-5 py-2.5 rounded-lg bg-accent hover:bg-[#d4c4a6] text-background transition-all" 
                          style={{ fontSize: '13px', fontWeight: 400 }}
                        >
                          Request Invitation
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {/* All Experiences Grid */}
          <div className="mb-8">
            <h2 style={{ fontSize: '24px', fontWeight: 300, letterSpacing: '-0.01em' }} className="text-text-primary mb-2">
              {selectedCategory === 'all' ? 'All Experiences' : `${categories.find(c => c.value === selectedCategory)?.label} Experiences`}
            </h2>
            <p className="text-text-secondary" style={{ fontSize: '14px', fontWeight: 300 }}>
              {filteredExperiences.length} experiences available
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExperiences.map((experience, index) => (
              <motion.div
                key={experience.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -8 }}
                onClick={() => handleExperienceClick(experience)}
                className="group rounded-2xl bg-surface border border-border hover:border-accent/40 overflow-hidden transition-all cursor-pointer"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-elevated">
                  <ImageWithFallback
                    src={experience.imageUrl}
                    alt={experience.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  {experience.spotsLeft <= 3 && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-accent/90 backdrop-blur-sm">
                      <span className="text-background" style={{ fontSize: '10px', fontWeight: 400 }}>
                        {experience.spotsLeft} left
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h4 style={{ fontSize: '16px', fontWeight: 400 }} className="text-text-primary mb-2">
                    {experience.title}
                  </h4>
                  <p className="text-text-secondary mb-4" style={{ fontSize: '13px', fontWeight: 300, lineHeight: '1.6' }}>
                    {experience.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-text-secondary" style={{ fontSize: '12px', fontWeight: 300 }}>
                      <Calendar size={12} />
                      <span>{experience.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary" style={{ fontSize: '12px', fontWeight: 300 }}>
                      <MapPin size={12} />
                      <span>{experience.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                    <p className="text-accent" style={{ fontSize: '14px', fontWeight: 400 }}>
                      {experience.price}
                    </p>
                    <ArrowUpRight size={16} className="text-text-tertiary group-hover:text-accent transition-colors" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* Experience Detail Modal */}
      <ExperienceDetail
        experience={selectedExperience}
        isOpen={selectedExperience !== null}
        onClose={() => setSelectedExperience(null)}
        onRequestInvitation={handleRequestInvitation}
      />
    </PageLayout>
  );
};

export default ExperiencesPage;

