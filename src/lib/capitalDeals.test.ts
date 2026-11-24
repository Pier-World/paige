import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { sortCapitalDealsForDealFlow } from './capitalDeals.ts';
import { LOCKED_DEAL_TERMS, termHintsFromPreviewFlags } from './dealPreview.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

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

test('Deal Flow introduces exclusive Vestera access before opportunities', () => {
  const src = readFileSync(join(root, 'src/pages/capital-markets/DealsPage.tsx'), 'utf8');
  assert.match(src, /Exclusive access to Vestera Capital Partners deals/);
});

test('Standard previews keep performance and terms off the client', () => {
  assert.equal(LOCKED_DEAL_TERMS.targetIrr, 0);
  assert.equal(LOCKED_DEAL_TERMS.minCommitment, 0);
  assert.equal(LOCKED_DEAL_TERMS.targetSize, 0);
  assert.equal(LOCKED_DEAL_TERMS.returnDisplay, '');
  assert.equal(LOCKED_DEAL_TERMS.closeDate, '');
  assert.equal(LOCKED_DEAL_TERMS.termsLocked, true);

  const hints = termHintsFromPreviewFlags({
    has_target: true,
    has_min_commitment: false,
    has_return: true,
    has_close_date: true,
    has_progress: false,
    has_holding_period: false,
    has_liquidity: false,
    has_vintage: false,
    has_moic: true,
  });
  assert.equal(hints.target, true);
  assert.equal(hints.minCommitment, false);
  assert.equal(hints.return, true);
  assert.equal(hints.moic, true);
});

test('published deal preview SQL does not return performance or terms', () => {
  const sql = readFileSync(
    join(root, 'supabase/migrations/20261124201545_standard_member_deal_previews.sql'),
    'utf8'
  );
  const returns = sql.slice(sql.indexOf('RETURNS TABLE'), sql.indexOf('LANGUAGE sql'));
  for (const column of [
    'target_irr',
    'moic_target',
    'return_display',
    'min_commitment',
    'target_size',
    'raised_size',
    'contacts',
    'internal_notes',
    'close_date',
    'holding_period_years',
    'liquidity_note',
  ]) {
    assert.equal(new RegExp(`\\b${column}\\b`).test(returns), false, column);
  }
  assert.match(returns, /has_return boolean/);
  assert.match(sql, /published_at IS NOT NULL/);
  assert.match(sql, /auth\.uid\(\)/);
  assert.match(sql, /SECURITY DEFINER/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public.published_capital_deal_previews\(uuid, text\) TO authenticated/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public.published_capital_deal_previews\(uuid, text\) FROM anon/);
});
