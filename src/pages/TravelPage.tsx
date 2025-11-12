import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Sparkles, Clock, Shield, CheckCircle } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { useAuth } from '../context/AuthContext';
import { SmartChipsBar } from '../components/features/SmartChipsBar';
import { ResultCards } from '../components/features/ResultCards';
import { BookingModal } from '../components/features/BookingModal';
import useTravelStore from '../stores/travelStore';
import { showFrontChat, onUnreadChange, onFrontChatReady } from '../lib/frontChat';
import { subscribeToRequestUpdates } from '../lib/api/travelRequests';

const EXAMPLE_PROMPTS = [
  "Round trip NYC → Austin Friday to Sunday",
  "Suite at The Ritz Paris next weekend",
  "Private jet to Miami for 4 passengers tomorrow",
  "Business class flight to London, nonstop",
  "Hotel in Paris, near the Louvre, 5 nights",
  "Restaurant reservation at Carbone on Saturday",
];

const TravelPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const {
    activeTravelRequest,
    setActiveTravelRequest,
    chips,
    updateIntent,
    setSearching,
  } = useTravelStore();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentExampleIndex((prev) => (prev + 1) % EXAMPLE_PROMPTS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Wait for Front Chat to be ready before setting up listeners
    onFrontChatReady(() => {
      onUnreadChange((count) => {
        setUnreadCount(count);
      });
    });
  }, []);

  useEffect(() => {
    if (activeTravelRequest) {
      const unsubscribe = subscribeToRequestUpdates(activeTravelRequest.id, (updatedRequest) => {
        setActiveTravelRequest(updatedRequest);
        if (updatedRequest.status === 'offered' && updatedRequest.results.length > 0) {
          setSearching(false);
        }
      });

      return () => {
        unsubscribe();
      };
    }
  }, [activeTravelRequest, setActiveTravelRequest, setSearching]);

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  const handleOpenChat = () => {
    console.log('🔵 Open Paige Chat button clicked');
    showFrontChat();
  };

  const handleExampleClick = (prompt: string) => {
    console.log('🔵 Example prompt clicked:', prompt);
    showFrontChat();
  };

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-4 py-2 rounded-full mb-4"
          >
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">AI + Human Travel Concierge</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Meet Paige
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Your personal travel concierge. Chat with Paige to book flights, hotels, ground transportation, and more.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100"
          >
            <div className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Chat with Paige</h3>
                  <p className="text-gray-600">
                    Book flights, hotels, drivers, and more. Get replies in minutes from our AI + human team.
                  </p>
                </div>
              </div>

              <button
                onClick={handleOpenChat}
                className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 relative"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Open Paige Chat</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              <div className="mt-6 space-y-3">
                <p className="text-sm font-medium text-gray-700 mb-3">Try asking:</p>
                {EXAMPLE_PROMPTS.slice(0, 3).map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(prompt)}
                    className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-sm text-gray-700 border border-gray-200"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-start gap-3 mb-4">
                <Clock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Fast Response Times</h4>
                  <p className="text-sm text-gray-600">
                    Our team typically responds within 5 minutes during business hours.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-start gap-3 mb-4">
                <Shield className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Expert Assistance</h4>
                  <p className="text-sm text-gray-600">
                    AI-powered with human oversight. Complex requests are handled by our travel experts.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Exclusive Member Benefits</h4>
                  <p className="text-sm text-gray-600">
                    Access special rates and availability not available to the public.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {chips.length > 0 && (
          <div className="mb-8">
            <SmartChipsBar
              chips={chips}
              onChipClick={(chip) => {
                updateIntent(chip);
                showFrontChat();
              }}
            />
          </div>
        )}

        {activeTravelRequest && activeTravelRequest.results.length > 0 && (
          <div className="mb-8">
            <ResultCards
              results={activeTravelRequest.results}
              onSelectResult={() => setIsBookingModalOpen(true)}
            />
          </div>
        )}

        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
        />
      </div>

      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={handleOpenChat}
          className="relative px-5 py-3 rounded-full bg-[#0C1424] text-white flex items-center gap-2 shadow-2xl hover:opacity-90 transition-all duration-200"
        >
          <Sparkles className="w-5 h-5" />
          <span className="font-medium">Ask Paige</span>
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </PageLayout>
  );
};

export default TravelPage;
