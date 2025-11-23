import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  createConversation,
  createMessage,
  getConversationMessages,
  generateConversationTitle,
  type Message as DBMessage
} from '../../lib/api/conversations';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface AIChatInterfaceProps {
  initialMessage?: string;
  conversationId?: string | null;
  onConversationCreated?: (id: string) => void;
}

export const AIChatInterface: React.FC<AIChatInterfaceProps> = ({
  initialMessage,
  conversationId,
  onConversationCreated
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationId || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasProcessedInitialMessage = useRef(false);
  const isProcessing = useRef(false);

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    } else if (initialMessage && !hasProcessedInitialMessage.current && !isProcessing.current) {
      hasProcessedInitialMessage.current = true;
      isProcessing.current = true;
      handleSend(initialMessage).finally(() => {
        isProcessing.current = false;
      });
    }
  }, [conversationId, initialMessage]);

  const loadConversation = async (convId: string) => {
    try {
      const dbMessages = await getConversationMessages(convId);
      const formattedMessages: Message[] = dbMessages.map(msg => ({
        id: msg.id,
        type: msg.role === 'user' ? 'user' : 'ai',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        metadata: msg.metadata
      }));
      setMessages(formattedMessages);
      setCurrentConversationId(convId);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading || !user?.id) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let timeoutId: number | undefined;

    try {
      let convId = currentConversationId;

      if (!convId) {
        const title = generateConversationTitle(textToSend);
        const newConv = await createConversation(user.id, title);
        convId = newConv.id;
        setCurrentConversationId(convId);
        if (onConversationCreated) {
          onConversationCreated(convId);
        }
      }

      await createMessage(convId, 'user', textToSend);

      const previousMessages = [...messages, userMessage].map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const { data: supabaseData } = await supabase.auth.getSession();
      const accessToken = supabaseData?.session?.access_token;

      timeoutId = setTimeout(() => {
        throw new Error('Request timeout - taking too long');
      }, 60000) as unknown as number;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/concierge-chat`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: textToSend,
            userId: user.id,
            conversationId: convId,
            context: {
              previousMessages,
              userProfile: user
            }
          })
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to get AI response: ${response.status}`);
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
        metadata: data.metadata
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      <div ref={containerRef} className="flex-1 overflow-y-auto px-6 py-6 flex flex-col-reverse">
        <div className="space-y-6 flex flex-col">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                {message.type === 'ai' && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-medium text-neutral-600">Paige</span>
                  </div>
                )}

                <div
                  className={`rounded-2xl px-5 py-3 ${
                    message.type === 'user'
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-50 text-neutral-900 border border-neutral-200'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

                  {message.metadata?.checklist && (
                    <div className="mt-3 pt-3 border-t border-neutral-200 space-y-1">
                      {message.metadata.checklist.map((item: string, idx: number) => (
                        <div key={idx} className="text-xs text-neutral-600 flex items-start gap-2">
                          <span className="text-neutral-400">•</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {message.metadata?.savings && (
                    <div className="mt-3 pt-3 border-t border-neutral-200">
                      <div className="text-xs font-medium text-green-600">
                        Est. Savings: {message.metadata.savings}
                      </div>
                    </div>
                  )}

                  {message.metadata?.bonus && (
                    <div className="mt-3 pt-3 border-t border-neutral-200">
                      <div className="text-xs text-neutral-600">
                        <span className="font-medium text-neutral-900">Bonus: </span>
                        {message.metadata.bonus}
                      </div>
                    </div>
                  )}
                </div>

                {message.type === 'user' && (
                  <div className="flex items-center gap-2 justify-end mt-2">
                    <span className="text-xs text-neutral-500">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-neutral-500"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Paige is thinking...</span>
          </motion.div>
        )}
        </div>

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-neutral-200 p-4">
        <div className="flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 resize-none rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
            rows={1}
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
