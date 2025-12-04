import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PageLayout } from '../components/layout/PageLayout';
import { useAuth } from '../context/AuthContext';
import { ConciergeInput } from '../components/ui/ConciergeInput';
import { TripCard } from '../components/ui/TripCard';
import { supabase } from '../lib/supabase';

interface Trip {
  id: string;
  data: {
    name?: string;
    start_date?: string;
    end_date?: string;
    destinations?: string[];
    [key: string]: any;
  };
  created_at: string;
}

const TravelPage: React.FC = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTrips();
    } else {
      // If no user, clear loading state immediately
      setLoading(false);
    }
  }, [user]);

  async function loadTrips() {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Use Promise.race to handle timeout properly
      let timeoutId: NodeJS.Timeout | null = null;
      const timeoutPromise = new Promise<null>((resolve) => {
        timeoutId = setTimeout(() => {
          console.warn('Trips load timeout - queries taking too long');
          resolve(null);
        }, 15000); // Increased to 15 seconds
      });

      const queryPromise = supabase
        .from('entities')
        .select('*')
        .eq('user_id', user.id)
        .eq('entity_type', 'trip')
        .order('created_at', { ascending: false });

      // Race between query and timeout
      let result: any = null;
      let timedOut = false;
      
      try {
        result = await Promise.race([
          queryPromise,
          timeoutPromise.then(() => {
            timedOut = true;
            return null;
          })
        ]);
      } catch (error) {
        console.error('Error in Promise.race:', error);
        timedOut = true;
      }
      
      // Clear timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // If timeout won, result will be null
      if (timedOut || result === null) {
        console.error('Trips query timed out');
        setLoading(false);
        setTrips([]);
        return;
      }

      const { data, error } = result;

      if (error) {
        console.error('Error loading trips:', error);
        setTrips([]);
      } else {
        setTrips(data || []);
      }
    } catch (error) {
      console.error('Error loading trips:', error);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }

  const handleSendMessage = async (message: string) => {
    // TODO: Call orchestrator endpoint for travel requests
    console.log('Travel request:', message);
    // Reload trips after a potential booking
    await loadTrips();
  };

  return (
    <PageLayout>
      <main className="pt-24 pb-20 bg-background min-h-screen">
        {/* Hero Section - Concierge Input */}
        <section className="px-6 py-16 md:py-24">
          <ConciergeInput 
            onSend={handleSendMessage}
            placeholder="Find flights, book hotels, plan trips..."
          />
        </section>

        {/* Divider */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Active Trips Section */}
        <section className="px-6 py-16 md:py-20">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h2 style={{ fontSize: '24px', fontWeight: 300, letterSpacing: '-0.01em' }} className="text-text-primary mb-2">
                Active Trips
              </h2>
              <p className="text-text-secondary" style={{ fontSize: '14px', fontWeight: 300 }}>
                Your upcoming travel plans
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent"></div>
              </div>
            ) : trips.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-text-tertiary" style={{ fontSize: '14px', fontWeight: 300 }}>
                  No active trips. Start planning your next adventure!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trips.map((trip, index) => (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <TripCard trip={trip} variant="detailed" />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </PageLayout>
  );
};

export default TravelPage;
