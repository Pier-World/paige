import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Paperclip, Search, Plus, Clock } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { useAuth } from '../context/AuthContext';
import { AIChatInterface } from '../components/features/AIChatInterface';

const TravelPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [greeting, setGreeting] = useState('Good evening');
  const [inputValue, setInputValue] = useState('');
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const examplePrompts = [
    {
      title: 'Book a last-minute weekend getaway',
      subtitle: 'to Miami with hotel and dinner reservations',
      icon: '✈️'
    },
    {
      title: 'Find me a Michelin-star restaurant',
      subtitle: 'in NYC for Saturday night, party of 4',
      icon: '🍽️'
    },
    {
      title: 'Plan a romantic anniversary trip',
      subtitle: 'to Paris with luxury hotel and experiences',
      icon: '💝'
    },
    {
      title: 'Get me a private car service',
      subtitle: 'from JFK to Manhattan tomorrow at 3pm',
      icon: '🚗'
    }
  ];

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt);
    setShowChat(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setShowChat(true);
    }
  };

  return (
    <PageLayout>
      <div className="min-h-[calc(100vh-80px)] bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {!showChat ? (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12"
              >
                {/* Avatar/Logo */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="mb-8"
                >
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-neutral-800 via-neutral-700 to-neutral-900 flex items-center justify-center shadow-xl">
                    <Sparkles className="w-12 h-12 text-white" />
                  </div>
                </motion.div>

                {/* Greeting */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center mb-12"
                >
                  <h1 className="text-5xl font-serif font-light mb-3 text-neutral-900">
                    {greeting}, {user?.first_name || 'Guest'}
                  </h1>
                  <p className="text-2xl font-serif font-light text-neutral-900">
                    What's on <span className="text-neutral-700">your mind?</span>
                  </p>
                </motion.div>

                {/* Input Box */}
                <motion.form
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  onSubmit={handleSubmit}
                  className="w-full max-w-3xl mb-12"
                >
                  <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    <textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Ask AI a question or make a request..."
                      className="w-full px-6 py-5 text-base text-neutral-900 placeholder-neutral-400 resize-none focus:outline-none bg-transparent"
                      rows={3}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                    />

                    <div className="px-4 py-3 bg-neutral-50 flex items-center justify-between border-t border-neutral-100">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                          <Paperclip className="w-5 h-5" />
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={!inputValue.trim()}
                        className="px-4 py-2 bg-neutral-900 text-white rounded-lg flex items-center gap-2 hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-neutral-900"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.form>

                {/* Example Prompts */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="w-full max-w-3xl"
                >
                  <p className="text-xs uppercase tracking-wider text-neutral-500 font-medium mb-4 text-center">
                    Get started with an example below
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {examplePrompts.map((prompt, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + index * 0.05 }}
                        onClick={() => handlePromptClick(prompt.title + ' ' + prompt.subtitle)}
                        className="group bg-white border border-neutral-200 rounded-xl p-4 text-left hover:border-neutral-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{prompt.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-neutral-900 mb-1 group-hover:text-neutral-700 transition-colors">
                              {prompt.title}
                            </div>
                            <div className="text-xs text-neutral-500">
                              {prompt.subtitle}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-8"
              >
                <div className="mb-6 flex items-center justify-between">
                  <button
                    onClick={() => setShowChat(false)}
                    className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                  >
                    ← Back to start
                  </button>
                  <button
                    onClick={() => {
                      setInputValue('');
                      setShowChat(false);
                    }}
                    className="px-4 py-2 bg-neutral-900 text-white text-sm rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    New Request
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg">
                  <AIChatInterface initialMessage={inputValue} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageLayout>
  );
};

export default TravelPage;
