import { useEffect, useState } from 'react';
import { Building2, Check, MapPin, Search, TrendingUp } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { getCapitalMembers, type CapitalMember } from '../../lib/api/capitalMarkets';
import { EmptyState, ErrorState, LoadingState } from './PageStates';

function MemberCard({ member }: { member: CapitalMember }) {
  return (
    <div className="group flex items-start justify-between gap-4 rounded-[4px] border border-border bg-surface p-5 transition-colors hover:border-ink/30">
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-midnight text-[14px] font-medium text-parchment">
          {member.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-ink">{member.name}</p>
            {member.verified ? (
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gilt text-ink">
                <Check className="h-2.5 w-2.5 stroke-[2]" />
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-[13px] text-slate">
            {member.title} / {member.firm}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-[12px] text-slate">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {member.location}
            </span>
            <span className="flex items-center gap-1">
              {member.role === 'gp' ? <TrendingUp className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
              {member.aum}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {member.focusSectors.map((sector) => (
              <span key={sector} className="rounded-[2px] bg-border/60 px-1.5 py-0.5 text-[11px] text-slate">
                {sector}
              </span>
            ))}
          </div>
        </div>
      </div>
      <Badge variant={member.role === 'gp' ? 'default' : 'muted'}>{member.role.toUpperCase()}</Badge>
    </div>
  );
}

export default function MembersPage() {
  const [members, setMembers] = useState<CapitalMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadMembers() {
      setLoading(true);
      setError(null);

      try {
        const data = await getCapitalMembers();
        if (!ignore) setMembers(data);
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : 'Unable to load capital member profiles.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadMembers();

    return () => {
      ignore = true;
    };
  }, []);

  const gps = members.filter((member) => member.role === 'gp');
  const lps = members.filter((member) => member.role === 'lp');
  const locationCount = new Set(members.map((member) => member.location).filter(Boolean)).size;

  return (
    <div className="px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow mb-2">06 / Members</p>
          <h1 className="font-display text-[40px] leading-[0.95] tracking-[-0.02em] text-ink">
            The network.
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] text-slate">
            Verified GPs and allocators. Matched introductions through Pier Concierge only.
          </p>
          <div className="gilt-rule mt-6 w-12" />
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 stroke-[1.25] text-slate" />
          <input
            type="text"
            placeholder="Search members..."
            className="w-full rounded-[6px] border border-border bg-surface py-2.5 pl-9 pr-4 text-[14px] text-ink placeholder:text-slate focus:border-ink focus:outline-none"
          />
        </div>
      </div>

      {loading ? <LoadingState label="Loading member profiles from Supabase..." /> : null}
      {error ? <ErrorState message={error} /> : null}

      {!loading && !error ? (
        <>
      <div className="mb-8 grid grid-cols-2 gap-6 md:flex">
        {[
          { label: 'Total Members', value: members.length },
          { label: 'General Partners', value: gps.length },
          { label: 'Limited Partners', value: lps.length },
          { label: 'Locations', value: locationCount },
        ].map((stat) => (
          <div key={stat.label}>
            <p className="font-mono-data text-[24px] font-medium text-ink">{stat.value}</p>
            <p className="eyebrow mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <section className="mb-10">
        <p className="eyebrow mb-5">General Partners</p>
        {gps.length === 0 ? (
          <EmptyState title="No GP profiles yet." description="Active GP member profiles from Supabase will appear here." />
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {gps.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        )}
      </section>

      <section>
        <p className="eyebrow mb-5">Limited Partners</p>
        {lps.length === 0 ? (
          <EmptyState title="No LP profiles yet." description="Active LP member profiles from Supabase will appear here." />
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {lps.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        )}
      </section>
        </>
      ) : null}

      <p className="mt-10 max-w-2xl text-[12px] leading-relaxed text-slate">
        Member contact information and introductions are available exclusively through Pier Concierge.
        Direct outreach to members is not permitted.
      </p>
    </div>
  );
}
