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

  const categories = [
    { label: 'Dining', value: 'dining' },
    { label: 'Hotels', value: 'hotels' },
    { label: 'Experiences', value: 'experiences' },
    { label: 'Lifestyle', value: 'lifestyle' },
  ];

  const cities = [
    { label: 'New York', value: 'New York' },
    { label: 'Los Angeles', value: 'Los Angeles' },
    { label: 'Miami', value: 'Miami' },
    { label: 'London', value: 'London' },
    { label: 'Paris', value: 'Paris' },
  ];

  const membershipLevels = [
    { label: 'All Levels', value: 'all' },
    { label: 'Standard', value: 'Standard' },
    { label: 'Premium+', value: 'Premium' },
    { label: 'Executive+', value: 'Executive' },
    { label: 'Founding Member', value: 'Founding Member' },
  ];

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

    if (filters.category) {
      filtered = filtered.filter(perk => perk.category === filters.category);
    }

    if (filters.city) {
      filtered = filtered.filter(perk => perk.city === filters.city);
    }

    if (filters.subfilter) {
      filtered = filtered.filter(perk => perk.tags?.includes(filters.subfilter));
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(perk =>
        perk.title.toLowerCase().includes(searchLower) ||
        perk.short_description?.toLowerCase().includes(searchLower) ||
        perk.description?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredPerks(filtered);
  };

  return (
    <PageLayout>
      <div className="container-custom py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-serif font-light mb-4 text-neutral-900">Exclusive Perks</h1>
          <p className="text-lg text-neutral-600">
            Discover premium benefits tailored for Pier members.
          </p>
        </div>

        <FilterBar
          categories={categories}
          cities={cities}
          membershipLevels={membershipLevels}
          subfilters={subfilters}
          onFilterChange={handleFilterChange}
        />

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredPerks.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-600">No perks found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {filteredPerks.map((perk) => (
              <Card
                key={perk.id}
                image={perk.image_url}
                title={perk.title}
                description={perk.short_description}
                tags={perk.tags}
                link={`/perks/${perk.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default PerksPage;
