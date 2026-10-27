export type CapitalRole = 'gp' | 'lp';

/** How an individual represents that they are an accredited investor. */
export type AccreditationBasis = 'income' | 'net_worth' | 'license';

/** In-progress answers, including onboarding before they are saved. */
export interface AccreditationDraft {
  confirmed: boolean;
  basis: AccreditationBasis | null;
  qualifiedPurchaser: boolean | null;
  declined: boolean;
}

/** Saved self-attestation. A missing record means they have not verified. */
export interface AccreditationRecord {
  accredited: boolean;
  basis: AccreditationBasis | null;
  qualified_purchaser: boolean;
  attested_at: string;
}

export interface OnboardingData {
  capitalRole: CapitalRole | null;
  firm: string;
  title: string;
  city: string;
  intents: string[];
  allowIntroRequests: boolean;
  shareEventAttendance: boolean;
  accreditation: AccreditationDraft;
}
