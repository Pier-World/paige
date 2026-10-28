import assert from 'node:assert/strict';
import test from 'node:test';
import { sortCapitalDealsForDealFlow } from './capitalDeals.ts';

test('Deal Flow sorts Closing Soon before Open, then Closed', () => {
  const sorted = sortCapitalDealsForDealFlow([
    { id: 'open-late', status: 'open' as const, closeDate: '2026-12-01' },
    { id: 'closed', status: 'closed' as const, closeDate: '2026-01-01' },
    { id: 'closing-late', status: 'closing' as const, closeDate: '2026-08-01' },
    { id: 'open-soon', status: 'open' as const, closeDate: '2026-06-01' },
    { id: 'closing-soon', status: 'closing' as const, closeDate: '2026-05-01' },
  ]);

  assert.deepEqual(
    sorted.map((deal) => deal.id),
    ['closing-soon', 'closing-late', 'open-soon', 'open-late', 'closed']
  );
});
