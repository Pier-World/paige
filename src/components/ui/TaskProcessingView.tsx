import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { AIProcessingSteps } from './AIProcessingSteps';
import { HotelRecommendationCard, HotelRecommendation } from './HotelRecommendationCard';

interface Task {
  id: string;
  status: string;
  ui_state?: {
    current_step?: string;
    progress?: number;
    rendered_component?: string;
  };
  output_data?: {
    recommendations?: any[];
    hotels?: any[];
    parsed_request?: any;
  };
}

interface TaskProcessingViewProps {
  taskId: string;
  onComplete?: () => void;
}

// Transform backend recommendation format to frontend card format
function transformRecommendation(rec: any, parsedRequest?: any): HotelRecommendation {
  const city = parsedRequest?.city || rec.city || '';
  const location = rec.location || `${rec.neighborhood || ''}, ${city}`.trim();
  
  // Format rate
  let averageRate = 'Rate on request';
  if (rec.rate_estimate) {
    averageRate = `$${rec.rate_estimate.mid}`;
  } else if (rec.rate_mid) {
    averageRate = `$${rec.rate_mid}`;
  }

  // Extract match reasons
  const matchReasons: string[] = [];
  if (rec.reason) {
    matchReasons.push(rec.reason);
  }
  // Add score breakdown insights
  if (rec.score_breakdown) {
    const breakdown = rec.score_breakdown;
    if (breakdown.budget_fit > 20) {
      matchReasons.push('Excellent value for your budget');
    }
    if (breakdown.location_match > 15) {
      matchReasons.push('Perfect location match');
    }
    if (breakdown.vibe_match > 15) {
      matchReasons.push('Matches your preferred atmosphere');
    }
  }

  return {
    id: rec.id || rec.hotel_id,
    hotel_id: rec.hotel_id || rec.id,
    name: rec.name,
    location,
    city,
    neighborhood: rec.neighborhood,
    rating: rec.star_rating || rec.rating,
    reviewCount: rec.review_count,
    averageRate,
    rateRange: rec.rate_estimate ? `$${rec.rate_estimate.low} - $${rec.rate_estimate.high}` : undefined,
    imageUrl: rec.image_hero || rec.image_url || rec.image_hero_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    image_hero: rec.image_hero || rec.image_url || rec.image_hero_url,
    pierBenefits: rec.pier_benefits || rec.pierBenefits || [],
    matchReasons: matchReasons.length > 0 ? matchReasons : ['Great option based on your preferences'],
    reason: rec.reason,
    description: rec.description || rec.notes_curated,
    amenities: rec.amenities || [],
    rate_estimate: rec.rate_estimate,
  };
}

export const TaskProcessingView: React.FC<TaskProcessingViewProps> = ({ taskId, onComplete }) => {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState<HotelRecommendation[]>([]);

  useEffect(() => {
    // Clear previous state when taskId changes
    setTask(null);
    setHotels([]);
    setLoading(true);
    fetchTask();
    
    // Set up real-time subscription
    const channel = supabase
      .channel(`task:${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `id=eq.${taskId}`,
        },
        (payload) => {
          const updatedTask = payload.new as Task;
          setTask(updatedTask);
          
          // If completed, fetch full hotel data and transform recommendations
          if (updatedTask.status === 'completed' && updatedTask.output_data) {
            processRecommendations(updatedTask.output_data);
          } else if (updatedTask.status === 'completed' && hotels.length === 0) {
            // Task completed but no hotels yet - try to process again
            // This handles the case where output_data might be set after status
            setTimeout(() => {
              fetchTask();
            }, 1000);
          }
          
          // Don't auto-clear on complete - let user see results
          // Only clear if task failed or needs review
          if ((updatedTask.status === 'failed' || updatedTask.status === 'awaiting_human') && onComplete) {
            setTimeout(() => onComplete(), 2000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) throw error;
      
      if (data) {
        setTask(data as Task);
        
        // If already completed, process recommendations
        if (data.status === 'completed' && data.output_data) {
          processRecommendations(data.output_data);
        }
      }
    } catch (error) {
      console.error('Error fetching task:', error);
    } finally {
      setLoading(false);
    }
  };

  const processRecommendations = async (outputData: any) => {
    const recommendations = outputData.recommendations || outputData.hotels || [];
    
    if (recommendations.length === 0) return;

    // Fetch full hotel data from database for additional details
    const hotelIds = recommendations.map((r: any) => r.hotel_id || r.id).filter(Boolean);
    
    if (hotelIds.length > 0) {
      try {
        const { data: hotelData, error } = await supabase
          .from('hotels')
          .select('*')
          .in('id', hotelIds);

        if (!error && hotelData) {
          // Merge database data with recommendations
          const enriched = recommendations.map((rec: any) => {
            const hotel = hotelData.find((h: any) => h.id === (rec.hotel_id || rec.id));
            return {
              ...rec,
              // Add database fields
              star_rating: hotel?.star_rating,
              description: hotel?.notes_curated || hotel?.description,
              amenities: hotel?.amenities || [],
              address: hotel?.address,
              neighborhood: hotel?.neighborhood || rec.neighborhood,
              primary_city: hotel?.primary_city || rec.city,
            };
          });

          const transformed = enriched.map((rec: any) => 
            transformRecommendation(rec, outputData.parsed_request)
          );
          setHotels(transformed);
        } else {
          // Fallback: just transform what we have
          const transformed = recommendations.map((rec: any) => 
            transformRecommendation(rec, outputData.parsed_request)
          );
          setHotels(transformed);
        }
      } catch (error) {
        console.error('Error fetching hotel details:', error);
        // Fallback: just transform what we have
        const transformed = recommendations.map((rec: any) => 
          transformRecommendation(rec, outputData.parsed_request)
        );
        setHotels(transformed);
      }
    } else {
      // No hotel IDs, just transform what we have
      const transformed = recommendations.map((rec: any) => 
        transformRecommendation(rec, outputData.parsed_request)
      );
      setHotels(transformed);
    }
  };

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-8">
        <div className="text-text-secondary text-center">Task not found</div>
      </div>
    );
  }

  const isComplete = task.status === 'completed';
  // Map orchestrator steps to our step names
  const stepMapping: Record<string, string> = {
    'parsing': 'understand',
    'understanding': 'understand',
    'filtering': 'filter',
    'matching': 'match',
    'ranking': 'match',
    'results_ready': 'present',
    'presenting': 'present',
  };
  const rawStep = task.ui_state?.current_step || 'understand';
  const currentStep = stepMapping[rawStep] || rawStep;
  const progress = task.ui_state?.progress || 0;

  return (
    <div className="space-y-6">
      {/* Processing Steps - Only show when NOT complete */}
      {!isComplete && (
        <AIProcessingSteps
          currentStep={currentStep}
          progress={progress}
          isComplete={isComplete}
        />
      )}

      {/* Recommendations - Only show when complete AND hotels are loaded */}
      {isComplete && hotels.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="text-center mb-6">
            <h3 className="text-text-primary mb-2" style={{ fontSize: '24px', fontWeight: 400, fontFamily: 'Playfair Display, serif' }}>
              Your Recommendations
            </h3>
            <p className="text-text-tertiary" style={{ fontSize: '14px', fontWeight: 300 }}>
              We've found {hotels.length} perfect match{hotels.length !== 1 ? 'es' : ''} for you
            </p>
          </div>

          <div className="space-y-4">
            {hotels.map((hotel, index) => (
              <HotelRecommendationCard
                key={hotel.id}
                hotel={hotel}
                index={index}
                onOpenConcierge={() => {
                  // TODO: Open human concierge modal
                  console.log('Open concierge for hotel:', hotel.id);
                }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Fallback: Show loading or empty state */}
      {isComplete && hotels.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-surface border border-border rounded-2xl p-8"
        >
          <div className="text-text-secondary text-center">
            {task.output_data ? 'Processing complete. No recommendations found.' : 'Processing complete. Loading results...'}
          </div>
        </motion.div>
      )}
    </div>
  );
};

