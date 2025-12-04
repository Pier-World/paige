import { Sparkles, Mic, ArrowRight, Calendar, Plane, Users, MapPin, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Suggestion {
  id: string;
  text: string;
  category: 'flight' | 'restaurant' | 'meeting' | 'travel' | 'general';
  icon: any;
  context?: string;
}

const generateSuggestions = (input: string): Suggestion[] => {
  const lowerInput = input.toLowerCase();
  
  // Flight-related suggestions
  if (lowerInput.includes('flight') || lowerInput.includes('fly') || lowerInput.includes('airport')) {
    return [
      {
        id: '1',
        text: 'Find flights to Tokyo under $800 departing next week',
        category: 'flight',
        icon: Plane,
        context: 'Using your Delta Diamond status for upgrades',
      },
      {
        id: '2',
        text: 'Search for first-class flights to London in January',
        category: 'flight',
        icon: Plane,
        context: '150k Amex points available',
      },
      {
        id: '3',
        text: 'Find the cheapest flights to New York this weekend',
        category: 'flight',
        icon: Plane,
        context: 'Checking all your airline memberships',
      },
    ];
  }
  
  // Restaurant/dining suggestions
  if (lowerInput.includes('dinner') || lowerInput.includes('restaurant') || lowerInput.includes('table') || lowerInput.includes('reservation')) {
    return [
      {
        id: '1',
        text: 'Book a table for 4 at a Michelin-starred restaurant in SF',
        category: 'restaurant',
        icon: Users,
        context: 'This Saturday at 7 PM',
      },
      {
        id: '2',
        text: 'Find the best Italian restaurant in Manhattan with availability tonight',
        category: 'restaurant',
        icon: Users,
        context: 'Using your Amex Platinum dining credit',
      },
      {
        id: '3',
        text: 'Reserve a private dining room for a business dinner next week',
        category: 'restaurant',
        icon: Users,
        context: 'For 8 people',
      },
    ];
  }
  
  // Meeting/scheduling suggestions
  if (lowerInput.includes('meeting') || lowerInput.includes('schedule') || lowerInput.includes('reschedule') || lowerInput.includes('calendar')) {
    return [
      {
        id: '1',
        text: 'Reschedule my meeting with Alex to next Thursday at 2 PM',
        category: 'meeting',
        icon: Calendar,
        context: 'Checking Alex\'s calendar availability',
      },
      {
        id: '2',
        text: 'Find a time for coffee with the team this week',
        category: 'meeting',
        icon: Clock,
        context: 'Looking for 1-hour slots',
      },
      {
        id: '3',
        text: 'Set up a quarterly board meeting in January',
        category: 'meeting',
        icon: Users,
        context: 'Coordinating 8 calendars',
      },
    ];
  }
  
  // Travel/hotel suggestions
  if (lowerInput.includes('hotel') || lowerInput.includes('stay') || lowerInput.includes('accommodation')) {
    return [
      {
        id: '1',
        text: 'Find a luxury hotel in Paris for 3 nights in February',
        category: 'travel',
        icon: MapPin,
        context: 'Using Marriott Platinum benefits',
      },
      {
        id: '2',
        text: 'Book a suite at the Four Seasons for next weekend',
        category: 'travel',
        icon: MapPin,
        context: '285k Bonvoy points available',
      },
      {
        id: '3',
        text: 'Search for beachfront resorts in Maldives',
        category: 'travel',
        icon: MapPin,
        context: 'For a 5-day wellness retreat',
      },
    ];
  }
  
  // Default contextual suggestions based on user's upcoming calendar
  return [
    {
      id: '1',
      text: 'Prepare an itinerary for my NYC trip tomorrow',
      category: 'travel',
      icon: Plane,
      context: 'Flight at 9:30 AM from SFO',
    },
    {
      id: '2',
      text: 'Find transportation from JFK to Manhattan',
      category: 'travel',
      icon: MapPin,
      context: 'Arriving at 6:15 PM',
    },
    {
      id: '3',
      text: 'Book a table near my hotel for dinner on Dec 2',
      category: 'restaurant',
      icon: Users,
      context: 'The French Laundry reservation',
    },
    {
      id: '4',
      text: 'Search for exclusive wine experiences in Napa',
      category: 'travel',
      icon: MapPin,
      context: 'Dec 5 private tasting',
    },
  ];
};

export function ConciergeInput() {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (input.length > 2) {
      const newSuggestions = generateSuggestions(input);
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
    } else if (isFocused && input.length === 0) {
      // Show contextual suggestions when focused but empty
      setSuggestions(generateSuggestions(''));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [input, isFocused]);

  const quickStarts = [
    "Find me flights to Tokyo under $800",
    "Book a table for 4 at a Michelin-starred restaurant in SF",
    "Reschedule my meeting with Alex to next week",
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full bg-[#1a1a1a] border border-[#2a2a2a]">
          <Sparkles size={14} className="text-[#c9b896]" />
          <span className="text-[#c9b896]" style={{ fontSize: '12px', fontWeight: 300 }}>
            AI-Powered Concierge
          </span>
        </div>
        <h2 style={{ fontSize: '36px', fontWeight: 300, letterSpacing: '-0.02em' }} className="text-[#e8e8e8] mb-2">
          Good evening, Sarah.
        </h2>
        <p className="text-[#a0a0a0]" style={{ fontSize: '16px', fontWeight: 300 }}>
          How can I assist you today?
        </p>
      </div>

      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: isFocused ? 1.01 : 1 }}
        transition={{ duration: 0.2 }}
        className="relative"
      >
        <div className={`rounded-2xl bg-[#141414] border transition-all duration-300 ${
          isFocused ? 'border-[#c9b896] shadow-xl' : 'border-[#2a2a2a] shadow-lg'
        }`}>
          <div className="flex items-start gap-3 p-6">
            <Sparkles size={20} className="text-[#c9b896] mt-2 flex-shrink-0" />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                // Delay to allow clicking suggestions
                setTimeout(() => setIsFocused(false), 200);
              }}
              placeholder="Type your request or question..."
              className="flex-1 bg-transparent text-[#e8e8e8] placeholder:text-[#6a6a6a] outline-none resize-none"
              style={{ fontSize: '16px', fontWeight: 300, minHeight: '60px' }}
              rows={3}
            />
            <div className="flex items-center gap-2 mt-2">
              <button className="p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors">
                <Mic size={18} className="text-[#a0a0a0]" />
              </button>
              <button className="p-2 rounded-lg bg-[#c9b896] hover:bg-[#d4c4a6] transition-colors">
                <ArrowRight size={18} className="text-[#0a0a0a]" />
              </button>
            </div>
          </div>
        </div>

        {/* AI Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-[#141414] border border-[#2a2a2a] shadow-xl overflow-hidden z-10"
            >
              <div className="p-3">
                <p className="text-[#6a6a6a] px-3 py-2" style={{ fontSize: '11px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {input.length > 0 ? 'Smart Suggestions' : 'Based on your upcoming schedule'}
                </p>
                <div className="space-y-1">
                  {suggestions.map((suggestion) => {
                    const Icon = suggestion.icon;
                    return (
                      <motion.button
                        key={suggestion.id}
                        whileHover={{ backgroundColor: '#1a1a1a' }}
                        onClick={() => {
                          setInput(suggestion.text);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-3 rounded-lg transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-[#1a1a1a]">
                            <Icon size={14} className="text-[#c9b896]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[#e8e8e8] mb-1" style={{ fontSize: '14px', fontWeight: 400 }}>
                              {suggestion.text}
                            </p>
                            {suggestion.context && (
                              <p className="text-[#6a6a6a]" style={{ fontSize: '12px', fontWeight: 300 }}>
                                {suggestion.context}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {!showSuggestions && (
        <div className="mt-6 space-y-2">
          <p className="text-[#6a6a6a] mb-3" style={{ fontSize: '13px', fontWeight: 300 }}>
            Quick starts
          </p>
          <div className="flex flex-wrap gap-2">
            {quickStarts.map((suggestion, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setInput(suggestion)}
                className="px-4 py-2 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] text-[#a0a0a0] hover:text-[#e8e8e8] hover:border-[#3a3a3a] transition-all"
                style={{ fontSize: '13px', fontWeight: 300 }}
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}