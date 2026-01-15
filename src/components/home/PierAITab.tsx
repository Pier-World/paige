import { useEffect, useState } from 'react';
import { useIntercom } from '../../hooks/useIntercom';
import { supabase } from '../../lib/supabase';
import { Sparkles, ArrowRight, CheckCircle, Clock } from 'lucide-react';

const QUICK_START_PROMPTS = [
  'Find me flights to Tokyo under $800',
  'Book a table for 4 at a Michelin-starred restaurant in SF',
  'Reschedule my meeting with Alex to next week',
  'What perks can I use for my upcoming trip?',
  'Find hotels in Austin for next month',
  'Help me optimize my credit card benefits',
];

interface Request {
  id: string;
  raw_text: string;
  status: string;
  created_at: string;
  intent?: string;
}

export function PierAITab() {
  const { show, showMessages, showNewMessage } = useIntercom();
  const [recentRequests, setRecentRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auto-open Intercom when this tab becomes active
    const timer = setTimeout(() => {
      show();
      showMessages();
    }, 500);
    
    // Load recent requests
    loadRecentRequests();

    return () => clearTimeout(timer);
  }, [show, showMessages]);

  const loadRecentRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('requests')
        .select('id, raw_text, status, created_at, intent')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) {
        setRecentRequests(data);
      }
    } catch (error) {
      console.error('Failed to load recent requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePromptClick = (prompt: string) => {
    showNewMessage(prompt);
  };

  const handleRequestClick = (request: Request) => {
    // Open Intercom and reference this request
    showNewMessage(`Regarding my request: ${request.raw_text}`);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
      case 'booked':
        return {
          label: 'Completed',
          color: 'bg-green-500/10 text-green-400 border-green-500/20',
          icon: CheckCircle,
        };
      case 'new':
      case 'collecting':
        return {
          label: 'Needs Review',
          color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
          icon: Clock,
        };
      default:
        return {
          label: 'In Progress',
          color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          icon: Clock,
        };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#c9b896]/10 border border-[#c9b896]/20 rounded-full">
          <Sparkles className="w-4 h-4 text-[#c9b896]" />
          <span className="text-sm text-[#c9b896]">AI-Powered Concierge</span>
        </div>
        
        <div>
          <h2 className="text-3xl mb-3">I'm here to help—what do you need?</h2>
          <p className="text-lg text-[#a0a0a0]">
            Ask for anything—I'll handle it instantly or connect you to our team
          </p>
        </div>
      </div>

      {/* CTA to messenger */}
      <div className="p-6 bg-[#c9b896]/5 border border-[#c9b896]/20 rounded-2xl text-center">
        <p className="text-[#e8e8e8] mb-4">
          💬 <strong>Click the messenger in the bottom-right corner</strong> to start chatting
        </p>
        <button
          onClick={() => show()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#c9b896] text-[#0a0a0a] rounded-full hover:bg-[#d4c5a8] transition-colors font-medium"
        >
          <span>Open Messenger</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Quick starts */}
      <div>
        <h3 className="text-lg mb-4">Quick starts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {QUICK_START_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handlePromptClick(prompt)}
              className="group p-4 bg-[#141414] border border-[#2a2a2a] rounded-xl text-left hover:border-[#c9b896] hover:bg-[#c9b896]/5 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-[#e8e8e8] group-hover:text-[#c9b896] transition-colors">
                  {prompt}
                </p>
                <ArrowRight className="w-4 h-4 text-[#a0a0a0] group-hover:text-[#c9b896] group-hover:translate-x-1 transition-all flex-shrink-0 mt-0.5" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent requests */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg">Recent Requests</h3>
          <button
            onClick={() => {
              // Navigate to requests page or open all in messenger
              showMessages();
            }}
            className="text-sm text-[#c9b896] hover:text-[#d4c5a8] flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-[#a0a0a0]">
            Loading recent requests...
          </div>
        ) : recentRequests.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#a0a0a0] mb-4">No recent requests yet</p>
            <button
              onClick={() => showNewMessage()}
              className="text-sm text-[#c9b896] hover:text-[#d4c5a8]"
            >
              Start your first conversation →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentRequests.map(request => {
              const statusConfig = getStatusConfig(request.status);
              const StatusIcon = statusConfig.icon;

              return (
                <button
                  key={request.id}
                  onClick={() => handleRequestClick(request)}
                  className="w-full p-4 bg-[#141414] border border-[#2a2a2a] rounded-xl text-left hover:border-[#3a3a3a] transition-colors group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${statusConfig.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      <span className="text-xs font-medium">{statusConfig.label}</span>
                    </div>
                    <span className="text-xs text-[#a0a0a0]">
                      {new Date(request.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  
                  <p className="text-sm text-[#e8e8e8] mb-2 line-clamp-2">
                    {request.raw_text}
                  </p>
                  
                  {request.intent && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#a0a0a0] capitalize">
                        {request.intent.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-[#141414] border border-[#2a2a2a] rounded-xl">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#c9b896]/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-[#c9b896]" />
            </div>
            <div>
              <h4 className="text-base mb-2 text-[#e8e8e8]">Instant AI Responses</h4>
              <p className="text-sm text-[#a0a0a0]">
                Most requests are handled immediately by our AI agent trained on your preferences
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-[#141414] border border-[#2a2a2a] rounded-xl">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#c9b896]/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-[#c9b896]" />
            </div>
            <div>
              <h4 className="text-base mb-2 text-[#e8e8e8]">Human Support When Needed</h4>
              <p className="text-sm text-[#a0a0a0]">
                For complex requests, our concierge team takes over seamlessly
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

