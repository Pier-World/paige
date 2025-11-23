import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { AIConsole } from '../components/features/AIConsole';
import { ConversationFeed } from '../components/features/ConversationFeed';
import { ForYouToday } from '../components/features/ForYouToday';
import { PerksSpotlight } from '../components/features/PerksSpotlight';
import { useAuth } from '../context/AuthContext';
import { callOrchestrator } from '../lib/api/orchestrator';
import type { ConversationMessage } from '../types/orchestrator';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();

  const handleSubmit = async (input: string) => {
    if (!user) return;

    const userMessage: ConversationMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await callOrchestrator({
        userId: user.id,
        input,
        source: 'portal',
        context: { page: 'home' },
        conversationId
      });

      if (!conversationId) {
        setConversationId(response.conversationId);
      }

      const assistantMessages: ConversationMessage[] = response.messages.map((msg, index) => ({
        id: `assistant_${Date.now()}_${index}`,
        role: msg.role,
        text: msg.text,
        modules: msg.modules,
        timestamp: new Date()
      }));

      setMessages(prev => [...prev, ...assistantMessages]);
    } catch (error) {
      console.error('Error calling orchestrator:', error);

      const errorMessage: ConversationMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        text: "I'm having trouble processing your request right now. Please try again or contact your concierge.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-16">
        {/* AI Console Hero */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-8"
        >
          <AIConsole onSubmit={handleSubmit} isLoading={isLoading} />
        </motion.section>

        {/* Conversation Feed */}
        {messages.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl mx-auto"
          >
            <ConversationFeed messages={messages} isLoading={isLoading} />
          </motion.section>
        )}

        {/* For You Today - Only show if no active conversation */}
        {messages.length === 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ForYouToday />
          </motion.section>
        )}

        {/* Perks Spotlight */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="border-t border-gray-200 pt-16"
        >
          <PerksSpotlight />
        </motion.section>

        {/* Recent Activity - Placeholder for future implementation */}
        {/* TODO: Wire this to Supabase history table */}
        {/* <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="border-t border-gray-200 pt-16"
        >
          <RecentActivity />
        </motion.section> */}
      </div>
    </AppLayout>
  );
};

export default HomePage;
