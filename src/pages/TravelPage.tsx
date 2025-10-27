import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, User, Sparkles, Check, Plus } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { useAuth } from '../context/AuthContext';
import { SmartChipsBar } from '../components/features/SmartChipsBar';
import { ResultCards } from '../components/features/ResultCards';
import { BookingModal } from '../components/features/BookingModal';
import useTravelStore from '../stores/travelStore';
import { parseTravelRequest, generateSummaryMessage } from '../lib/travelParser';
import {
  getOrCreateConversation,
  createTravelRequest,
  createMessage,
  updateTravelRequest,
  subscribeToRequestUpdates,
  subscribeToNewMessages,
  generateMockResults,
  getMessagesForConversation,
} from '../lib/api/travelRequests';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai' | 'agent';
  timestamp: Date;
}

const EXAMPLE_PROMPTS = [
  "Round trip NYC → Austin Friday to Sunday",
  "Suite at The Ritz Paris next weekend",
  "Private jet to Miami for 4 passengers tomorrow",
  "Business class flight to London, nonstop",
  "Hotel in Paris, near the Louvre, 5 nights",
  "Restaurant reservation at Carbone on Saturday",
];

const TravelPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const conversationIdRef = useRef<string | null>(null);

  const {
    activeTravelRequest,
    setActiveTravelRequest,
    chips,
    updateIntent,
    setSearching,
    setConversationId,
    updateRequestStatus,
  } = useTravelStore();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentExampleIndex((prev) => (prev + 1) % EXAMPLE_PROMPTS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, chips]);

  useEffect(() => {
    const initConversation = async () => {
      if (user?.id) {
        try {
          const convId = await getOrCreateConversation(user.id);
          conversationIdRef.current = convId;
          setConversationId(convId);

          const existingMessages = await getMessagesForConversation(convId);
          if (existingMessages.length > 0) {
            setMessages(existingMessages.map(msg => ({
              id: msg.id,
              content: msg.body,
              sender: msg.sent_by === 'user' ? 'user' : msg.sent_by === 'agent' ? 'agent' : 'ai',
              timestamp: msg.created_at,
            })));
          } else {
            const welcomeMsg: Message = {
              id: '1',
              content: `Good ${getTimeOfDay()}, ${user?.first_name || 'there'}! I'm Paige, your travel concierge assistant. I can help you book flights, hotels, ground transportation, and more. What would you like to arrange today?`,
              sender: 'ai',
              timestamp: new Date(),
            };
            setMessages([welcomeMsg]);
          }

          const unsubscribeMessages = subscribeToNewMessages(convId, (newMsg) => {
            if (newMsg.sent_by !== 'user') {
              setMessages(prev => [...prev, {
                id: newMsg.id,
                content: newMsg.body,
                sender: newMsg.sent_by === 'agent' ? 'agent' : 'ai',
                timestamp: newMsg.created_at,
              }]);
            }
          });

          return () => {
            unsubscribeMessages();
          };
        } catch (error) {
          console.error('Error initializing conversation:', error);
        }
      }
    };

    initConversation();
  }, [user, setConversationId]);

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

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setInputValue(prev => prev + finalTranscript);
          setLiveTranscript('');
        } else {
          setLiveTranscript(interimTranscript);
        }
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
        setLiveTranscript('');
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
        setLiveTranscript('');
      };
    }
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user?.id || !conversationIdRef.current) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = inputValue;
    setInputValue('');
    setIsTyping(true);

    try {
      await createMessage(conversationIdRef.current, 'in', 'user', userInput);

      const intent = parseTravelRequest(userInput);
      const isFollowUp = activeTravelRequest && (intent.flight?.cabin || intent.hotel || intent.types.includes('other'));

      let request = activeTravelRequest;

      if (isFollowUp && activeTravelRequest) {
        const updatedIntent = {
          ...activeTravelRequest.entities,
          flight: {
            ...activeTravelRequest.entities.flight,
            ...intent.flight,
          },
          hotel: {
            ...activeTravelRequest.entities.hotel,
            ...intent.hotel,
          },
        };

        await updateTravelRequest(activeTravelRequest.id, {
          entities: updatedIntent,
          raw_text: `${activeTravelRequest.raw_text}\n${userInput}`,
        });

        request = {
          ...activeTravelRequest,
          entities: updatedIntent,
          raw_text: `${activeTravelRequest.raw_text}\n${userInput}`,
        };
        setActiveTravelRequest(request);
        updateIntent(updatedIntent);

        const summaryMessage = generateSummaryMessage(updatedIntent, user.first_name || 'there');

        setTimeout(async () => {
          const aiResponse: Message = {
            id: (Date.now() + 1).toString(),
            content: summaryMessage,
            sender: 'ai',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, aiResponse]);
          setIsTyping(false);

          await createMessage(conversationIdRef.current!, 'out', 'paige', summaryMessage, request.id);

          if (!summaryMessage.includes('could you also let me know')) {
            setSearching(true);
            await generateMockResults(request.id, updatedIntent);
          }
        }, 1000);
      } else {
        request = await createTravelRequest(user.id, userInput, intent);
        setActiveTravelRequest(request);

        const summaryMessage = generateSummaryMessage(intent, user.first_name || 'there');

        setTimeout(async () => {
          const aiResponse: Message = {
            id: (Date.now() + 1).toString(),
            content: summaryMessage,
            sender: 'ai',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, aiResponse]);
          setIsTyping(false);

          await createMessage(conversationIdRef.current!, 'out', 'paige', summaryMessage, request.id);

          if (!summaryMessage.includes('could you also let me know')) {
            setSearching(true);
            await generateMockResults(request.id, intent);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      setIsTyping(false);
    }
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
      setLiveTranscript('');
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleExampleClick = () => {
    setInputValue(EXAMPLE_PROMPTS[currentExampleIndex]);
    inputRef.current?.focus();
  };

  const handleNewConversation = async () => {
    if (!user?.id) return;

    try {
      conversationIdRef.current = null;
      setMessages([]);
      setActiveTravelRequest(null);
      setSearching(false);

      const convId = await getOrCreateConversation(user.id);
      conversationIdRef.current = convId;
      setConversationId(convId);

      const welcomeMsg: Message = {
        id: Date.now().toString(),
        content: `Good ${getTimeOfDay()}, ${user?.first_name || 'there'}! I'm Paige, your travel concierge assistant. I can help you book flights, hotels, ground transportation, and more. What would you like to arrange today?`,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages([welcomeMsg]);

      await createMessage(convId, 'out', 'ai', welcomeMsg.content);
    } catch (error) {
      console.error('Error creating new conversation:', error);
    }
  };

  const handleConfirmBooking = async () => {
    if (activeTravelRequest) {
      await updateTravelRequest(activeTravelRequest.id, {
        status: 'booked',
      });
      updateRequestStatus('booked');

      const confirmMessage: Message = {
        id: (Date.now() + 3).toString(),
        content: "Your booking has been confirmed! You'll receive a confirmation email shortly with all the details. Is there anything else I can help you with?",
        sender: 'agent',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, confirmMessage]);

      if (conversationIdRef.current) {
        await createMessage(
          conversationIdRef.current,
          'out',
          'agent',
          confirmMessage.content,
          activeTravelRequest.id
        );
      }
    }
    setIsBookingModalOpen(false);
  };

  const selectedOffer = activeTravelRequest?.results.find(offer => offer.selected) || null;

  return (
    <PageLayout>
      <div className="fixed inset-0 top-[80px] flex flex-col bg-white">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-6 px-6 border-b border-slate-700 flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Sparkles className="text-amber-400" size={24} />
                <h1 className="text-3xl font-display font-medium">Travel Concierge</h1>
              </div>
              <button
                onClick={handleNewConversation}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm font-medium"
              >
                <Plus size={18} />
                New Conversation
              </button>
            </div>
            <p className="text-slate-300">
              Chat with Paige, our AI assistant, or connect with a human concierge
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
            <AnimatePresence>
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </AnimatePresence>

            {chips.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="ml-11"
              >
                <SmartChipsBar />
              </motion.div>
            )}

            {activeTravelRequest && activeTravelRequest.results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8"
              >
                <ResultCards />
                {selectedOffer && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => setIsBookingModalOpen(true)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                    >
                      Proceed to Booking
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-5 py-3">
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

        <div className="border-t border-slate-200 px-6 py-4 flex-shrink-0 bg-white">
          <div className="max-w-3xl mx-auto">
            {liveTranscript && (
              <div className="mb-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                <span className="font-medium">Listening: </span>{liveTranscript}
              </div>
            )}
            <div className="relative">
              {!inputValue && !liveTranscript && (
                <AnimatePresence mode="wait">
                  <motion.button
                    key={currentExampleIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={handleExampleClick}
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-left pointer-events-auto hover:text-slate-500 transition-colors z-10 text-[15px]"
                  >
                    {EXAMPLE_PROMPTS[currentExampleIndex]}
                  </motion.button>
                </AnimatePresence>
              )}

              <div className="flex items-center gap-2 bg-slate-100 rounded-3xl px-4 py-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder=" "
                  className="flex-1 bg-transparent outline-none text-slate-900 placeholder-transparent text-[15px]"
                />

                <button
                  onClick={toggleRecording}
                  className={`p-2 rounded-full transition-all flex-shrink-0 ${
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                  title={isRecording ? 'Stop recording' : 'Start voice input'}
                >
                  {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                </button>

                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className={`p-2 rounded-full transition-all flex-shrink-0 ${
                    inputValue.trim()
                      ? 'bg-slate-900 text-white hover:bg-slate-800'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-3 text-center">
              Press Enter to send • Click the microphone to speak • Our team typically responds within 5 minutes
            </p>
          </div>
        </div>
      </div>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        selectedOffer={selectedOffer}
        onConfirm={handleConfirmBooking}
      />
    </PageLayout>
  );
};

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.sender === 'user';
  const isAgent = message.sender === 'agent';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {!isUser && (
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isAgent
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
              : 'bg-gradient-to-br from-blue-500 to-blue-600'
          }`}
        >
          {isAgent ? <Check size={16} className="text-white" /> : <Sparkles size={16} className="text-white" />}
        </div>
      )}

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center flex-shrink-0">
          <User size={16} className="text-white" />
        </div>
      )}

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} flex-1 min-w-0`}>
        {!isUser && (
          <span className={`text-xs font-medium mb-1.5 ${isAgent ? 'text-emerald-600' : 'text-blue-600'}`}>
            {isAgent ? 'Concierge Team' : 'Paige'}
          </span>
        )}

        <div
          className={`rounded-2xl px-5 py-3 max-w-[85%] ${
            isUser
              ? 'bg-slate-900 text-white'
              : isAgent
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-slate-100 text-slate-900'
          }`}
        >
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>

        <span className="text-[11px] text-slate-400 mt-1">
          {message.timestamp.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
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

export default TravelPage;