import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock, MessageSquare, Send } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { CONCIERGE_QUICK_REQUESTS } from '../../lib/capitalMarkets/conciergeQuotes';
import { cn } from '../../lib/utils';

type ConciergeMessage = {
  id: string;
  sender: 'member' | 'concierge';
  body: string;
  timestamp: string;
};

const initialMessages: ConciergeMessage[] = [
  {
    id: '1',
    sender: 'concierge',
    body: 'Welcome to Pier Concierge. What can Pier help you with today?',
    timestamp: '2026-05-10T09:00:00',
  },
];

export default function ConciergePage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<ConciergeMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const memberInitial = user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'M';

  useEffect(() => {
    const partner = searchParams.get('partner');
    if (partner) {
      setInput(`I would like an introduction to ${partner.replace(/-/g, ' ')}.`);
    }
  }, [searchParams]);

  function handleSend() {
    if (!input.trim() || sending) return;

    const memberMessage: ConciergeMessage = {
      id: String(Date.now()),
      sender: 'member',
      body: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((current) => [...current, memberMessage]);
    setInput('');
    setSending(true);

    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: String(Date.now() + 1),
          sender: 'concierge',
          body: 'Thank you. The Pier team has your request and will follow up shortly.',
          timestamp: new Date().toISOString(),
        },
      ]);
      setSending(false);
    }, 900);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-5 sm:px-10">
        <div>
          <p className="eyebrow mb-1">05 / Concierge</p>
          <h1 className="font-display text-[30px] leading-none tracking-[-0.02em] text-ink">
            Your Pier Concierge
          </h1>
          <p className="mt-2 text-[14px] text-slate">
            For introductions, event access, partner requests, and travel support.
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-[4px] border border-ledger/20 bg-ledger/[0.06] px-3 py-1.5 sm:flex">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-ledger" />
          <span className="text-[13px] text-ink">Online</span>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-8 sm:px-10">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn('flex gap-3', message.sender === 'member' ? 'flex-row-reverse' : 'flex-row')}
          >
            <div
              className={cn(
                'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-medium',
                message.sender === 'concierge' ? 'bg-midnight text-gilt' : 'bg-ink text-parchment'
              )}
            >
              {message.sender === 'concierge' ? 'P' : memberInitial}
            </div>

            <div
              className={cn(
                'max-w-2xl rounded-[4px] border px-4 py-3 text-[14px] leading-relaxed',
                message.sender === 'concierge'
                  ? 'border-border bg-surface text-ink'
                  : 'border-ink bg-ink text-parchment'
              )}
            >
              {message.body}
              <p className={cn('mt-2 text-[11px]', message.sender === 'concierge' ? 'text-slate' : 'text-parchment/50')}>
                {new Date(message.timestamp).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}

        {sending ? (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-midnight text-[12px] font-medium text-gilt">
              P
            </div>
            <div className="flex items-center gap-2 rounded-[4px] border border-border bg-surface px-4 py-3 text-[13px] text-slate">
              <MessageSquare className="h-3.5 w-3.5" />
              Concierge is drafting a response
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-border px-6 py-4 sm:px-10">
        <p className="eyebrow mb-3">Quick requests</p>
        <div className="flex flex-wrap gap-2">
          {CONCIERGE_QUICK_REQUESTS.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => setInput(action)}
              className="rounded-[4px] border border-border bg-surface px-3 py-1.5 text-[13px] text-ink hover:border-ink/30"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border px-6 py-5 sm:px-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="relative flex-1">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              rows={3}
              placeholder="What can Pier help you with today?"
              className="block w-full resize-none rounded-[4px] border border-border bg-surface px-4 py-3 text-[14px] text-ink placeholder:text-slate focus:border-ink focus:outline-none"
            />
            <div className="pointer-events-none absolute bottom-3 right-3 hidden items-center gap-1.5 text-[11px] text-slate sm:flex">
              <Clock className="h-3 w-3" />
              Typically replies in minutes
            </div>
          </div>
          <Button onClick={handleSend} loading={sending} disabled={!input.trim()} className="self-end">
            Send
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
