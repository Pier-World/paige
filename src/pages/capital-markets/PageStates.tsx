export function LoadingState({ label = 'Loading capital markets data...' }: { label?: string }) {
  return (
    <div className="rounded-[4px] border border-border bg-surface p-6 text-[14px] text-slate">
      {label}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-[4px] border border-danger/20 bg-danger/[0.04] p-6">
      <p className="eyebrow mb-2 text-danger">Supabase error</p>
      <p className="text-[14px] text-danger">{message}</p>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[4px] border border-border bg-surface p-6">
      <p className="font-medium text-ink">{title}</p>
      <p className="mt-1 text-[13px] text-slate">{description}</p>
    </div>
  );
}
