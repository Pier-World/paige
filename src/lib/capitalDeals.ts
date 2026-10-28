export type DealFlowStatus = 'open' | 'closing' | 'closed' | 'pending';

const DEAL_FLOW_STATUS_RANK: Record<DealFlowStatus, number> = {
  closing: 0,
  open: 1,
  closed: 2,
  pending: 3,
};

function closeTime(closeDate: string | undefined): number {
  if (!closeDate) return Number.POSITIVE_INFINITY;
  const time = Date.parse(closeDate);
  return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
}

/** Deal Flow lists Closing Soon first, then Open, then Closed. */
export function sortCapitalDealsForDealFlow<T extends { status: DealFlowStatus; closeDate?: string }>(
  deals: T[]
): T[] {
  return [...deals].sort((a, b) => {
    const rank = DEAL_FLOW_STATUS_RANK[a.status] - DEAL_FLOW_STATUS_RANK[b.status];
    if (rank !== 0) return rank;
    return closeTime(a.closeDate) - closeTime(b.closeDate);
  });
}
