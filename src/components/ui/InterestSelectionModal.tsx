import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Sparkles, Check, Plus } from 'lucide-react';

interface InterestSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (interest: string) => void;
  selectedInterests: string[];
}

// Interest categories with predefined options
const INTEREST_CATEGORIES = {
  'Travel': [
    'Luxury Hotels', 'Boutique Hotels', 'Beach Destinations', 'City Breaks',
    'Ski Resorts', 'Safari', 'Cruises', 'Private Jets', 'Yacht Charters'
  ],
  'Dining': [
    'Fine Dining', 'Michelin Starred', 'Farm-to-Table', 'Wine Tasting',
    'Cocktail Bars', 'Rooftop Dining', 'Private Dining', 'Chef Experiences'
  ],
  'Lifestyle': [
    'Fashion', 'Art & Culture', 'Music & Concerts', 'Theater',
    'Sports Events', 'Wellness & Spa', 'Fitness', 'Yoga'
  ],
  'Family': [
    'Family-Friendly Hotels', 'Kids Activities', 'Educational Experiences',
    'Theme Parks', 'Family Dining', 'Childcare Services'
  ],
  'Business': [
    'Business Hotels', 'Meeting Spaces', 'Coworking', 'Networking Events',
    'Conferences', 'Corporate Events', 'Business Dining'
  ],
  'Wellness': [
    'Spa Treatments', 'Meditation', 'Retreats', 'Holistic Health',
    'Nutrition', 'Mental Wellness', 'Fitness Programs'
  ],
};

export function InterestSelectionModal({
  isOpen,
  onClose,
  onSelect,
  selectedInterests,
}: InterestSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Travel', 'Dining', 'Lifestyle']));

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Flatten all interests for search
  const allInterests = Object.entries(INTEREST_CATEGORIES).flatMap(([category, interests]) =>
    interests.map(interest => ({ category, interest }))
  );

  const filteredInterests = searchQuery
    ? allInterests.filter(item =>
        item.interest.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !selectedInterests.includes(item.interest)
      )
    : Object.entries(INTEREST_CATEGORIES).flatMap(([category, interests]) =>
        expandedCategories.has(category)
          ? interests
              .filter(interest => !selectedInterests.includes(interest))
              .map(interest => ({ category, interest }))
          : []
      );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-2xl bg-background border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-border-subtle flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary">
                    Add Interest
                  </h3>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-surface-elevated transition-colors"
                  >
                    <X size={20} className="text-text-tertiary" />
                  </button>
                </div>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search interests..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-accent"
                    style={{ fontSize: '14px', fontWeight: 400 }}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {searchQuery ? (
                  // Search results view
                  filteredInterests.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-text-tertiary" style={{ fontSize: '14px', fontWeight: 300 }}>
                        No interests found
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredInterests.map((item, index) => (
                        <button
                          key={`${item.category}-${item.interest}-${index}`}
                          onClick={() => {
                            onSelect(item.interest);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-accent/40 hover:bg-surface transition-all text-left"
                        >
                          <Sparkles size={18} className="text-accent flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-text-primary block" style={{ fontSize: '14px', fontWeight: 400 }}>
                              {item.interest}
                            </span>
                            <span className="text-text-tertiary text-xs">{item.category}</span>
                          </div>
                          <div className="w-5 h-5 rounded-full border-2 border-accent/30 flex items-center justify-center">
                            <Plus size={12} className="text-accent" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )
                ) : (
                  // Category view
                  <div className="space-y-4">
                    {Object.entries(INTEREST_CATEGORIES).map(([category, interests]) => {
                      const availableInterests = interests.filter(i => !selectedInterests.includes(i));
                      if (availableInterests.length === 0) return null;

                      return (
                        <div key={category}>
                          <button
                            onClick={() => toggleCategory(category)}
                            className="w-full flex items-center justify-between p-3 rounded-lg bg-surface-elevated border border-border hover:border-accent/40 transition-all mb-2"
                          >
                            <span className="text-text-primary" style={{ fontSize: '15px', fontWeight: 400 }}>
                              {category}
                            </span>
                            <span className="text-text-tertiary text-xs">
                              {expandedCategories.has(category) ? '−' : '+'}
                            </span>
                          </button>
                          {expandedCategories.has(category) && (
                            <div className="space-y-2 pl-4">
                              {availableInterests.map((interest) => (
                                <button
                                  key={interest}
                                  onClick={() => onSelect(interest)}
                                  className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-border hover:border-accent/40 hover:bg-surface transition-all text-left"
                                >
                                  <Sparkles size={16} className="text-accent flex-shrink-0" />
                                  <span className="text-text-primary flex-1" style={{ fontSize: '13px', fontWeight: 400 }}>
                                    {interest}
                                  </span>
                                  <div className="w-5 h-5 rounded-full border-2 border-accent/30 flex items-center justify-center">
                                    <Plus size={10} className="text-accent" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

