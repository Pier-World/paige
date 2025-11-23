import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { ConversationMessage } from '../../types/orchestrator';
import { ModuleRenderer } from './ModuleRenderer';

interface ConversationFeedProps {
  messages: ConversationMessage[];
  isLoading?: boolean;
}

export const ConversationFeed: React.FC<ConversationFeedProps> = ({ messages, isLoading }) => {
  return (
    <div className="space-y-6">
      <AnimatePresence mode="popLayout">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </AnimatePresence>

      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-start gap-3"
        >
          <div className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              <span className="text-sm text-gray-600">Thinking...</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const MessageBubble: React.FC<{ message: ConversationMessage }> = ({ message }) => {
  if (message.role === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex justify-end"
      >
        <div className="max-w-[85%] px-5 py-3 rounded-2xl bg-gray-900 text-white">
          <p className="text-sm leading-relaxed">{message.text}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex justify-start"
    >
      <div className="max-w-[90%] space-y-4">
        {/* Main response card */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
          <p className="text-sm text-gray-900 leading-relaxed font-medium">
            {message.text}
          </p>
        </div>

        {/* Render modules */}
        {message.modules && message.modules.length > 0 && (
          <ModuleRenderer modules={message.modules} />
        )}
      </div>
    </motion.div>
  );
};
