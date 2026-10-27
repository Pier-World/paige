import { Lock, X } from 'lucide-react';
import { useIntercom } from '../../hooks/useIntercom';
import { cn } from '../../lib/utils';

export const PIER_PLUS_CHECKOUT_URL = 'https://buy.stripe.com/7sY14p6Ep0vFdShfvZ1wY05';

type UpgradePromptProps = {
  open?: boolean;
  onClose?: () => void;
  variant?: 'modal' | 'page' | 'inline';
  title?: string;
  description?: string;
  className?: string;
};

export function UpgradePrompt({
  open = true,
  onClose,
  variant = 'modal',
  title = 'Pier+ members only',
  description = 'Deal Flow and the member directory are included with Pier+.',
  className,
}: UpgradePromptProps) {
  const { show, showNewMessage, trackEvent } = useIntercom();

  if (!open) return null;

  function logCta(channel: 'stripe' | 'intercom') {
    try {
      trackEvent('upgrade_request_click', { channel, copy: 'Join Pier+' });
    } catch {
      // Intercom may not be booted (logged-out welcome, etc.)
    }
  }

  function requestViaIntercom() {
    logCta('intercom');
    show();
    showNewMessage('I would like to request a Pier+ upgrade.');
    onClose?.();
  }

  const actions = (
    <div className="mt-6 flex flex-col gap-2 sm:flex-row">
      <a
        href={PIER_PLUS_CHECKOUT_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => logCta('stripe')}
        className="flex h-9 flex-1 items-center justify-center rounded-[6px] border border-ink bg-ink text-[12px] text-parchment hover:bg-ink/90"
      >
        Join Pier+
      </a>
      <button
        type="button"
        onClick={requestViaIntercom}
        className="flex h-9 flex-1 items-center justify-center rounded-[6px] border border-border bg-parchment text-[12px] text-ink hover:border-ink/30"
      >
        Message the team
      </button>
    </div>
  );

  const body = (
    <div className={cn('rounded-[6px] border border-border bg-surface', className)}>
      <div className="p-6 sm:p-8">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gilt/30 bg-gilt/10">
              <Lock className="h-4 w-4 text-gilt" />
            </div>
            <div>
              <p className="eyebrow mb-2">Pier+</p>
              <h2 id="upgrade-prompt-title" className="font-display text-[28px] leading-none tracking-[-0.02em] text-ink">
                {title}
              </h2>
            </div>
          </div>
          {onClose && variant === 'modal' ? (
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-slate hover:border-ink/30 hover:text-ink"
              aria-label="Close upgrade prompt"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <p className="text-[14px] leading-relaxed text-slate">{description}</p>
        {actions}
      </div>
    </div>
  );

  if (variant === 'inline') {
    return body;
  }

  if (variant === 'page') {
    return (
      <div className="page-frame">
        <div className="mx-auto max-w-xl">{body}</div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-ink/70 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-prompt-title"
        className="mx-auto w-full max-w-lg overflow-hidden shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {body}
      </div>
    </div>
  );
}

export function BlurredUpgradeTeaser({ label }: { label: string }) {
  return (
    <UpgradePrompt
      variant="inline"
      title={label}
      description="Names, terms, contacts, and documents stay with Pier+. Events and Partners remain available on Standard."
    />
  );
}
