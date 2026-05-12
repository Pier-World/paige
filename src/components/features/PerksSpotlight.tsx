import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FeaturedPerk {
  id: string;
  name: string;
  category: string;
  city: string;
  description: string;
  image: string;
}

export const PerksSpotlight: React.FC = () => {
  // TODO: Replace with actual perk data from Supabase
  const featuredPerks: FeaturedPerk[] = [
    {
      id: '1',
      name: 'Sake No Hana',
      category: 'dining',
      city: 'London',
      description: "Complimentary chef's dish and VIP entry to exclusive dining room",
      image: 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    {
      id: '2',
      name: 'The Connaught',
      category: 'hotel',
      city: 'London',
      description: 'Suite upgrade, late checkout, and complimentary breakfast',
      image: 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    {
      id: '3',
      name: 'Soho House',
      category: 'experience',
      city: 'New York',
      description: 'Access to private members club and rooftop pool',
      image: 'https://images.pexels.com/photos/1024248/pexels-photo-1024248.jpeg?auto=compress&cs=tinysrgb&w=800'
    }
  ];

  const categoryColors = {
    dining: 'bg-orange-100 text-orange-800',
    hotel: 'bg-blue-100 text-blue-800',
    experience: 'bg-purple-100 text-purple-800'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-900">Featured perks for you</h2>
          <p className="text-sm text-gray-600 mt-1">
            AI-recommended based on your preferences and upcoming trips
          </p>
        </div>
        <Link
          to="/partners"
          className="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors"
        >
          View all
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {featuredPerks.map((perk, index) => (
          <motion.div
            key={perk.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to="/partners"
              className="group block bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                <img
                  src={perk.image}
                  alt={perk.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${categoryColors[perk.category as keyof typeof categoryColors]}`}>
                    {perk.category}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" />
                    {perk.city}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-gray-600 transition-colors">
                  {perk.name}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {perk.description}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="text-center">
        <Link
          to="/partners"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Explore all perks
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
