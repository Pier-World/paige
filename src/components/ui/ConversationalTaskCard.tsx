import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, User, Bot } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ConversationalTaskCardProps {
  taskId: string;
  initialQuestion?: string;
  questions?: Array<{ id: string; label: string; parameter: string }>;
  onAnswer?: (questionId: string, answer: string) => Promise<void>;
}

export const ConversationalTaskCard: React.FC<ConversationalTaskCardProps> = ({
  taskId,
  initialQuestion,
  questions = [],
  onAnswer,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [taskState, setTaskState] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Set up real-time subscription to task updates
  useEffect(() => {
    if (!taskId) return;

    // Fetch initial task state
    const loadTask = async () => {
      const { data: task } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();
      
      if (task) {
        setTaskState(task);
        
        const initialMessages: Message[] = [];
        
        // Add user's original request
        if (task.description) {
          // Extract just the first line (original request, not follow-ups)
          const originalRequest = task.description.split('\n\nFollow-up:')[0].trim();
          initialMessages.push({
            id: 'user-request',
            role: 'user',
            content: originalRequest,
            timestamp: new Date(task.created_at),
          });
        }
        
        // Add current question if clarifying
        if (task.ui_state?.needs_decision?.question) {
          initialMessages.push({
            id: 'q-current',
            role: 'assistant',
            content: task.ui_state.needs_decision.question,
            timestamp: new Date(),
          });
        } else if (initialQuestion) {
          initialMessages.push({
            id: 'q0',
            role: 'assistant',
            content: initialQuestion,
            timestamp: new Date(),
          });
        }
        
        if (initialMessages.length > 0) {
          setMessages(initialMessages);
        }
      }
    };
    
    loadTask();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`task-chat:${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `id=eq.${taskId}`,
        },
        (payload) => {
          const updatedTask = payload.new as any;
          setTaskState(updatedTask);
          
          // If new clarifying question appears, add it to messages
          if (updatedTask.ui_state?.needs_decision?.question) {
            const questionText = updatedTask.ui_state.needs_decision.question;
            // Check if we already have this question
            setMessages(prev => {
              const hasQuestion = prev.some(m => 
                m.role === 'assistant' && m.content === questionText
              );
              
              if (!hasQuestion) {
                return [...prev, {
                  id: `q-${Date.now()}`,
                  role: 'assistant',
                  content: questionText,
                  timestamp: new Date(),
                }];
              }
              return prev;
            });
          }
          
          // If results are ready, show them
          if (updatedTask.ui_state?.rendered_component === 'FlightComparisonGrid') {
            setMessages(prev => {
              const hasResults = prev.some(m => m.id.startsWith('results-'));
              if (!hasResults) {
                return [...prev, {
                  id: `results-${Date.now()}`,
                  role: 'assistant',
                  content: `I found ${updatedTask.output_data?.flights?.length || 0} flight options for you. Check the results below.`,
                  timestamp: new Date(),
                }];
              }
              return prev;
            });
          }
          
          // If task is completed, show completion message
          if (updatedTask.status === 'completed' && updatedTask.ui_state?.rendered_component) {
            setMessages(prev => {
              const hasCompletion = prev.some(m => m.id.startsWith('completed-'));
              if (!hasCompletion) {
                return [...prev, {
                  id: `completed-${Date.now()}`,
                  role: 'assistant',
                  content: 'Perfect! I\'ve found the best options for you.',
                  timestamp: new Date(),
                }];
              }
              return prev;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId, initialQuestion]);

  // Auto-scroll to bottom when new messages arrive (only within the card, not page scroll)
  useEffect(() => {
    if (messagesEndRef.current) {
      // Only scroll the messages container, not the entire page
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'nearest', // Don't scroll the page, just the container
        inline: 'nearest'
      });
    }
  }, [messages]);

  // Focus input when new question appears (without causing page scroll)
  useEffect(() => {
    if (taskState?.ui_state?.needs_decision) {
      setTimeout(() => {
        if (inputRef.current) {
          // Focus without scrolling the page
          inputRef.current.focus({ preventScroll: true });
        }
      }, 300);
    }
  }, [taskState]);

  const handleSend = async () => {
    if (!currentInput.trim() || isProcessing) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: currentInput.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const answerText = currentInput.trim();
    setCurrentInput('');
    setIsProcessing(true);

    try {
      // Send to orchestrator with task ID
      const { callOrchestrator } = await import('../../lib/orchestrator');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await callOrchestrator(user.id, answerText, taskId);
      }
      
      // Show processing message - real-time update will show next question or results
      const processingMessage: Message = {
        id: `processing-${Date.now()}`,
        role: 'assistant',
        content: 'Got it! Processing...',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, processingMessage]);
      
    } catch (error) {
      console.error('Error processing answer:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I encountered an error. Let me try again...',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isClarifying = taskState?.status === 'awaiting_human' && 
                       taskState?.decision_strategy === 'clarify' && 
                       taskState?.ui_state?.needs_decision;

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Conversation Messages */}
      <div className="max-h-96 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-accent" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-accent text-background'
                    : 'bg-surface-elevated text-text-primary border border-border'
                }`}
              >
                <p className="text-sm" style={{ fontWeight: 300 }}>
                  {message.content}
                </p>
              </div>
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-accent" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isProcessing && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-accent" />
            </div>
            <div className="bg-surface-elevated border border-border rounded-lg px-4 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-accent" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Show if task is still clarifying */}
      {isClarifying && (
        <div className="border-t border-border p-4 bg-surface-elevated">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={taskState.ui_state.needs_decision.options?.[0]?.label || 'Type your answer...'}
              className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-text-primary placeholder:text-text-tertiary outline-none resize-none focus:border-accent transition-colors"
              style={{ fontSize: '14px', fontWeight: 300, minHeight: '40px', maxHeight: '120px' }}
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!currentInput.trim() || isProcessing}
              className="px-4 py-2 bg-accent hover:bg-[#d4c4a6] text-background rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
