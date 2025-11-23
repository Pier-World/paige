import React, { useState, useRef } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface AIConsoleProps {
  onSubmit: (input: string) => void;
  isLoading?: boolean;
}

const EXAMPLE_CHIPS = [
  "Find me the best flights to Basel next week",
  "Book a table for 4 in SoHo at 7:30pm",
  "Plan my next 3 work trips",
  "Recommend 3 perks in NYC I should use this week"
];

export const AIConsole: React.FC<AIConsoleProps> = ({ onSubmit, isLoading }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSubmit(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChipClick = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
    setTimeout(() => {
      onSubmit(text);
      setInput('');
    }, 100);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">
          {getGreeting()}, Spencer.
        </h1>
        <p className="text-lg text-gray-600">
          What can I take off your plate today?
        </p>
      </motion.div>

      {/* Input Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-3xl mx-auto"
      >
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-2">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 pl-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Pier to book travel, plan a dinner, or handle life admin…"
              disabled={isLoading}
              className="flex-1 px-2 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Response time indicator */}
        <div className="flex items-center justify-center gap-2 mt-3">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-xs text-gray-500">Typical response time: 0.2s</span>
        </div>
      </motion.div>

      {/* Example chips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex flex-wrap items-center justify-center gap-2">
          {EXAMPLE_CHIPS.map((chip, index) => (
            <button
              key={index}
              onClick={() => handleChipClick(chip)}
              disabled={isLoading}
              className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-sm text-gray-700 transition-colors disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
