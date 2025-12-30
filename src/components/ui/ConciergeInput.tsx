import { Sparkles, Mic, ArrowRight, Calendar, Plane, Users, MapPin, Clock, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  
  // Default contextual suggestions
  return [
    {
      id: '1',
      text: 'Find me flights to Tokyo under $800',
      category: 'travel',
      icon: Plane,
    },
    {
      id: '2',
      text: 'Book a table for 4 at a Michelin-starred restaurant in SF',
      category: 'restaurant',
      icon: Users,
    },
    {
      id: '3',
      text: 'Reschedule my meeting with Alex to next week',
      category: 'meeting',
      icon: Calendar,
    },
  ];
};

interface ConciergeInputProps {
  onSend?: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hideSuggestions?: boolean; // Hide suggestions when loading or when task exists
  membershipLevel?: string; // For showing human concierge button
  firstName?: string; // User's first name for personalized greeting
}

// Rotating messages with a friendly, concierge tone
const assistantMessages = [
  "How can I assist you today?",
  "What would you like to accomplish?",
  "I'm here to help—what do you need?",
  "What can I take care of for you?",
  "How can I make your day easier?",
  "What would you like me to handle?",
  "I'm ready to help—what's on your mind?",
  "What can I do for you right now?",
  "How can I support you today?",
  "What would you like to get done?",
  "I'm here to help. What do you need?",
  "What can I take off your plate?",
];

// Get time of day based on local time
const getTimeOfDay = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return 'morning';
  } else if (hour >= 12 && hour < 17) {
    return 'afternoon';
  } else if (hour >= 17 && hour < 22) {
    return 'evening';
  } else {
    return 'night';
  }
};

// Get greeting based on time of day
const getGreeting = (timeOfDay: string, firstName?: string): string => {
  const name = firstName || 'there';
  return `Good ${timeOfDay}, ${name}.`;
};

export function ConciergeInput({ onSend, placeholder = 'Type your request or question...', disabled = false, hideSuggestions = false, membershipLevel, firstName }: ConciergeInputProps) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Select a random message on mount
  const [assistantMessage] = useState(() => {
    return assistantMessages[Math.floor(Math.random() * assistantMessages.length)];
  });
  

  useEffect(() => {
    // Hide suggestions immediately if hideSuggestions is true
    if (hideSuggestions) {
      setShowSuggestions(false);
      return;
    }
    
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
  }, [input, isFocused, hideSuggestions]);

  const quickStarts = [
    "Find me flights to Tokyo under $800",
    "Book a table for 4 at a Michelin-starred restaurant in SF",
    "Reschedule my meeting with Alex to next week",
  ];

  const handleSend = () => {
    if (input.trim() && onSend && !disabled) {
      const message = input.trim();
      // Hide suggestions immediately
      setShowSuggestions(false);
      // Clear input immediately
      setInput('');
      // Call onSend
      onSend(message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full bg-foreground dark:bg-surface-elevated border border-border">
          <Sparkles size={14} className="text-background dark:text-accent" />
          <span className="text-background dark:text-accent" style={{ fontSize: '12px', fontWeight: 300 }}>
            AI-Powered Concierge
          </span>
        </div>
        <p className="text-text-secondary" style={{ fontSize: '16px', fontWeight: 300 }}>
          {assistantMessage}
        </p>
      </div>

      {/* Human Concierge Button - Only for Premium+ members */}
      {membershipLevel && ['Premium', 'Executive', 'Founding Member'].includes(membershipLevel) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              const WHATSAPP_PHONE = '19179354877';
              const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_PHONE}`;
              const WHATSAPP_API_LINK = `https://api.whatsapp.com/send/?phone=${WHATSAPP_PHONE}&text&type=phone_number&app_absent=0`;
              const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
              const link = isMobile ? WHATSAPP_LINK : WHATSAPP_API_LINK;
              window.open(link, '_blank', 'noopener,noreferrer');
            }}
            className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-surface border border-border hover:border-accent/40 hover:bg-surface-elevated transition-all group"
          >
            <MessageCircle size={16} className="text-accent" />
            <span className="text-text-primary" style={{ fontSize: '14px', fontWeight: 400 }}>
              Need human help?{' '}
            </span>
            <span className="text-text-secondary group-hover:text-accent transition-colors" style={{ fontSize: '14px', fontWeight: 300 }}>
              Connect with our concierge team
            </span>
          </motion.button>
        </motion.div>
      )}

      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: isFocused ? 1.01 : 1 }}
        transition={{ duration: 0.2 }}
        className="relative"
      >
        <div className={`rounded-2xl bg-surface border transition-all duration-300 ${
          isFocused ? 'border-accent shadow-xl' : 'border-border shadow-lg'
        }`}>
          <div className="flex items-start gap-3 p-6">
            <Sparkles size={20} className="text-accent mt-2 flex-shrink-0" />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                // Delay to allow clicking suggestions
                setTimeout(() => setIsFocused(false), 200);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              autoFocus={false}
              className="flex-1 bg-transparent text-text-primary placeholder:text-text-tertiary outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontSize: '16px', fontWeight: 300, minHeight: '60px' }}
              rows={3}
            />
            <div className="flex items-center gap-2 mt-2">
              <button className="p-2 rounded-lg hover:bg-surface-elevated transition-colors">
                <Mic size={18} className="text-text-secondary" />
              </button>
              <button 
                onClick={handleSend}
                disabled={!input.trim() || disabled}
                className="p-2 rounded-lg bg-accent hover:bg-[#d4c4a6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRight size={18} className="text-background" />
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
              className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-surface border border-border shadow-xl overflow-hidden z-10"
            >
              <div className="p-3">
                <p className="text-text-tertiary px-3 py-2" style={{ fontSize: '11px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                          <div className="p-2 rounded-lg bg-surface-elevated">
                            <Icon size={14} className="text-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-text-primary mb-1" style={{ fontSize: '14px', fontWeight: 400 }}>
                              {suggestion.text}
                            </p>
                            {suggestion.context && (
                              <p className="text-text-tertiary" style={{ fontSize: '12px', fontWeight: 300 }}>
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

      {!showSuggestions && !hideSuggestions && (
        <div className="mt-6 space-y-2">
          <p className="text-text-tertiary mb-3" style={{ fontSize: '13px', fontWeight: 300 }}>
            Quick starts
          </p>
          <div className="flex flex-wrap gap-2">
            {quickStarts.map((suggestion, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setInput(suggestion)}
                className="px-4 py-2 rounded-full bg-surface-elevated border border-border text-text-secondary hover:text-text-primary hover:border-[#3a3a3a] transition-all"
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

