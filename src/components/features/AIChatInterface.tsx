import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, TrendingDown, Gift, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    savings?: string;
    bonus?: string;
    checklist?: string[];
    responseTime?: number;
  };
}

interface AIChatInterfaceProps {
  onSendMessage?: (message: string) => void;
}

export const AIChatInterface: React.FC<AIChatInterfaceProps> = ({ onSendMessage }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: "I'm your personal concierge. Ask me anything — flights, hotels, restaurants, reservations, or anything else you need.",
      timestamp: new Date(),
      metadata: {
        responseTime: 0.2
      }
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Instant acknowledgment (0.2s)
    setTimeout(() => {
      const ackMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "On it. Let me find the best options for you...",
        timestamp: new Date(),
        metadata: {
          responseTime: 0.2
        }
      };
      setMessages(prev => [...prev, ackMessage]);
    }, 200);

    if (onSendMessage) {
      onSendMessage(input);
    }

    // Simulate AI processing (this will be replaced with real API call)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 2).toString(),
        type: 'ai',
        content: generateMockResponse(input),
        timestamp: new Date(),
        metadata: generateMockMetadata(input)
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-gray-500"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Processing...</span>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Example Prompts */}
      {messages.length === 1 && (
        <div className="px-6 pb-4">
          <p className="text-xs text-gray-500 mb-3">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(prompt)}
                className="text-xs px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              rows={1}
              className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-center text-gray-400 mt-3">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            Typical response time: 0.2s
          </span>
        </p>
      </div>
    </div>
  );
};

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  if (message.type === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[80%] px-5 py-3 rounded-2xl bg-[#0C1424] text-white">
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex justify-start"
    >
      <div className="max-w-[85%] space-y-3">
        {/* Main message */}
        <div className="px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100">
          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>

          {/* Checklist */}
          {message.metadata?.checklist && message.metadata.checklist.length > 0 && (
            <div className="mt-4 space-y-2">
              {message.metadata.checklist.map((item, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bonus insight */}
        {message.metadata?.bonus && (
          <div className="px-4 py-3 rounded-xl bg-orange-50 border border-orange-100 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-800">
              <span className="font-semibold text-orange-900">Bonus:</span> {message.metadata.bonus}
            </p>
          </div>
        )}

        {/* Savings badge */}
        {message.metadata?.savings && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200">
            <TrendingDown className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-green-800">
              Estimated savings: {message.metadata.savings}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const EXAMPLE_PROMPTS = [
  "Find me flights to Basel next week",
  "I need a reservation at Zuni Café tonight",
  "Book a car to SFO tomorrow at 2pm",
  "Find me a hotel in Paris with Amex benefits",
  "What are my upcoming trips?",
  "Optimize my credit card rewards"
];

// Mock response generator (will be replaced with real AI)
function generateMockResponse(input: string): string {
  const lowerInput = input.toLowerCase();

  if (lowerInput.includes('flight') || lowerInput.includes('basel')) {
    return "On it. I found 3 options that save you $3,200+ vs booking direct...";
  }

  if (lowerInput.includes('reservation') || lowerInput.includes('restaurant')) {
    return "Booked. Table for 2 at 7:30pm — your usual spot by the window.";
  }

  if (lowerInput.includes('hotel')) {
    return "I found 5 hotels with your Amex Platinum benefits. The Ritz has a suite upgrade available for 25k points.";
  }

  return "I'm on it. Let me get you the best options...";
}

function generateMockMetadata(input: string): Message['metadata'] {
  const lowerInput = input.toLowerCase();

  if (lowerInput.includes('flight') || lowerInput.includes('basel')) {
    return {
      checklist: [
        "Private fare through Amex: $1,850 (reg. $2,400)",
        "Redemption option: 45k points + $180",
        "Premium Economy upgrade available for 15k points"
      ],
      bonus: "Basel Art Week starts the day you land — I've flagged 4 galleries you'll love.",
      savings: "$3,200+",
      responseTime: 0.5
    };
  }

  if (lowerInput.includes('reservation') || lowerInput.includes('restaurant')) {
    return {
      checklist: [
        "Your partner's dietary preferences saved",
        "Wine pairing pre-ordered based on your history",
        "Car scheduled for 7:15pm pickup"
      ],
      bonus: "Your investor Sarah mentioned she loves this place — want me to invite her?",
      responseTime: 0.4
    };
  }

  return {
    responseTime: 0.3
  };
}
