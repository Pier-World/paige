import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Clock, Shield, CheckCircle, Zap, TrendingUp, Gift } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { useAuth } from '../context/AuthContext';
import { AIChatInterface } from '../components/features/AIChatInterface';

const TravelPage: React.FC = () => {
  const { user, profile } = useAuth();

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Pier Concierge</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your personal concierge powered by AI + human expertise. Book flights, hotels, restaurants, and more — with instant gratification.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Main Chat Interface */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="h-[600px]">
              <AIChatInterface />
            </div>
          </motion.div>

          {/* Sidebar - Value Props & Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Magic Moments Card */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Instant Magic</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Get immediate responses with real options. Our AI + human team delivers that dopamine hit of instant value — every single time.
              </p>
            </div>

            {/* ROI Stats Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-bold text-gray-900">Your ROI This Month</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-3xl font-bold text-green-600">$7,600</div>
                  <div className="text-sm text-gray-600">Money saved</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600">48 hours</div>
                  <div className="text-sm text-gray-600">Time saved</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600">310K</div>
                  <div className="text-sm text-gray-600">Points optimized</div>
                </div>
              </div>
            </div>

            {/* Features List */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">What We Handle</h3>
              <div className="space-y-3">
                {FEATURES.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{feature.title}</div>
                      <div className="text-xs text-gray-600">{feature.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust Signals */}
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">Always Here</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                AI handles 80% instantly. Humans step in where it matters most — travel disruptions, negotiations, high-stakes bookings.
              </p>
              <div className="flex items-center gap-2 text-xs text-blue-700">
                <Clock className="w-4 h-4" />
                <span>Available 24/7/365</span>
              </div>
            </div>

            {/* Anticipatory Features */}
            <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
              <div className="flex items-center gap-3 mb-3">
                <Gift className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-900">Proactive Magic</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                We anticipate your needs before you ask. Flight price drops, restaurant openings, travel prep, and life admin — handled automatically.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Bottom Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-center"
        >
          <h3 className="text-2xl font-bold text-white mb-3">
            The Operating System for Your Life
          </h3>
          <p className="text-gray-300 max-w-3xl mx-auto">
            Pier becomes indispensable by integrating deeply into your calendar, email, travel patterns, and preferences.
            It's not just a service — it's the layer that makes you more effective every single day.
          </p>
        </motion.div>
      </div>
    </PageLayout>
  );
};

const FEATURES = [
  {
    title: "Flights & Private Aviation",
    description: "Private fares, redemption optimization, upgrades"
  },
  {
    title: "Hotels & Accommodations",
    description: "Elite benefits, suite upgrades, unique properties"
  },
  {
    title: "Restaurants & Dining",
    description: "Hard-to-get reservations, private dining, wine pairings"
  },
  {
    title: "Ground Transportation",
    description: "Cars, drivers, logistics, airport transfers"
  },
  {
    title: "Events & Experiences",
    description: "Tickets, VIP access, cultural events, entertainment"
  },
  {
    title: "Corporate & Team Travel",
    description: "Offsites, recruiting dinners, board meetings"
  },
  {
    title: "Lifestyle Management",
    description: "Gifts, errands, life admin, relationship management"
  },
  {
    title: "Points & Rewards",
    description: "Optimization, strategy, maximizing value"
  }
];

export default TravelPage;
