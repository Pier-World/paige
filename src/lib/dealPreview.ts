export type DealTermHints = {
  target: boolean;
  minCommitment: boolean;
  return: boolean;
  closeDate: boolean;
  progress: boolean;
  holdingPeriod: boolean;
  liquidity: boolean;
  vintage: boolean;
  moic: boolean;
};

export type CapitalDealPreviewFlags = {
  has_target: boolean;
  has_min_commitment: boolean;
  has_return: boolean;
  has_close_date: boolean;
  has_progress: boolean;
  has_holding_period: boolean;
  has_liquidity: boolean;
  has_vintage: boolean;
  has_moic: boolean;
};

export function termHintsFromPreviewFlags(flags: CapitalDealPreviewFlags): DealTermHints {
  return {
    target: flags.has_target,
    minCommitment: flags.has_min_commitment,
    return: flags.has_return,
    closeDate: flags.has_close_date,
    progress: flags.has_progress,
    holdingPeriod: flags.has_holding_period,
    liquidity: flags.has_liquidity,
    vintage: flags.has_vintage,
    moic: flags.has_moic,
  };
}

/** Financial fields a Standard preview is allowed to hold. Always empty. */
export const LOCKED_DEAL_TERMS = {
  targetSize: 0,
  raisedSize: 0,
  allocationSubscribedPercent: 0,
  minCommitment: 0,
  targetIrr: 0,
  moicTarget: 0,
  returnMetricType: 'none' as const,
  returnDisplay: '',
  holdingPeriodYears: null,
  liquidityNote: '',
  closeDate: '',
  vintage: 0,
  termsLocked: true as const,
};
