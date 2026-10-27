import { BlurredUpgradeTeaser } from './UpgradePrompt';

const PLACEHOLDER_DEALS = [
  { name: 'Confidential fund', type: 'Fund', size: '$•• mm', ret: '••%' },
  { name: 'Confidential co-invest', type: 'Co-invest', size: '$•• mm', ret: '••%' },
  { name: 'Confidential SPV', type: 'SPV', size: '$•• mm', ret: '••%' },
  { name: 'Confidential secondary', type: 'Secondary', size: '$•• mm', ret: '••%' },
] as const;

function PlaceholderRows() {
  return (
    <div className="overflow-hidden rounded-[4px] border border-border bg-surface">
      {PLACEHOLDER_DEALS.map((deal) => (
        <div key={deal.name} className="border-b border-border px-4 py-3.5 last:border-0">
          <p className="font-medium text-ink">{deal.name}</p>
          <p className="mt-0.5 text-[12px] text-slate">{deal.type}</p>
          <div className="mt-2 flex items-center justify-between text-[12px] text-slate">
            <span>{deal.size}</span>
            <span>{deal.ret}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PlaceholderGrid() {
  return (
    <div className="px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
      <div className="mb-10">
        <p className="eyebrow mb-2">Deal Flow</p>
        <h1 className="font-display text-[40px] leading-[0.95] tracking-[-0.02em] text-ink">
          Curated opportunities.
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] text-slate">
          Selected fund access, co-investments, secondaries, and SPVs reviewed for Pier members.
        </p>
        <div className="gilt-rule mt-6 w-12" />
      </div>
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {['Total opportunities', 'Open now', 'Closing soon', 'Aggregate target'].map((label) => (
          <div key={label} className="rounded-[4px] border border-border bg-surface px-4 py-3">
            <p className="eyebrow mb-1">{label}</p>
            <p className="font-mono-data text-[20px] font-medium text-ink">••</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {PLACEHOLDER_DEALS.map((deal) => (
          <div key={deal.name} className="rounded-[4px] border border-border bg-surface p-6">
            <p className="text-[13px] text-slate">Manager withheld</p>
            <p className="mt-0.5 font-medium text-ink">{deal.name}</p>
            <p className="mt-4 text-[13px] text-slate">
              {deal.type} · {deal.size} · {deal.ret}
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-slate">
              Thesis, contacts, and materials are included with Pier+.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlaceholderDetail() {
  return (
    <div className="px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
      <p className="eyebrow mb-2">Deal Flow</p>
      <h1 className="font-display text-[40px] leading-[0.95] tracking-[-0.02em] text-ink">
        Confidential opportunity
      </h1>
      <p className="mt-4 max-w-2xl text-[15px] text-slate">
        Manager, terms, contacts, and documents stay with Pier+. Request an upgrade to review this
        opportunity.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {['Target', 'Min. commit', 'Return'].map((label) => (
          <div key={label} className="rounded-[4px] border border-border bg-surface px-4 py-3">
            <p className="eyebrow mb-1">{label}</p>
            <p className="font-mono-data text-[20px] font-medium text-ink">••</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnonymizedDealPreview({
  variant,
}: {
  variant: 'aside' | 'grid' | 'detail';
}) {
  if (variant === 'aside') {
    return (
      <section>
        <div className="mb-4">
          <p className="eyebrow">Deal Flow</p>
        </div>
        <BlurredUpgradeTeaser label="Opportunities are included with Pier+">
          <PlaceholderRows />
        </BlurredUpgradeTeaser>
      </section>
    );
  }

  return (
    <BlurredUpgradeTeaser
      label={
        variant === 'detail'
          ? 'Opportunity details are included with Pier+'
          : 'Deal Flow is included with Pier+'
      }
    >
      {variant === 'detail' ? <PlaceholderDetail /> : <PlaceholderGrid />}
    </BlurredUpgradeTeaser>
  );
}
