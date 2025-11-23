import React from 'react';
import { motion } from 'framer-motion';
import { Plane, Calendar, UtensilsCrossed, TrendingUp } from 'lucide-react';

interface SmartCard {
  id: string;
  eyebrow: string;
  headline: string;
  subtext?: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
}

export const ForYouToday: React.FC = () => {
  const cards: SmartCard[] = [
    {
      id: '1',
      eyebrow: 'Trip',
      headline: 'Rebook your SFO → JFK trip and save ~$1,200',
      subtext: 'Price dropped 32% since you booked',
      icon: <Plane className="w-5 h-5" />,
      color: 'blue',
      action: () => console.log('Handle trip rebook')
    },
    {
      id: '2',
      eyebrow: 'Upcoming',
      headline: 'Board meeting in SF next week',
      subtext: 'Want travel and hotel handled?',
      icon: <Calendar className="w-5 h-5" />,
      color: 'purple',
      action: () => console.log('Handle board meeting travel')
    },
    {
      id: '3',
      eyebrow: 'Tonight',
      headline: '3 tables at places you love in New York',
      subtext: 'Carbone, Frevo, and Sake No Hana',
      icon: <UtensilsCrossed className="w-5 h-5" />,
      color: 'orange',
      action: () => console.log('View restaurants')
    },
    {
      id: '4',
      eyebrow: 'ROI',
      headline: "You've saved $7,300 with Pier this quarter",
      subtext: '48 hours of time saved, 310k points optimized',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'green',
      action: () => console.log('View ROI dashboard')
    }
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'bg-blue-500',
      button: 'bg-blue-600 hover:bg-blue-700'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      icon: 'bg-purple-500',
      button: 'bg-purple-600 hover:bg-purple-700'
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: 'bg-orange-500',
      button: 'bg-orange-600 hover:bg-orange-700'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'bg-green-500',
      button: 'bg-green-600 hover:bg-green-700'
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold text-gray-900">For you today</h2>
        <p className="text-sm text-gray-600 mt-1">
          Proactive insights and opportunities we've flagged
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card, index) => {
          const colors = colorClasses[card.color as keyof typeof colorClasses];

          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${colors.bg} border ${colors.border} rounded-xl p-5 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start gap-4">
                <div className={`${colors.icon} rounded-lg p-2 text-white flex-shrink-0`}>
                  {card.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                    {card.eyebrow}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {card.headline}
                  </h3>
                  {card.subtext && (
                    <p className="text-sm text-gray-600 mb-4">{card.subtext}</p>
                  )}
                  <button
                    onClick={card.action}
                    className={`${colors.button} text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors`}
                  >
                    Handle this
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
