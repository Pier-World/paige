import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageLayout } from '../components/layout/PageLayout';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { Check, X } from 'lucide-react';

const MembershipPage: React.FC = () => {
  const { user, updateMembershipLevel } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const membershipLevels = [
    {
      name: 'Standard',
      price: 0,
      period: 'free forever',
      features: {
        active: [
          'Digital members card',
          'Personal concierge',
          'Hotel amenities*',
          'Dining amenities*',
          'Experiences*'
        ],
        inactive: [
          'Loyalty points',
        ]
      },
      benefits: {
        hotel: {
          active: [
            'Pier member rate'
          ],
          inactive: [
            'Complimentary welcome drink (per guest, per stay)',
            'In-room welcome gift'
          ]
        },
        dining: {
          active: [
            'Priority access'
          ],
          inactive: [
            'Pier member discount',
            'Complimentary cocktails / small plates'
          ]
        },
        experiences: {
          active: [
            'Priority access'
          ],
          inactive: [
            'Pier member discount'
          ]
        }
      }
    },
    {
      name: 'Premium',
      price: 895,
      period: 'billed yearly',
      features: {
        active: [
          'Physical members card',
          '1X Loyalty points',
          'Personal concierge',
          'Hotel amenities*',
          'Dining amenities*',
          'Experiences*'
        ],
        inactive: []
      },
      benefits: {
        hotel: {
          active: [
            'Pier member rate',
            'Complimentary welcome drink (per guest, per stay)',
            'In-room welcome gift'
          ],
          inactive: []
        },
        dining: {
          active: [
            'Pier member discount',
            'Priority access',
            'Complimentary cocktails / small plates'
          ],
          inactive: []
        },
        experiences: {
          active: [
            'Pier member discount',
            'Priority access'
          ],
          inactive: []
        }
      }
    },
    {
      name: 'Executive',
      price: 4950,
      period: 'billed yearly',
      features: {
        active: [
          'Physical members card',
          '1.5X Loyalty points',
          'Personal concierge',
          'Hotel amenities*',
          'Dining amenities*',
          'Experiences*',
          'Travel concierge'
        ],
        inactive: []
      },
      benefits: {
        hotel: {
          active: [
            'Pier member rate',
            'Complimentary welcome drink (per guest, per stay)',
            'In-room welcome gift',
            'Suite upgrades when available'
          ],
          inactive: []
        },
        dining: {
          active: [
            'Pier member discount',
            'Priority access',
            'Complimentary cocktails / small plates',
            "Chef's table access"
          ],
          inactive: []
        },
        experiences: {
          active: [
            'Pier member discount',
            'Priority access',
            'Exclusive event invitations'
          ],
          inactive: []
        }
      }
    }
  ];

  const membershipLevelIndex = (level: string) => {
    return membershipLevels.findIndex(l => l.name === level);
  };

  const handlePlanSelect = (planName: string) => {
    const currentIndex = membershipLevelIndex(user?.membership_level || 'Standard');
    const selectedIndex = membershipLevelIndex(planName);
    
    if (currentIndex === selectedIndex) return;
    
    setSelectedPlan(planName);
    setShowComparison(true);
  };

  const getButtonText = (planName: string) => {
    if (planName === user?.membership_level) return 'Current Plan';
    
    const currentIndex = membershipLevelIndex(user?.membership_level || 'Standard');
    const planIndex = membershipLevelIndex(planName);
    
    return currentIndex > planIndex ? 'Select' : 'Upgrade';
  };

  const handleConfirmChange = async () => {
    if (!selectedPlan) return;
    
    try {
      const { error } = await updateMembershipLevel(selectedPlan as 'Standard' | 'Premium' | 'Executive' | 'Founding Member');
      
      if (error) {
        throw error;
      }

      // Close modal and reset state
      setSelectedPlan(null);
      setShowComparison(false);
    } catch (err) {
      console.error('Failed to update membership:', err);
      // You could add error handling UI here
    }
  };

  return (
    <PageLayout>
      <div className="min-h-[40vh] bg-primary-950 flex items-center">
        <div className="container-custom py-12 text-white">
          <h1 className="text-4xl md:text-5xl font-display font-medium mb-4">
            Membership Levels
          </h1>
          <p className="text-lg text-primary-200 max-w-2xl">
            Choose the membership level that best suits your lifestyle. Upgrade anytime to unlock additional benefits and exclusive experiences.
          </p>
        </div>
      </div>

      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {membershipLevels.map((level) => (
            <motion.div
              key={level.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`rounded-lg p-8 ${
                level.name === user?.membership_level
                  ? 'bg-primary-950 text-white'
                  : 'bg-white border border-primary-200'
              }`}
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-display font-medium mb-2">{level.name}</h2>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-display font-medium">
                    ${level.price.toLocaleString()}
                  </span>
                  <span className="ml-2 text-sm opacity-80">
                    {level.period}
                  </span>
                </div>
              </div>

              <div className="space-y-8 mb-8">
                {/* Core Features */}
                <div>
                  <h3 className="font-medium mb-4">Core Features</h3>
                  <ul className="space-y-2">
                    {level.features.active.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <Check size={16} className="mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    {level.features.inactive.map((feature) => (
                      <li key={feature} className="flex items-center opacity-50">
                        <X size={16} className="mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Hotel Benefits */}
                <div>
                  <h3 className="font-medium mb-4">Hotel Benefits</h3>
                  <ul className="space-y-2">
                    {level.benefits.hotel.active.map((benefit) => (
                      <li key={benefit} className="flex items-center">
                        <Check size={16} className="mr-2 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                    {level.benefits.hotel.inactive.map((benefit) => (
                      <li key={benefit} className="flex items-center opacity-50">
                        <X size={16} className="mr-2 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Dining Benefits */}
                <div>
                  <h3 className="font-medium mb-4">Dining Benefits</h3>
                  <ul className="space-y-2">
                    {level.benefits.dining.active.map((benefit) => (
                      <li key={benefit} className="flex items-center">
                        <Check size={16} className="mr-2 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                    {level.benefits.dining.inactive.map((benefit) => (
                      <li key={benefit} className="flex items-center opacity-50">
                        <X size={16} className="mr-2 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Experience Benefits */}
                <div>
                  <h3 className="font-medium mb-4">Experience Benefits</h3>
                  <ul className="space-y-2">
                    {level.benefits.experiences.active.map((benefit) => (
                      <li key={benefit} className="flex items-center">
                        <Check size={16} className="mr-2 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                    {level.benefits.experiences.inactive.map((benefit) => (
                      <li key={benefit} className="flex items-center opacity-50">
                        <X size={16} className="mr-2 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Button
                className={`w-full ${
                  level.name === user?.membership_level
                    ? 'bg-white text-primary-950 hover:bg-primary-100'
                    : ''
                }`}
                disabled={level.name === user?.membership_level}
                onClick={() => handlePlanSelect(level.name)}
              >
                {getButtonText(level.name)}
              </Button>
            </motion.div>
          ))}
        </div>

        <p className="text-sm text-primary-600 text-center mt-8">
          * Benefits are subject to partner approval and availability at time of reservation.
        </p>
      </div>

      {/* Plan Comparison Modal */}
      <AnimatePresence>
        {showComparison && selectedPlan && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-display font-medium mb-6">
                Plan Comparison
              </h3>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="font-medium mb-4">Current Plan: {user?.membership_level}</h4>
                  <ul className="space-y-2">
                    {membershipLevels.find(l => l.name === user?.membership_level)?.features.active.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <Check size={16} className="mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Selected Plan: {selectedPlan}</h4>
                  <ul className="space-y-2">
                    {membershipLevels.find(l => l.name === selectedPlan)?.features.active.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <Check size={16} className="mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedPlan(null);
                    setShowComparison(false);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleConfirmChange}>
                  Confirm Change
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
};

export default MembershipPage;