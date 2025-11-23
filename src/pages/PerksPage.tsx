import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Sparkles, MapPin } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { getPerks } from '../lib/api/perks';
import { callOrchestrator } from '../lib/api/orchestrator';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import type { Perk } from '../types';

const PerksPage: React.FC = () => {
  const { user } = useAuth();
  const [allPerks, setAllPerks] = useState<Perk[]>([]);
  const [filteredPerks, setFilteredPerks] = useState<Perk[]>([]);
  const [recommendedPerkIds, setRecommendedPerkIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecommending, setIsRecommending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const categories = ['Dining', 'Hotels', 'Experiences', 'Lifestyle'];
  const cities = ['New York', 'Los Angeles', 'Miami', 'London', 'Paris'];
  const tags = [
    'Michelin Star',
    'Exclusive Access',
    'Private Dining',
    'Luxury',
    'Boutique',
    'Resort',
    'Adventure',
    'Cultural',
    'Wellness',
    'Shopping',
    'Entertainment'
  ];

  useEffect(() => {
    loadPerks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allPerks, searchQuery, selectedCategory, selectedCity, selectedTags]);

  const loadPerks = async () => {
    setIsLoading(true);
    try {
      const perksData = await getPerks();
      setAllPerks(perksData);
    } catch (error) {
      console.error('Failed to load perks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allPerks];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        perk =>
          perk.title.toLowerCase().includes(query) ||
          perk.short_description?.toLowerCase().includes(query) ||
          perk.description?.toLowerCase().includes(query)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(perk => perk.category === selectedCategory.toLowerCase());
    }

    if (selectedCity) {
      filtered = filtered.filter(perk => perk.city === selectedCity);
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter(perk =>
        selectedTags.some(tag => perk.tags?.includes(tag.toLowerCase()))
      );
    }

    setFilteredPerks(filtered);
  };

  const handleRecommendPerks = async () => {
    if (!user) return;

    setIsRecommending(true);
    try {
      // TODO: Call actual orchestrator endpoint
      const response = await callOrchestrator({
        userId: user.id,
        input: 'Recommend perks for me',
        source: 'portal',
        context: { page: 'perks' }
      });

      const perkModule = response.messages[0]?.modules?.find(
        m => m.type === 'perk_recommendations'
      );

      if (perkModule && perkModule.type === 'perk_recommendations') {
        setRecommendedPerkIds(perkModule.perkIds);
      }
    } catch (error) {
      console.error('Failed to get recommendations:', error);
    } finally {
      setIsRecommending(false);
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  const toggleCity = (city: string) => {
    setSelectedCity(selectedCity === city ? null : city);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const recommendedPerks = filteredPerks.filter(perk =>
    recommendedPerkIds.includes(perk.id)
  );
  const otherPerks = filteredPerks.filter(
    perk => !recommendedPerkIds.includes(perk.id)
  );

  const categoryColors: Record<string, string> = {
    dining: 'bg-orange-100 text-orange-800',
    hotels: 'bg-blue-100 text-blue-800',
    experiences: 'bg-purple-100 text-purple-800',
    lifestyle: 'bg-green-100 text-green-800'
  };

  return (
    <PageLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">
            Exclusive Perks
          </h1>
          <p className="text-lg text-gray-600">
            Discover premium benefits tailored for Pier members.
          </p>
        </motion.div>

        {/* AI Recommendation Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Not sure where to start?
                </h3>
                <p className="text-sm text-gray-600">
                  Let AI recommend perks based on your preferences and upcoming trips
                </p>
              </div>
            </div>
            <button
              onClick={handleRecommendPerks}
              disabled={isRecommending}
              className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isRecommending ? 'Thinking...' : 'Recommend perks for me'}
            </button>
          </div>
        </motion.div>

        {/* Filters Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-gray-200 rounded-xl p-6 space-y-6"
        >
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search perks, hotels, restaurants, experiences…"
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Chips */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* City Chips */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">City</label>
            <div className="flex flex-wrap gap-2">
              {cities.map(city => (
                <button
                  key={city}
                  onClick={() => toggleCity(city)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCity === city
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Tag Filters */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Filters
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Recommended Perks Section */}
        {recommendedPerks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h2 className="text-2xl font-serif font-bold text-gray-900">
                Recommended for you
              </h2>
            </div>
            <PerkGrid perks={recommendedPerks} categoryColors={categoryColors} />
          </motion.div>
        )}

        {/* All Perks */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          {recommendedPerks.length > 0 && (
            <h2 className="text-2xl font-serif font-bold text-gray-900">All perks</h2>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
            </div>
          ) : filteredPerks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No perks found matching your criteria.</p>
            </div>
          ) : (
            <PerkGrid perks={otherPerks} categoryColors={categoryColors} />
          )}
        </motion.div>
      </div>
    </PageLayout>
  );
};

const PerkGrid: React.FC<{
  perks: Perk[];
  categoryColors: Record<string, string>;
}> = ({ perks, categoryColors }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {perks.map(perk => (
      <Link
        key={perk.id}
        to={`/perks/${perk.id}`}
        className="group block bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all"
      >
        <div className="aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            src={perk.image_url}
            alt={perk.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                categoryColors[perk.category] || 'bg-gray-100 text-gray-800'
              }`}
            >
              {perk.category}
            </span>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="w-3 h-3" />
              {perk.city}
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-gray-600 transition-colors">
            {perk.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {perk.short_description}
          </p>
        </div>
      </Link>
    ))}
  </div>
);

export default PerksPage;
