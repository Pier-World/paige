import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { EnhancedTaskCard } from '../components/ui/EnhancedTaskCard';
import { 
  ArrowLeft, 
  Send, 
  Search, 
  Plus,
  Home,
  Plane,
  UtensilsCrossed,
  Calendar,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { callOrchestrator } from '../lib/orchestrator';
import { HotelRecommendationCard, HotelRecommendation } from '../components/ui/HotelRecommendationCard';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'human';
  content: string;
  created_at: string;
  metadata?: {
    recommendations?: any[];
    output_data?: any;
    [key: string]: any;
  };
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  created_at: string;
  output_data?: any;
  ui_state?: any;
  assigned_agent?: string;
  completed_at?: string;
  updated_at?: string;
}

interface Thread {
  id: string;
  title: string;
  description?: string;
  status: string;
  created_at: string;
  last_message_at?: string;
  assigned_agent?: string;
}

const ConversationPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(taskId || null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSidebarMobile, setShowSidebarMobile] = useState(false);

  // Detect mobile/desktop
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowSidebarMobile(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load task and messages
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    // Always load threads first
    loadThreads();
    
    if (taskId) {
      setSelectedThreadId(taskId);
      loadTaskAndMessages();
    } else {
      // No task selected - just load threads
      setTask(null);
      setMessages([]);
      setLoading(false);
    }
  }, [taskId, user]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 100)}px`;
    }
  }, [inputMessage]);

  async function loadTaskAndMessages() {
    if (!taskId || !user) return;

    try {
      setLoading(true);
      // Load task
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .eq('user_id', user.id)
        .single();

      if (taskError) throw taskError;
      if (!taskData) {
        navigate('/conversation');
        return;
      }

      setTask(taskData);

      // Build initial messages from task description
      const initialMessages: Message[] = [];
      
      // Extract original request and follow-ups from description
      if (taskData.description) {
        const parts = taskData.description.split('\n\nFollow-up:');
        parts.forEach((part: string, index: number) => {
          if (index === 0) {
            // Original request
            initialMessages.push({
              id: `task-${taskData.id}-original`,
              role: 'user',
              content: part.trim(),
              created_at: taskData.created_at,
            });
          } else {
            // Follow-up
            initialMessages.push({
              id: `task-${taskData.id}-followup-${index}`,
              role: 'user',
              content: part.trim(),
              created_at: taskData.created_at,
            });
          }
        });
      }

      // Load conversation messages
      const { data: conversationMessages, error: msgError } = await supabase
        .from('conversations')
        .select('*')
        .eq('related_task_id', taskId)
        .order('created_at', { ascending: true });

      if (!msgError && conversationMessages) {
        // Merge conversation messages
        conversationMessages.forEach((msg) => {
          // Check if message is from human concierge
          const isHuman = msg.metadata?.source === 'human' || msg.metadata?.concierge === true;
          initialMessages.push({
            id: msg.id,
            role: isHuman ? 'human' : (msg.role as 'user' | 'assistant'),
            content: msg.content,
            created_at: msg.created_at,
            metadata: msg.metadata,
          });
        });
      }

      // If task is completed and has recommendations, add them as a message
      if (taskData.status === 'completed' && taskData.output_data) {
        const outputData = taskData.output_data;
        const recommendations = outputData.recommendations || outputData.hotels || [];
        
        if (recommendations.length > 0) {
          // Check if we already have a message with recommendations
          const hasRecommendationsMessage = initialMessages.some(
            msg => msg.metadata?.recommendations && msg.metadata.recommendations.length > 0
          );
          
          if (!hasRecommendationsMessage) {
            // Fetch full hotel data for images
            const hotelIds = recommendations.map((r: any) => r.hotel_id || r.id).filter(Boolean);
            let enrichedRecommendations = recommendations;
            
            if (hotelIds.length > 0) {
              try {
                const { data: hotelData } = await supabase
                  .from('hotels')
                  .select('id, star_rating, notes_curated, amenities, address, neighborhood, primary_city')
                  .in('id', hotelIds);
                
                if (hotelData) {
                  enrichedRecommendations = recommendations.map((rec: any) => {
                    const hotel = hotelData.find((h: any) => h.id === (rec.hotel_id || rec.id));
                    return {
                      ...rec,
                      // Images will come from rec.image_hero or fallback
                      star_rating: hotel?.star_rating || rec.star_rating || rec.rating,
                      description: hotel?.notes_curated || rec.description,
                      amenities: hotel?.amenities || rec.amenities || [],
                      address: hotel?.address || rec.address,
                      neighborhood: hotel?.neighborhood || rec.neighborhood,
                      primary_city: hotel?.primary_city || rec.city,
                    };
                  });
                }
              } catch (error) {
                console.error('Error fetching hotel images:', error);
              }
            }
            
            // Add AI response message with recommendations
            initialMessages.push({
              id: `task-${taskData.id}-recommendations`,
              role: 'assistant',
              content: `I've found ${enrichedRecommendations.length} perfect match${enrichedRecommendations.length !== 1 ? 'es' : ''} for you. Here are my top recommendations:`,
              created_at: taskData.completed_at || taskData.updated_at || new Date().toISOString(),
              metadata: {
                recommendations: enrichedRecommendations,
                output_data: outputData,
              },
            });
          }
        }
      }

      // Sort by timestamp
      initialMessages.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      setMessages(initialMessages);
    } catch (error) {
      console.error('Error loading task:', error);
      navigate('/conversation');
    } finally {
      setLoading(false);
    }
  }

  async function loadThreads() {
    if (!user) return;

    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('id, title, description, status, created_at, assigned_agent')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get last message time for each task
      const tasksWithMessages = await Promise.all(
        (tasks || []).map(async (t) => {
          const { data: lastMsg } = await supabase
            .from('conversations')
            .select('created_at')
            .eq('related_task_id', t.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...t,
            last_message_at: lastMsg?.created_at || t.created_at,
          };
        })
      );

      setThreads(tasksWithMessages);
    } catch (error) {
      console.error('Error loading threads:', error);
    }
  }

  async function handleSendMessage() {
    if (!taskId || !user || !inputMessage.trim() || sending) return;

    const message = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    // Add user message to UI immediately
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: message,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Call orchestrator
      const response = await callOrchestrator(user.id, message, taskId);

      // Add assistant response
      if (response.task && response.response) {
        // Check if task has recommendations in output_data
        const taskData = response.task as any;
        const recommendations = taskData?.output_data?.recommendations || taskData?.output_data?.hotels || [];
        const intent = response.intent as any;
        
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.response,
          created_at: new Date().toISOString(),
          metadata: {
            intent: intent?.intent_type,
            strategy: response.strategy,
            ...(recommendations.length > 0 && {
              recommendations: recommendations,
              output_data: taskData?.output_data,
            }),
          },
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Reload task to get updated state
        await loadTaskAndMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove user message on error
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setSending(false);
    }
  }

  const handleThreadSelect = (threadId: string) => {
    setSelectedThreadId(threadId);
    navigate(`/conversation/${threadId}`, { replace: true });
    if (isMobile) {
      setShowSidebarMobile(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getTaskIcon = (task: Thread) => {
    const title = (task.title || '').toLowerCase();
    if (title.includes('flight') || title.includes('travel')) return Plane;
    if (title.includes('restaurant') || title.includes('dining')) return UtensilsCrossed;
    if (title.includes('meeting') || title.includes('calendar')) return Calendar;
    if (task.assigned_agent === 'hotel' || title.includes('hotel')) return Home;
    return MessageSquare;
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          label: 'COMPLETED',
          color: 'bg-green-500/12 text-green-400',
          icon: CheckCircle2,
          dotColor: 'bg-green-400',
        };
      case 'awaiting_human':
        return {
          label: 'NEEDS REVIEW',
          color: 'bg-amber-500/12 text-amber-400',
          icon: AlertCircle,
          dotColor: 'bg-amber-400',
        };
      case 'in_progress':
      case 'pending':
        return {
          label: 'IN PROGRESS',
          color: 'bg-accent/12 text-accent',
          icon: Clock,
          dotColor: 'bg-accent',
        };
      default:
        return {
          label: status.toUpperCase(),
          color: 'bg-gray-500/12 text-gray-400',
          icon: Clock,
          dotColor: 'bg-gray-400',
        };
    }
  };

  const filteredThreads = threads.filter((thread) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      thread.title?.toLowerCase().includes(query) ||
      thread.description?.toLowerCase().includes(query)
    );
  });

  // For mobile sidebar, show all threads
  // For desktop, show all threads (filtering happens via search)

  if (loading && !task) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent"></div>
        </div>
      </PageLayout>
    );
  }

  // Mobile layout: Single conversation view or sidebar
  if (isMobile) {
    if (showSidebarMobile || !taskId || !task) {
      return (
        <PageLayout>
          <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
              <div className="flex items-center gap-4 px-4 py-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="p-2 hover:bg-surface rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-text-primary" />
                </button>
                <div className="flex-1">
                  <h1 className="text-text-primary" style={{ fontSize: '18px', fontWeight: 400, fontFamily: 'Playfair Display, serif' }}>
                    Conversations
                  </h1>
                </div>
                <Link
                  to="/dashboard"
                  className="px-4 py-2 rounded-lg bg-accent hover:bg-[#d4c4a6] text-background transition-colors"
                  style={{ fontSize: '13px', fontWeight: 500 }}
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  New
                </Link>
              </div>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent/50 transition-colors"
                  style={{ fontSize: '14px' }}
                />
              </div>
            </div>

            {/* Threads List */}
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {filteredThreads.map((thread) => {
                const Icon = getTaskIcon(thread);
                const statusConfig = getStatusConfig(thread.status);

                return (
                  <button
                    key={thread.id}
                    onClick={() => handleThreadSelect(thread.id)}
                    className="w-full text-left p-4 rounded-xl hover:bg-surface/50 transition-colors mb-1"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        thread.assigned_agent === 'hotel' || (thread.title || '').toLowerCase().includes('hotel')
                          ? 'bg-accent/20'
                          : 'bg-surface'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          thread.assigned_agent === 'hotel' || (thread.title || '').toLowerCase().includes('hotel')
                            ? 'text-accent'
                            : 'text-text-tertiary'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-text-primary truncate flex-1" style={{ fontSize: '14px', fontWeight: 500 }}>
                            {thread.title}
                          </h3>
                          <span className="text-text-tertiary text-xs whitespace-nowrap ml-2">
                            {formatTime(thread.last_message_at || thread.created_at)}
                          </span>
                        </div>
                        {thread.description && (
                          <p className="text-text-tertiary truncate mb-2" style={{ fontSize: '13px', fontWeight: 300 }}>
                            {thread.description.split('\n\nFollow-up:')[0]}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${statusConfig.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`}></span>
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </PageLayout>
      );
    }

    // Mobile: Active conversation view
    return (
      <PageLayout>
        <div className="min-h-screen bg-background flex flex-col">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
            <div className="flex items-center gap-4 px-4 py-3">
              <button
                onClick={() => setShowSidebarMobile(true)}
                className="p-2 hover:bg-surface rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-text-primary" />
              </button>
              <div className="flex-1">
                <h1 className="text-text-primary truncate" style={{ fontSize: '16px', fontWeight: 500 }}>
                  {task?.title || 'Conversation'}
                </h1>
              </div>
              {task && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${getStatusConfig(task.status).color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${getStatusConfig(task.status).dotColor}`}></span>
                  {getStatusConfig(task.status).label}
                </span>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => {
                const prevMessage = index > 0 ? messages[index - 1] : null;
                const showDateSeparator = prevMessage && 
                  new Date(message.created_at).toDateString() !== new Date(prevMessage.created_at).toDateString();

                return (
                  <React.Fragment key={message.id}>
                    {showDateSeparator && (
                      <div className="flex items-center gap-4 my-4">
                        <div className="flex-1 h-px bg-border"></div>
                        <span className="text-text-tertiary text-xs">
                          {new Date(message.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                        </span>
                        <div className="flex-1 h-px bg-border"></div>
                      </div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user'
                          ? 'bg-surface'
                          : message.role === 'human'
                          ? 'bg-green-500/20'
                          : 'bg-accent/20'
                      }`}>
                        {message.role === 'user' ? (
                          <UserIcon className="w-4 h-4 text-text-secondary" />
                        ) : message.role === 'human' ? (
                          <UserIcon className="w-4 h-4 text-green-400" />
                        ) : (
                          <MessageSquare className="w-4 h-4 text-accent" />
                        )}
                      </div>

                      {/* Message Content */}
                      <div className={`flex flex-col gap-1.5 max-w-[80%] ${message.role === 'user' ? 'items-end' : ''}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-text-tertiary text-xs font-medium">
                            {message.role === 'user' ? 'You' : message.role === 'human' ? 'Pier Concierge' : 'Pier AI'}
                          </span>
                          <span className="text-text-tertiary text-xs">
                            {formatMessageTime(message.created_at)}
                          </span>
                        </div>
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            message.role === 'user'
                              ? 'bg-accent text-accent-foreground dark:text-background rounded-tr-sm'
                              : message.role === 'human'
                              ? 'bg-surface border border-green-500/20 rounded-tl-sm'
                              : 'bg-surface border border-border rounded-tl-sm'
                          }`}
                          style={{ fontSize: '15px', fontWeight: 300, lineHeight: '1.6' }}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                            {/* Show recommendations if present */}
                            {message.metadata?.recommendations && message.metadata.recommendations.length > 0 && (
                              <div className="mt-4 space-y-4">
                                {message.metadata.recommendations.map((rec: any, idx: number) => {
                                  // Transform to HotelRecommendation format
                                  const hotel: HotelRecommendation = {
                                    id: rec.id || rec.hotel_id,
                                    hotel_id: rec.hotel_id || rec.id,
                                    name: rec.name,
                                    location: rec.location || `${rec.neighborhood || ''}, ${rec.city || ''}`.trim(),
                                    city: rec.city || '',
                                    neighborhood: rec.neighborhood,
                                    rating: rec.star_rating || rec.rating,
                                    reviewCount: rec.review_count,
                                    averageRate: rec.rate_estimate ? `$${rec.rate_estimate.mid}` : (rec.rate_mid ? `$${rec.rate_mid}` : 'Rate on request'),
                                    imageUrl: rec.image_hero || rec.image_url || rec.image_hero_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
                                    image_hero: rec.image_hero || rec.image_url || rec.image_hero_url,
                                    pierBenefits: rec.pier_benefits || rec.pierBenefits || [],
                                    matchReasons: rec.reason ? [rec.reason] : ['Great option based on your preferences'],
                                    reason: rec.reason,
                                    description: rec.description || rec.notes_curated,
                                    amenities: rec.amenities || [],
                                    rate_estimate: rec.rate_estimate,
                                  };
                                  return (
                                    <HotelRecommendationCard
                                      key={rec.id || rec.hotel_id || idx}
                                      hotel={hotel}
                                      index={idx}
                                      onOpenConcierge={() => {
                                        // TODO: Open human concierge
                                        console.log('Open concierge for hotel:', hotel.id);
                                      }}
                                    />
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </React.Fragment>
                    );
                  })}
                </AnimatePresence>

                {/* Progress indicator if task is in progress */}
            {task && task.status !== 'completed' && task.ui_state?.progress && (
              <div className="bg-surface border border-border rounded-xl p-4 my-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-text-secondary text-sm">{task.ui_state.status_message || 'Processing...'}</span>
                  <span className="text-accent text-sm font-medium">{task.ui_state.progress}%</span>
                </div>
                <div className="h-1 bg-surface-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent/60 to-accent rounded-full transition-all duration-300"
                    style={{ width: `${task.ui_state.progress}%` }}
                  />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Task Results (if completed) */}
          {task && task.status === 'completed' && task.output_data && (
            <div className="px-4 pb-4 border-t border-border">
              <EnhancedTaskCard taskId={task.id} variant="compact" />
            </div>
          )}

          {/* Input */}
          <div className="sticky bottom-0 bg-background border-t border-border p-4">
            <div className="flex items-end gap-3 bg-surface border border-border-medium rounded-2xl p-3 focus-within:border-accent/50 focus-within:shadow-lg transition-all">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={sending}
                className="flex-1 bg-transparent border-none outline-none resize-none text-text-primary placeholder-text-tertiary"
                style={{ fontSize: '14px', minHeight: '24px', maxHeight: '100px' }}
                rows={1}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || sending}
                className="w-9 h-9 rounded-full bg-accent hover:bg-[#d4c4a6] disabled:opacity-50 disabled:cursor-not-allowed text-background flex items-center justify-center transition-colors flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Desktop layout: Split view (threads list + conversation)
  return (
    <PageLayout>
      <div className="min-h-screen bg-background flex" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Threads Sidebar */}
        <div className="w-80 border-r border-border bg-surface/30 flex flex-col flex-shrink-0">
          {/* Header */}
          <div className="p-5 border-b border-border">
            <h2 className="text-text-primary mb-4" style={{ fontSize: '24px', fontWeight: 400, fontFamily: 'Playfair Display, serif' }}>
              Conversations
            </h2>
            <Link
              to="/dashboard"
              className="block w-full px-5 py-3.5 rounded-xl bg-accent hover:bg-[#d4c4a6] text-background transition-colors text-center font-medium flex items-center justify-center gap-2"
              style={{ fontSize: '14px' }}
            >
              <Plus className="w-4 h-4" />
              New Request
            </Link>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent/50 transition-colors"
                style={{ fontSize: '14px' }}
              />
            </div>
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto px-3 py-2">
            {filteredThreads.map((thread) => {
              const Icon = getTaskIcon(thread);
              const statusConfig = getStatusConfig(thread.status);
              const isActive = selectedThreadId === thread.id;

              return (
                <button
                  key={thread.id}
                  onClick={() => handleThreadSelect(thread.id)}
                  className={`w-full text-left p-4 rounded-xl transition-colors mb-1 ${
                    isActive
                      ? 'bg-surface border border-border-medium'
                      : 'hover:bg-surface/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      thread.assigned_agent === 'hotel' || (thread.title || '').toLowerCase().includes('hotel')
                        ? 'bg-accent/20'
                        : 'bg-surface-elevated'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        thread.assigned_agent === 'hotel' || (thread.title || '').toLowerCase().includes('hotel')
                          ? 'text-accent'
                          : 'text-text-tertiary'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`truncate flex-1 ${isActive ? 'text-accent' : 'text-text-primary'}`} style={{ fontSize: '14px', fontWeight: 500 }}>
                          {thread.title}
                        </h3>
                        <span className="text-text-tertiary text-xs whitespace-nowrap ml-2">
                          {formatTime(thread.last_message_at || thread.created_at)}
                        </span>
                      </div>
                      {thread.description && (
                        <p className="text-text-tertiary truncate mb-2" style={{ fontSize: '13px', fontWeight: 300 }}>
                          {thread.description.split('\n\nFollow-up:')[0]}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${statusConfig.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`}></span>
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conversation View */}
        <div className="flex-1 flex flex-col">
          {!taskId || !task ? (
            // Empty state
            <div className="flex-1 flex flex-col items-center justify-center p-12">
              <div className="w-20 h-20 bg-surface rounded-3xl flex items-center justify-center mb-6">
                <MessageSquare className="w-9 h-9 text-text-tertiary" />
              </div>
              <h3 className="text-text-primary mb-2" style={{ fontSize: '24px', fontWeight: 400, fontFamily: 'Playfair Display, serif' }}>
                Select a conversation
              </h3>
              <p className="text-text-tertiary text-center max-w-sm" style={{ fontSize: '14px', fontWeight: 300 }}>
                Choose a request from the list to view details and continue the conversation.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="border-b border-border p-5 bg-surface/30 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h1 className="text-text-primary mb-1" style={{ fontSize: '16px', fontWeight: 500 }}>
                      {task.title}
                    </h1>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${getStatusConfig(task.status).color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusConfig(task.status).dotColor}`}></span>
                        {getStatusConfig(task.status).label}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {task.status === 'awaiting_human' && (
                    <>
                      <button className="px-4 py-2 bg-surface border border-border rounded-lg text-text-secondary hover:bg-surface-elevated transition-colors text-sm">
                        Archive
                      </button>
                      <button className="px-4 py-2 bg-accent hover:bg-[#d4c4a6] text-background rounded-lg transition-colors text-sm font-medium">
                        Approve
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-7 py-7 space-y-4">
                <AnimatePresence>
                  {messages.map((message, index) => {
                    const prevMessage = index > 0 ? messages[index - 1] : null;
                    const showDateSeparator = prevMessage && 
                      new Date(message.created_at).toDateString() !== new Date(prevMessage.created_at).toDateString();

                    return (
                      <React.Fragment key={message.id}>
                        {showDateSeparator && (
                          <div className="flex items-center gap-4 my-4">
                            <div className="flex-1 h-px bg-border"></div>
                            <span className="text-text-tertiary text-xs">
                              {new Date(message.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                            </span>
                            <div className="flex-1 h-px bg-border"></div>
                          </div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                          {/* Avatar */}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            message.role === 'user'
                              ? 'bg-surface-elevated'
                              : message.role === 'human'
                              ? 'bg-green-500/20'
                              : 'bg-accent/20'
                          }`}>
                            {message.role === 'user' ? (
                              <UserIcon className="w-4 h-4 text-text-secondary" />
                            ) : message.role === 'human' ? (
                              <UserIcon className="w-4 h-4 text-green-400" />
                            ) : (
                              <MessageSquare className="w-4 h-4 text-accent" />
                            )}
                          </div>

                          {/* Message Content */}
                          <div className={`flex flex-col gap-1.5 max-w-[75%] ${message.role === 'user' ? 'items-end' : ''}`}>
                            <div className="flex items-center gap-2">
                              <span className="text-text-tertiary text-xs font-medium">
                                {message.role === 'user' ? 'You' : message.role === 'human' ? 'Pier Concierge' : 'Pier AI'}
                              </span>
                              <span className="text-text-tertiary text-xs">
                                {formatMessageTime(message.created_at)}
                              </span>
                            </div>
                            <div
                              className={`rounded-2xl px-4 py-3 ${
                                message.role === 'user'
                                  ? 'bg-accent text-background rounded-tr-sm'
                                  : message.role === 'human'
                                  ? 'bg-surface border border-green-500/20 rounded-tl-sm'
                                  : 'bg-surface border border-border rounded-tl-sm'
                              }`}
                              style={{ fontSize: '15px', fontWeight: 300, lineHeight: '1.6' }}
                            >
                              <p className="whitespace-pre-wrap">{message.content}</p>
                            </div>
                            {/* Show recommendations if present */}
                            {message.metadata?.recommendations && message.metadata.recommendations.length > 0 && (
                              <div className="mt-4 space-y-4">
                                {message.metadata.recommendations.map((rec: any, idx: number) => {
                                  // Transform to HotelRecommendation format
                                  const hotel: HotelRecommendation = {
                                    id: rec.id || rec.hotel_id,
                                    hotel_id: rec.hotel_id || rec.id,
                                    name: rec.name,
                                    location: rec.location || `${rec.neighborhood || ''}, ${rec.city || ''}`.trim(),
                                    city: rec.city || '',
                                    neighborhood: rec.neighborhood,
                                    rating: rec.star_rating || rec.rating,
                                    reviewCount: rec.review_count,
                                    averageRate: rec.rate_estimate ? `$${rec.rate_estimate.mid}` : (rec.rate_mid ? `$${rec.rate_mid}` : 'Rate on request'),
                                    imageUrl: rec.image_hero || rec.image_url || rec.image_hero_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
                                    image_hero: rec.image_hero || rec.image_url || rec.image_hero_url,
                                    pierBenefits: rec.pier_benefits || rec.pierBenefits || [],
                                    matchReasons: rec.reason ? [rec.reason] : ['Great option based on your preferences'],
                                    reason: rec.reason,
                                    description: rec.description || rec.notes_curated,
                                    amenities: rec.amenities || [],
                                    rate_estimate: rec.rate_estimate,
                                  };
                                  return (
                                    <HotelRecommendationCard
                                      key={rec.id || rec.hotel_id || idx}
                                      hotel={hotel}
                                      index={idx}
                                      onOpenConcierge={() => {
                                        // TODO: Open human concierge
                                        console.log('Open concierge for hotel:', hotel.id);
                                      }}
                                    />
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </React.Fragment>
                    );
                  })}
                </AnimatePresence>

                {/* Progress indicator if task is in progress */}
                {task && task.status !== 'completed' && task.ui_state?.progress && (
                  <div className="bg-surface border border-border rounded-xl p-4 my-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-text-secondary text-sm">{task.ui_state.status_message || 'Processing...'}</span>
                      <span className="text-accent text-sm font-medium">{task.ui_state.progress}%</span>
                    </div>
                    <div className="h-1 bg-surface-elevated rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent/60 to-accent rounded-full transition-all duration-300"
                        style={{ width: `${task.ui_state.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Recommendations are now shown inline with messages */}

              {/* Input */}
              <div className="border-t border-border p-5 bg-surface/30">
                <div className="flex items-end gap-3 bg-surface border border-border-medium rounded-2xl p-3 focus-within:border-accent/50 focus-within:shadow-lg transition-all">
                  <textarea
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={sending}
                    className="flex-1 bg-transparent border-none outline-none resize-none text-text-primary placeholder-text-tertiary"
                    style={{ fontSize: '14px', minHeight: '24px', maxHeight: '100px' }}
                    rows={1}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || sending}
                    className="w-9 h-9 rounded-full bg-accent hover:bg-[#d4c4a6] disabled:opacity-50 disabled:cursor-not-allowed text-background flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default ConversationPage;
