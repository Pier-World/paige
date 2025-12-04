import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle2, AlertCircle, User, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { FlightComparisonGrid } from './FlightComparisonGrid';
import { ConversationalTaskCard } from './ConversationalTaskCard';
import { HotelRecommendationsList, type HotelRecommendation } from '../features/HotelRecommendationCard';

interface TaskUIState {
  current_step?: string;
  progress?: number;
  results_preview?: any;
  needs_decision?: {
    question: string;
    options: Array<{ id: string; label: string; preview: any }>;
  };
  rendered_component?: 'FlightComparisonGrid' | 'HotelRecommendations' | 'BookingConfirmation' | 'CalendarPicker' | 'DefaultTaskCard';
  search_params?: any;
  assumptions?: string[];
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'awaiting_human' | 'completed' | 'failed';
  task_type?: string;
  assigned_agent?: string;
  requires_human?: boolean;
  created_at: string;
  due_date?: string;
  priority?: number;
  ui_state?: TaskUIState;
  confidence_score?: number;
  risk_level?: 'low' | 'medium' | 'high';
  decision_strategy?: 'auto_execute' | 'preview_confirm' | 'clarify' | 'escalate';
  output_data?: any;
  input_data?: any;
}

interface EnhancedTaskCardProps {
  taskId: string;
  variant?: 'compact' | 'detailed';
  onUpdate?: (task: Task) => void;
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-accent/10 text-accent border border-accent/20', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-accent/10 text-accent border border-accent/20', icon: Clock },
  awaiting_human: { label: 'Needs Review', color: 'bg-accent/10 text-accent border border-accent/20', icon: AlertCircle },
  completed: { label: 'Completed', color: 'bg-accent/10 text-accent border border-accent/20', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'bg-red-500/10 text-red-400 border border-red-500/20', icon: AlertCircle },
};

export const EnhancedTaskCard: React.FC<EnhancedTaskCardProps> = ({ 
  taskId, 
  variant = 'detailed',
  onUpdate 
}) => {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch initial task
  useEffect(() => {
    fetchTask();
  }, [taskId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!taskId) return;

    const channel = supabase
      .channel(`task:${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `id=eq.${taskId}`,
        },
        (payload) => {
          console.log('Task updated via real-time:', payload.new);
          setTask(payload.new as Task);
          if (onUpdate) {
            onUpdate(payload.new as Task);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Real-time subscription active for task:', taskId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Real-time subscription error for task:', taskId);
        }
      });

    return () => {
      console.log('Cleaning up real-time subscription for task:', taskId);
      supabase.removeChannel(channel);
    };
  }, [taskId, onUpdate]);

  const fetchTask = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) {
        console.error('Error fetching task:', error);
        // Log more details for debugging
        console.error('Task ID:', taskId);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        throw error;
      }
      
      if (data) {
        setTask(data as Task);
      } else {
        console.warn('Task not found:', taskId);
      }
    } catch (error) {
      console.error('Error fetching task:', error);
      // Don't set task to null immediately - might be RLS issue
      // The error will be caught and "Task not found" will show
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-accent" />
          <span className="text-text-secondary">Loading task...</span>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="text-text-secondary">Task not found</div>
      </div>
    );
  }

  const StatusIcon = statusConfig[task.status]?.icon || Clock;
  const statusLabel = statusConfig[task.status]?.label || task.status;
  const statusColor = statusConfig[task.status]?.color || 'bg-gray-100 text-gray-800';
  const progress = task.ui_state?.progress || 0;
  const currentStep = task.ui_state?.current_step || '';

  // Render component based on ui_state.rendered_component
  const renderComponent = () => {
    const component = task.ui_state?.rendered_component;
    const outputData = task.output_data;

    switch (component) {
      case 'FlightComparisonGrid':
        return (
          <FlightComparisonGrid
            flights={outputData?.flights || task.ui_state?.results_preview || []}
            searchParams={task.ui_state?.search_params}
            recommendation={outputData?.recommendation}
          />
        );
      case 'HotelRecommendations':
        const hotels = outputData?.hotels || task.ui_state?.results_preview || [];
        return (
          <div className="mt-4">
            <HotelRecommendationsList
              recommendations={hotels}
              selectedHotelId={outputData?.selected_hotel_id}
              onSelectHotel={async (hotelId) => {
                // Update task with selected hotel
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  await supabase
                    .from('tasks')
                    .update({
                      output_data: {
                        ...outputData,
                        selected_hotel_id: hotelId,
                      },
                    })
                    .eq('id', taskId);
                }
              }}
              filterStats={outputData?.filter_stats}
            />
          </div>
        );
      case 'BookingConfirmation':
        return (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Booking Confirmed</span>
            </div>
            <pre className="mt-2 text-xs text-green-700">
              {JSON.stringify(outputData, null, 2)}
            </pre>
          </div>
        );
      default:
        // If output_data has hotels but no rendered_component, show hotel recommendations
        if (outputData?.hotels && Array.isArray(outputData.hotels) && outputData.hotels.length > 0) {
          return (
            <div className="mt-4">
              <HotelRecommendationsList
                recommendations={outputData.hotels}
                selectedHotelId={outputData?.selected_hotel_id}
                onSelectHotel={async (hotelId) => {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user) {
                    await supabase
                      .from('tasks')
                      .update({
                        output_data: {
                          ...outputData,
                          selected_hotel_id: hotelId,
                        },
                      })
                      .eq('id', taskId);
                  }
                }}
                filterStats={outputData?.filter_stats}
              />
            </div>
          );
        }
        return null;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  if (variant === 'compact') {
    return (
      <div className="bg-surface border border-border rounded-xl p-4 hover:border-[#3a3a3a] transition-all">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-text-primary truncate">
              {task.title}
            </h4>
            {task.description && (
              <p className="text-xs text-text-tertiary mt-1 line-clamp-1">
                {task.description}
              </p>
            )}
            {progress > 0 && (
              <div className="mt-2 w-full bg-neutral-800 rounded-full h-1.5">
                <div
                  className="bg-accent h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${statusColor} flex items-center gap-1`}>
            <StatusIcon className="w-3 h-3" />
            {statusLabel}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5 hover:border-[#3a3a3a] transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-text-primary" style={{ fontSize: '16px', fontWeight: 400 }}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-text-secondary mt-1" style={{ fontSize: '13px', fontWeight: 300 }}>
              {task.description}
            </p>
          )}
        </div>
        <span className={`ml-4 px-3 py-1 rounded-full text-xs font-medium ${statusColor} flex items-center gap-1`}>
          <StatusIcon className="w-3 h-3" />
          {statusLabel}
        </span>
      </div>

      {/* Progress Bar */}
      {progress > 0 && progress < 100 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-text-secondary">{currentStep}</span>
            <span className="text-xs text-text-secondary">{progress}%</span>
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-2">
            <div
              className="bg-accent h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Assumptions */}
      {task.ui_state?.assumptions && task.ui_state.assumptions.length > 0 && (
        <div className="mb-3 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium text-blue-400 mb-1">Assumptions:</p>
              <ul className="text-xs text-blue-300 space-y-0.5">
                {task.ui_state.assumptions.map((assumption, idx) => (
                  <li key={idx}>• {assumption}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Decision Strategy Badge */}
      {task.decision_strategy && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-neutral-800 text-text-secondary">
            Strategy: {task.decision_strategy.replace('_', ' ')}
            {task.confidence_score && (
              <span className="ml-1 text-accent">
                ({Math.round(task.confidence_score * 100)}% confidence)
              </span>
            )}
          </span>
        </div>
      )}

      {/* Needs Decision - Show as conversational interface for clarify strategy */}
      {task.ui_state?.needs_decision && task.decision_strategy === 'clarify' && (
        <div className="mb-3">
          <ConversationalTaskCard
            taskId={task.id}
            initialQuestion={task.ui_state.needs_decision.question}
            questions={task.ui_state.needs_decision.options.map((opt, idx) => ({
              id: opt.id,
              label: opt.label,
              parameter: opt.id,
            }))}
            onAnswer={async (questionId, answer) => {
              // Send answer to orchestrator to continue the conversation
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const { callOrchestrator } = await import('../../lib/orchestrator');
                await callOrchestrator(user.id, answer, task.id);
              }
            }}
          />
        </div>
      )}

      {/* Other decision types (preview_confirm, escalate) - show as buttons */}
      {task.ui_state?.needs_decision && task.decision_strategy !== 'clarify' && (
        <div className="mb-3 p-4 bg-accent/10 border border-accent/20 rounded-lg">
          <p className="text-sm font-medium text-accent mb-3">
            {task.ui_state.needs_decision.question}
          </p>
          <div className="space-y-2">
            {task.ui_state.needs_decision.options.map((option) => (
              <button
                key={option.id}
                className="w-full text-left px-3 py-2 bg-surface border border-border rounded-lg hover:border-accent transition-colors"
              >
                <span className="text-sm text-text-primary">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rendered Component */}
      {renderComponent()}

      {/* Metadata */}
      <div className="flex items-center gap-4 mt-3 text-text-secondary" style={{ fontSize: '12px', fontWeight: 300 }}>
        {task.assigned_agent && (
          <div className="flex items-center gap-1.5">
            <User className="w-3 h-3" />
            <span className="capitalize">{task.assigned_agent}</span>
          </div>
        )}
        {task.due_date && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span>Due {formatDate(task.due_date)}</span>
          </div>
        )}
        <span>{timeAgo(task.created_at)}</span>
      </div>

      {task.requires_human && (
        <div className="mt-3 px-3 py-2 bg-accent/10 border border-accent/20 rounded-lg">
          <div className="flex items-center gap-2 text-accent">
            <AlertCircle className="w-4 h-4" />
            <span style={{ fontSize: '12px', fontWeight: 400 }}>Needs Review</span>
          </div>
        </div>
      )}
    </div>
  );
};

