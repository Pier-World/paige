import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Search } from 'lucide-react';
import { Button } from '../ui/Button';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  categories: FilterOption[];
  cities: FilterOption[];
  subfilters?: FilterOption[];
  membershipLevels?: FilterOption[];
  onFilterChange: (filters: {
    category: string | null;
    city: string | null;
    subfilter: string | null;
    search: string;
    membershipLevel?: string | null;
  }) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  categories,
  cities,
  subfilters = [],
  membershipLevels = [],
  onFilterChange,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedSubfilter, setSelectedSubfilter] = useState<string | null>(null);
  const [selectedMembershipLevel, setSelectedMembershipLevel] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleCategoryChange = (category: string) => {
    const newCategory = selectedCategory === category ? null : category;
    setSelectedCategory(newCategory);
    updateFilters(newCategory, selectedCity, selectedSubfilter, searchQuery, selectedMembershipLevel);
  };

  const handleCityChange = (city: string) => {
    const newCity = selectedCity === city ? null : city;
    setSelectedCity(newCity);
    updateFilters(selectedCategory, newCity, selectedSubfilter, searchQuery, selectedMembershipLevel);
  };

  const handleSubfilterChange = (subfilter: string) => {
    const newSubfilter = selectedSubfilter === subfilter ? null : subfilter;
    setSelectedSubfilter(newSubfilter);
    updateFilters(selectedCategory, selectedCity, newSubfilter, searchQuery, selectedMembershipLevel);
  };

  const handleMembershipLevelChange = (level: string) => {
    const newLevel = selectedMembershipLevel === level ? null : level;
    setSelectedMembershipLevel(newLevel);
    updateFilters(selectedCategory, selectedCity, selectedSubfilter, searchQuery, newLevel);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters(selectedCategory, selectedCity, selectedSubfilter, searchQuery, selectedMembershipLevel);
  };

  const handleReset = () => {
    setSelectedCategory(null);
    setSelectedCity(null);
    setSelectedSubfilter(null);
    setSelectedMembershipLevel(null);
    setSearchQuery('');
    updateFilters(null, null, null, '', null);
  };

  const updateFilters = (
    category: string | null,
    city: string | null,
    subfilter: string | null,
    search: string,
    membershipLevel: string | null = null
  ) => {
    onFilterChange({
      category,
      city,
      subfilter,
      search,
      ...(membershipLevels.length > 0 && { membershipLevel })
    });
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <div className="bg-white shadow-subtle rounded-lg">
      {/* Search Bar - Always Visible */}
      <div className="p-4 border-b border-primary-100">
        <form onSubmit={handleSearch} className="flex items-center space-x-2">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-400" size={18} />
          </div>
          <Button type="submit" variant="primary">
            Search
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={toggleFilters}
            className="md:hidden"
          >
            <Filter size={18} />
          </Button>
        </form>
      </div>

      {/* Filter Section - Responsive */}
      <AnimatePresence>
        {(showFilters || window.innerWidth >= 768) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Categories */}
              <div>
                <h3 className="text-sm font-medium mb-2">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.value}
                      onClick={() => handleCategoryChange(category.value)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        selectedCategory === category.value
                          ? 'bg-primary-900 text-white'
                          : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cities */}
              <div>
                <h3 className="text-sm font-medium mb-2">Cities</h3>
                <div className="flex flex-wrap gap-2">
                  {cities.map((city) => (
                    <button
                      key={city.value}
                      onClick={() => handleCityChange(city.value)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        selectedCity === city.value
                          ? 'bg-primary-900 text-white'
                          : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                      }`}
                    >
                      {city.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Membership Levels - only show if provided */}
              {membershipLevels.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Membership Level</h3>
                  <div className="flex flex-wrap gap-2">
                    {membershipLevels.map((level) => (
                      <button
                        key={level.value}
                        onClick={() => handleMembershipLevelChange(level.value)}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                          selectedMembershipLevel === level.value
                            ? 'bg-primary-900 text-white'
                            : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                        }`}
                      >
                        {level.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Subfilters */}
              {subfilters.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Additional Filters</h3>
                  <div className="flex flex-wrap gap-2">
                    {subfilters.map((subfilter) => (
                      <button
                        key={subfilter.value}
                        onClick={() => handleSubfilterChange(subfilter.value)}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                          selectedSubfilter === subfilter.value
                            ? 'bg-primary-900 text-white'
                            : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                        }`}
                      >
                        {subfilter.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Applied Filters & Reset */}
              {(selectedCategory || selectedCity || selectedSubfilter || selectedMembershipLevel) && (
                <div className="flex justify-between items-center pt-2 border-t border-primary-100">
                  <div className="flex flex-wrap gap-2">
                    {selectedCategory && (
                      <div className="flex items-center bg-primary-900 text-white px-3 py-1 rounded-full text-sm">
                        {categories.find(c => c.value === selectedCategory)?.label}
                        <button 
                          onClick={() => handleCategoryChange(selectedCategory)}
                          className="ml-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    
                    {selectedCity && (
                      <div className="flex items-center bg-primary-900 text-white px-3 py-1 rounded-full text-sm">
                        {cities.find(c => c.value === selectedCity)?.label}
                        <button 
                          onClick={() => handleCityChange(selectedCity)}
                          className="ml-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    
                    {selectedMembershipLevel && (
                      <div className="flex items-center bg-primary-900 text-white px-3 py-1 rounded-full text-sm">
                        {membershipLevels.find(l => l.value === selectedMembershipLevel)?.label}
                        <button 
                          onClick={() => handleMembershipLevelChange(selectedMembershipLevel)}
                          className="ml-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    
                    {selectedSubfilter && (
                      <div className="flex items-center bg-primary-900 text-white px-3 py-1 rounded-full text-sm">
                        {subfilters.find(s => s.value === selectedSubfilter)?.label}
                        <button 
                          onClick={() => handleSubfilterChange(selectedSubfilter)}
                          className="ml-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="text-primary-500"
                  >
                    Reset All
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};