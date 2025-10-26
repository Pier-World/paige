import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, User, Sparkles, Check } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai' | 'agent';
  timestamp: Date;
  isTyping?: boolean;
}

const EXAMPLE_PROMPTS = [
  "2 tickets NYC to LA business class",
  "Driver to take me from airport home this Friday",
  "Suite at The Ritz Paris next weekend",
  "Private jet to Miami for 4 passengers tomorrow",
  "Restaurant reservation at Carbone on Saturday",
  "Helicopter tour of Manhattan this afternoon",
  "First class round trip to Tokyo in April",
  "Yacht charter in the Hamptons for the weekend",
  "Villa rental in Tuscany for two weeks",
  "VIP tickets to the US Open finals"
];

const TravelPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Good ${getTimeOfDay()}, ${user?.first_name || 'there'}! I'm your travel concierge assistant. I can help you book flights, hotels, ground transportation, dining reservations, and more. What would you like to arrange today?`,
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Rotate example prompts
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentExampleIndex((prev) => (prev + 1) % EXAMPLE_PROMPTS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateAIResponse(userMessage.content),
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);

      // Sometimes add agent follow-up
      if (Math.random() > 0.7) {
        setTimeout(() => {
          const agentMessage: Message = {
            id: (Date.now() + 2).toString(),
            content: "A member of our concierge team will personally review your request and reach out within the hour to finalize details.",
            sender: 'agent',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, agentMessage]);
        }, 2000);
      }
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please try Chrome or Safari.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleExampleClick = () => {
    setInputValue(EXAMPLE_PROMPTS[currentExampleIndex]);
    inputRef.current?.focus();
  };

  return (
    <PageLayout>
      <div className="flex flex-col h-[calc(100vh-80px)]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-8 px-6 border-b border-slate-700">
          <div className="container-custom">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="text-amber-400" size={24} />
              <h1 className="text-3xl font-display font-medium">Travel Concierge</h1>
            </div>
            <p className="text-slate-300">
              Chat with our AI assistant or connect with a human concierge
            </p>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-8">
          <div className="container-custom max-w-4xl mx-auto space-y-6">
            <AnimatePresence>
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={18} className="text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-6 py-4 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-slate-200 px-6 py-6">
          <div className="container-custom max-w-4xl mx-auto">
            <div className="relative">
              {/* Example Prompt Overlay */}
              {!inputValue && (
                <AnimatePresence mode="wait">
                  <motion.button
                    key={currentExampleIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    onClick={handleExampleClick}
                    className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 text-left pointer-events-auto hover:text-slate-500 transition-colors"
                  >
                    {EXAMPLE_PROMPTS[currentExampleIndex]}
                  </motion.button>
                </AnimatePresence>
              )}

              <div className="flex items-end gap-3 bg-slate-100 rounded-2xl p-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder=" "
                  className="flex-1 bg-transparent px-4 py-3 outline-none text-slate-900 placeholder-transparent"
                />

                <button
                  onClick={toggleRecording}
                  className={`p-3 rounded-xl transition-all ${
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-white text-slate-600 hover:bg-slate-200'
                  }`}
                  title={isRecording ? 'Stop recording' : 'Start voice input'}
                >
                  {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                </button>

                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className={`p-3 rounded-xl transition-all ${
                    inputValue.trim()
                      ? 'bg-slate-900 text-white hover:bg-slate-800'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Send size={20} />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-3 text-center">
              Press Enter to send • Click the microphone to speak • Our team typically responds within 5 minutes
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.sender === 'user';
  const isAgent = message.sender === 'agent';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            isAgent
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
              : 'bg-gradient-to-br from-blue-500 to-blue-600'
          }`}
        >
          {isAgent ? <Check size={18} className="text-white" /> : <Sparkles size={18} className="text-white" />}
        </div>
      )}

      {isUser && (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center flex-shrink-0">
          <User size={18} className="text-white" />
        </div>
      )}

      {/* Message Content */}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {!isUser && (
          <span className={`text-xs font-medium mb-1 px-1 ${isAgent ? 'text-emerald-600' : 'text-blue-600'}`}>
            {isAgent ? 'Concierge Team' : 'AI Assistant'}
          </span>
        )}

        <div
          className={`rounded-2xl px-6 py-4 shadow-sm ${
            isUser
              ? 'bg-slate-900 text-white rounded-tr-sm'
              : isAgent
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-tl-sm'
              : 'bg-white text-slate-900 rounded-tl-sm'
          }`}
        >
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>

        <span className="text-xs text-slate-400 mt-1 px-1">
          {message.timestamp.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })}
        </span>
      </div>
    </motion.div>
  );
};

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function generateAIResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('flight') || lowerMessage.includes('ticket')) {
    return "I'd be happy to help you book your flight! Let me check availability for you. Could you confirm the dates you're looking to travel? I'll also check for any upgrades or lounge access available with your membership.";
  }

  if (lowerMessage.includes('hotel') || lowerMessage.includes('suite') || lowerMessage.includes('room')) {
    return "Perfect! I'm searching for the best accommodations for you. With your membership level, I can secure complimentary upgrades, early check-in, and late checkout at our partner hotels. Let me prepare some options for you.";
  }

  if (lowerMessage.includes('driver') || lowerMessage.includes('car') || lowerMessage.includes('transport')) {
    return "I'll arrange ground transportation for you right away. I can provide luxury vehicle options with professional drivers. Would you like a sedan, SUV, or something more specific?";
  }

  if (lowerMessage.includes('restaurant') || lowerMessage.includes('dinner') || lowerMessage.includes('reservation')) {
    return "Excellent choice! I can secure reservations at exclusive restaurants, including those typically fully booked. Let me check availability and get back to you with confirmed options within the next few minutes.";
  }

  if (lowerMessage.includes('private jet') || lowerMessage.includes('charter')) {
    return "I'll coordinate your private aviation needs. I'm reaching out to our aviation partners now to provide you with aircraft options, pricing, and availability. You should expect a detailed proposal shortly.";
  }

  return "I understand what you're looking for. Let me gather the best options for you and I'll follow up shortly with personalized recommendations. Our concierge team will also review this to ensure we exceed your expectations.";
}

export default TravelPage;
