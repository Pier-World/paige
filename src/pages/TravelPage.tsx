import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PageLayout } from '../components/layout/PageLayout';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const TravelPage: React.FC = () => {
  const { user } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    travelType: 'commercial',
    ambiance: '',
    budget: '',
    description: ''
  });

  const canSubmit = user?.membership_level === 'Executive' || user?.membership_level === 'Founding Member';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit) {
      setShowUpgradeModal(true);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const { error } = await supabase
        .from('travel_requests')
        .insert({
          user_id: user?.id,
          travel_type: formData.travelType,
          ambiance: formData.ambiance,
          budget: formData.budget,
          description: formData.description,
          status: 'pending'
        });

      if (error) throw error;

      setSubmitSuccess(true);
      setFormData({
        travelType: 'commercial',
        ambiance: '',
        budget: '',
        description: ''
      });
    } catch (error) {
      console.error('Error submitting travel request:', error);
      setSubmitError('Failed to submit travel request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <div className="min-h-[40vh] bg-primary-950 flex items-center">
        <div className="container-custom py-12 text-white">
          <h1 className="text-4xl md:text-5xl font-display font-medium mb-4">
            Travel Concierge
          </h1>
          <p className="text-lg text-primary-200 max-w-2xl">
            Let our expert travel team curate your perfect journey. From private jets to boutique hotels, 
            we'll handle every detail of your luxury travel experience.
          </p>
        </div>
      </div>

      <div className="container-custom py-12">
        <div className="max-w-2xl mx-auto">
          {submitSuccess ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <h2 className="text-2xl font-medium text-green-800 mb-2">Request Submitted Successfully</h2>
              <p className="text-green-700 mb-6">
                Our travel concierge team will review your request and contact you within 24 hours to begin planning your journey.
              </p>
              <Button
                onClick={() => setSubmitSuccess(false)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Submit Another Request
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {submitError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md">
                  {submitError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Type of Travel
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, travelType: 'commercial' }))}
                    className={`p-4 rounded-lg border text-center transition-colors ${
                      formData.travelType === 'commercial'
                        ? 'border-primary-950 bg-primary-950 text-white'
                        : 'border-primary-200 hover:border-primary-300'
                    }`}
                  >
                    Commercial
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, travelType: 'private' }))}
                    className={`p-4 rounded-lg border text-center transition-colors ${
                      formData.travelType === 'private'
                        ? 'border-primary-950 bg-primary-950 text-white'
                        : 'border-primary-200 hover:border-primary-300'
                    }`}
                  >
                    Private
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Preferred Stay Ambiance
                </label>
                <select
                  value={formData.ambiance}
                  onChange={(e) => setFormData(prev => ({ ...prev, ambiance: e.target.value }))}
                  className="input w-full"
                  required
                >
                  <option value="">Select ambiance</option>
                  <option value="boutique">Boutique</option>
                  <option value="luxury">Luxury</option>
                  <option value="modern">Modern</option>
                  <option value="classic">Classic</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Total Budget
                </label>
                <select
                  value={formData.budget}
                  onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                  className="input w-full"
                  required
                >
                  <option value="">Select budget</option>
                  <option value="2500">Up to $2,500</option>
                  <option value="5000">Up to $5,000</option>
                  <option value="10000">Up to $10,000</option>
                  <option value="50000">Up to $50,000</option>
                  <option value="unlimited">No budget limit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Trip Details
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input w-full h-32"
                  placeholder="Please describe your ideal trip, including destinations, dates, number of travelers, and any special requirements."
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                isLoading={isSubmitting}
              >
                Submit Request
              </Button>

              {!canSubmit && (
                <p className="text-sm text-primary-600 text-center">
                  * Travel concierge service is available to Executive and Founding members
                </p>
              )}
            </form>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-8 max-w-md w-full"
          >
            <h3 className="text-xl font-medium mb-4">Upgrade Required</h3>
            <p className="text-primary-600 mb-6">
              The travel concierge service is exclusively available to Executive and Founding members. 
              Upgrade your membership to access this premium service.
            </p>
            <div className="flex justify-end space-x-4">
              <Button
                variant="ghost"
                onClick={() => setShowUpgradeModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => window.location.href = '/upgrade'}
              >
                Upgrade Membership
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </PageLayout>
  );
};

export default TravelPage;