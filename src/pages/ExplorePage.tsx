import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { FilterBar } from '../components/features/FilterBar';
import { EventCard } from '../components/features/EventCard';
import { Carousel } from '../components/ui/Carousel';
import { mockEvents } from '../mocks/eventsData';
import { supabase } from '../lib/supabase';
import type { Event } from '../types';

const ExplorePage: React.FC = () => {
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cities
  const cities = [
    { label: 'New York', value: 'New York' },
    { label: 'Los Angeles', value: 'Los Angeles' },
    { label: 'Miami', value: 'Miami' },
    { label: 'London', value: 'London' },
    { label: 'Paris', value: 'Paris' },
  ];

  // Event types
  const eventTypes = [
    { label: 'All', value: 'all' },
    { label: 'Pier Events', value: 'pier' },
    { label: 'Partner Events', value: 'partner' },
  ];

  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('date', { ascending: true });

        if (error) {
          console.error('Error fetching events:', error);
          setFilteredEvents(mockEvents);
          setFeaturedEvents(mockEvents.filter(event => event.featured));
        } else if (data && data.length > 0) {
          setFilteredEvents(data);
          setFeaturedEvents(data.filter(event => event.featured));
        } else {
          setFilteredEvents(mockEvents);
          setFeaturedEvents(mockEvents.filter(event => event.featured));
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
        setFilteredEvents(mockEvents);
        setFeaturedEvents(mockEvents.filter(event => event.featured));
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, []);

  const handleFilterChange = async (filters: {
    category: string | null;
    city: string | null;
    subfilter: string | null;
    search: string;
  }) => {
    setIsLoading(true);

    try {
      let query = supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      // Filter by event type (check tags array)
      if (filters.category && filters.category !== 'all') {
        query = query.contains('tags', [filters.category]);
      }

      // Filter by city
      if (filters.city) {
        query = query.eq('city', filters.city);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error filtering events:', error);
        throw error;
      }

      let filtered = data || [];

      // Apply search filter on client side (more flexible)
      if (filters.search && filtered.length > 0) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(
          event =>
            event.title.toLowerCase().includes(searchLower) ||
            event.description.toLowerCase().includes(searchLower) ||
            event.location.toLowerCase().includes(searchLower) ||
            event.tags.some((tag: string) => tag.toLowerCase().includes(searchLower))
        );
      }

      setFilteredEvents(filtered);
    } catch (error) {
      console.error('Failed to filter events:', error);
      // Fallback to mock data on error
      let filtered = [...mockEvents];

      if (filters.category && filters.category !== 'all') {
        filtered = filtered.filter(event => event.tags.includes(filters.category));
      }

      if (filters.city) {
        filtered = filtered.filter(event => event.city === filters.city);
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(
          event =>
            event.title.toLowerCase().includes(searchLower) ||
            event.description.toLowerCase().includes(searchLower) ||
            event.location.toLowerCase().includes(searchLower) ||
            event.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      setFilteredEvents(filtered);
    } finally {
      setIsLoading(false);
    }
  };

  // Group events by city
  const eventsByCity: Record<string, Event[]> = {};
  filteredEvents.forEach(event => {
    if (!eventsByCity[event.city]) {
      eventsByCity[event.city] = [];
    }
    eventsByCity[event.city].push(event);
  });

  return (
    <AppLayout>
      {/* Featured Events Carousel */}
      {featuredEvents.length > 0 && (
        <div className="bg-primary-950 pt-20 pb-12">
          <div className="container-custom">
            <h2 className="text-3xl font-display font-medium mb-8 text-white">Featured Events</h2>
            <Carousel
              items={featuredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
              slidesToShow={3}
              autoplay={true}
            />
          </div>
        </div>
      )}
      
      <div className="container-custom py-12">
        <h1 className="text-4xl font-display font-medium mb-2">Upcoming Events</h1>
        <p className="text-primary-600 mb-8">Discover and RSVP to exclusive events for Pier members.</p>
        
        {/* Filters */}
        <div className="mb-8">
          <FilterBar
            categories={eventTypes}
            cities={cities}
            onFilterChange={handleFilterChange}
          />
        </div>
        
        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-900"></div>
          </div>
        ) : Object.keys(eventsByCity).length > 0 ? (
          <div className="space-y-16">
            {Object.entries(eventsByCity).map(([city, events]) => (
              <div key={city}>
                <h2 className="text-2xl font-display font-medium mb-6">{city}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-2xl font-medium mb-2">No events found</h3>
            <p className="text-primary-600">Try adjusting your filters or search criteria.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ExplorePage;