import { Skeleton } from '../../components/ui/Skeleton';

function RowGhosts({ count }: { count: number }) {
  return (
    <div className="grid gap-6">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton shape="circle" className="h-11 w-11" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <Skeleton className="h-3.5 w-[38%] max-w-[220px]" />
            <Skeleton className="h-3 w-[55%] max-w-[320px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LoadingState({
  label = 'Loading',
  variant = 'list',
}: {
  label?: string;
  variant?: 'list' | 'cards' | 'rows' | 'dashboard' | 'detail' | 'profile';
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {variant === 'cards' ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton shape="block" className="h-36 w-full" />
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}
        </div>
      ) : null}
      {variant === 'rows' ? (
        <div className="grid gap-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="grid gap-6 rounded-[4px] border border-border bg-surface p-6 lg:grid-cols-[minmax(0,1fr)_240px]"
            >
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-2/3 max-w-md" />
                <Skeleton className="h-3.5 w-1/3 max-w-xs" />
                <Skeleton className="h-3 w-full max-w-xl" />
                <Skeleton className="h-3 w-4/5 max-w-lg" />
              </div>
              <div className="space-y-3 lg:border-l lg:border-border lg:pl-8">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {variant === 'list' ? <RowGhosts count={4} /> : null}
      {variant === 'dashboard' ? (
        <div className="grid gap-10 xl:grid-cols-[1fr_280px]">
          <RowGhosts count={3} />
          <div className="space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ) : null}
      {variant === 'detail' ? (
        <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-2/3 max-w-md" />
            <Skeleton className="h-3.5 w-1/2 max-w-xs" />
            <Skeleton shape="block" className="mt-4 h-24 w-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton shape="circle" className="h-10 w-full" />
          </div>
        </div>
      ) : null}
      {variant === 'profile' ? (
        <div className="grid gap-10 lg:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  retryLabel = 'Try again',
}: {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-4 rounded-pier-lg bg-ink/[0.03] px-5 py-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="text-[14px] font-medium text-ink">Couldn’t load this</p>
        <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-slate">{message}</p>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-9 shrink-0 items-center rounded-full bg-ink px-4 text-[13px] font-medium text-parchment transition-opacity hover:opacity-90"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-pier-lg bg-ink/[0.03] px-5 py-5">
      <p className="font-medium text-ink">{title}</p>
      <p className="mt-1 text-[13px] text-slate">{description}</p>
    </div>
  );
}
