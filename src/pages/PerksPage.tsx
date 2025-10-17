import React, { useState, useEffect } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { FilterBar } from '../components/features/FilterBar';
import { Card } from '../components/ui/Card';
import { getPerks } from '../lib/api/perks';
import { useAuth } from '../context/AuthContext';
import type { Perk } from '../types';

const PerksPage: React.FC = () => {
  const [filteredPerks, setFilteredPerks] = useState<Perk[]>([]);
  const [allPerks, setAllPerks] = useState<Perk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Categories
  const categories = [
    { label: 'Dining', value: 'dining' },
    { label: 'Hotels', value: 'hotels' },
    { label: 'Experiences', value: 'experiences' },
    { label: 'Lifestyle', value: 'lifestyle' },
  ];

  // Cities
  const cities = [
    { label: 'New York', value: 'New York' },
    { label: 'Los Angeles', value: 'Los Angeles' },
    { label: 'Miami', value: 'Miami' },
    { label: 'London', value: 'London' },
    { label: 'Paris', value: 'Paris' },
  ];

  // Membership Levels
  const membershipLevels = [
    { label: 'All Levels', value: 'all' },
    { label: 'Standard', value: 'Standard' },
    { label: 'Premium+', value: 'Premium' },
    { label: 'Executive+', value: 'Executive' },
    { label: 'Founding Member', value: 'Founding Member' },
  ];

  // Subfilters
  const subfilters = [
    { label: 'Michelin Star', value: 'michelin' },
    { label: 'Exclusive Access', value: 'exclusive' },
    { label: 'Private Dining', value: 'private' },
    { label: 'Luxury', value: 'luxury' },
    { label: 'Boutique', value: 'boutique' },
    { label: 'Resort', value: 'resort' },
    { label: 'Adventure', value: 'adventure' },
    { label: 'Cultural', value: 'cultural' },
    { label: 'Wellness', value: 'wellness' },
    { label: 'Shopping', value: 'shopping' },
    { label: 'Entertainment', value: 'entertainment' },
  ];

  useEffect(() => {
    const loadPerks = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const perksData = await getPerks();
        setAllPerks(perksData);
        setFilteredPerks(perksData);
      } catch (err) {
        console.error('Failed to load perks:', err);
        setError('Failed to load perks. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPerks();
  }, []);

  const handleFilterChange = (filters: {
    category: string | null;
    city: string | null;
    subfilter: string | null;
    search: string;
  }) => {
    let filtered = [...allPerks];
    
    // Filter by category
    if (filters.category) {
      filtered = filtered.filter(perk => perk.category === filters.category);
    }
    
    // Filter by city
    if (filters.city) {
      filtered = filtered.filter(perk => perk.city === filters.city);
    }
    
    // Filter by subfilter (tag)
    if (filters.subfilter) {
      filtered = filtered.filter(perk => perk.tags?.includes(filters.subfilter));
    }
    
    // Filter by search term
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        perk => 
          perk.title.toLowerCase().includes(searchLower) ||
          perk.short_description.toLowerCase().includes(searchLower) ||
          (perk.tags && perk.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }
    
    setFilteredPerks(filtered);
  };

  return (
    <PageLayout>
      <div className="container-custom py-12">
        <h1 className="text-4xl font-display font-medium mb-2">Exclusive Perks</h1>
        <p className="text-primary-600 mb-8">Discover premium benefits tailored for Pier members.</p>
        
        {/* Filters */}
        <div className="mb-8">
          <FilterBar
            categories={categories}
            cities={cities}
            subfilters={subfilters}
            onFilterChange={handleFilterChange}
          />
        </div>
        
        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="text-primary-600 underline"
            >
              Try Again
            </button>
          </div>
        )}
        
        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-900"></div>
          </div>
        ) : filteredPerks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPerks.map(perk => (
              <Card
                key={perk.id}
                image={perk.image_url}
                title={perk.title}
                description={perk.short_description}
                category={perk.category}
                tags={[
                  ...(perk.minimum_level ? [`${perk.minimum_level}+`] : []),
                  ...(perk.tags || [])
                ]}
                link={`/perks/${perk.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-2xl font-medium mb-2">No perks found</h3>
            <p className="text-primary-600">Try adjusting your filters or search criteria.</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default PerksPage;