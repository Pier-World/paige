import type { UserPreferences } from '../types';
import type {
  AccreditationBasis,
  AccreditationDraft,
  AccreditationRecord,
} from '../types/onboarding';

export const ACCREDITATION_BASES: {
  id: AccreditationBasis;
  label: string;
  description: string;
}[] = [
  {
    id: 'income',
    label: 'Salary',
    description:
      'Income of at least $200,000 individually, or $300,000 with a spouse or spousal equivalent, in each of the last two years, with the same expected this year.',
  },
  {
    id: 'net_worth',
    label: 'Net worth',
    description:
      'Net worth over $1 million, alone or with a spouse or spousal equivalent, excluding your primary residence.',
  },
  {
    id: 'license',
    label: 'RIA license',
    description:
      'A Series 65 license in good standing. A Series 7 or Series 82 license qualifies the same way.',
  },
];

export const QUALIFIED_PURCHASER_DESCRIPTION =
  'At least $5 million in investments, not counting your primary residence.';

export function answerAccredited(draft: AccreditationDraft, accredited: boolean): AccreditationDraft {
  if (!accredited) {
    return { confirmed: false, declined: true, basis: null, qualifiedPurchaser: null };
  }
  if (draft.confirmed && !draft.declined) return draft;
  return { confirmed: true, declined: false, basis: null, qualifiedPurchaser: null };
}

export function answerBasis(draft: AccreditationDraft, basis: AccreditationBasis): AccreditationDraft {
  return {
    confirmed: true,
    declined: false,
    basis,
    qualifiedPurchaser: draft.declined ? null : draft.qualifiedPurchaser,
  };
}

/** Does not change whether they said they are accredited. */
export function answerQualifiedPurchaser(
  draft: AccreditationDraft,
  qualifiedPurchaser: boolean
): AccreditationDraft {
  return { ...draft, qualifiedPurchaser };
}

export function emptyAccreditationDraft(): AccreditationDraft {
  return {
    confirmed: false,
    basis: null,
    qualifiedPurchaser: null,
    declined: false,
  };
}

export function isAccreditationBasis(value: unknown): value is AccreditationBasis {
  return value === 'income' || value === 'net_worth' || value === 'license';
}

export function isAccreditationDraftComplete(draft: AccreditationDraft): boolean {
  if (draft.declined) return true;
  return draft.confirmed && draft.basis !== null && draft.qualifiedPurchaser !== null;
}

export function parseAccreditationDraft(raw: unknown): AccreditationDraft {
  const empty = emptyAccreditationDraft();
  if (!raw || typeof raw !== 'object') return empty;
  const value = raw as Partial<AccreditationDraft>;
  const declined = value.declined === true;
  const basis = isAccreditationBasis(value.basis) ? value.basis : null;
  const confirmed = !declined && value.confirmed === true;
  return {
    confirmed,
    basis: confirmed ? basis : null,
    qualifiedPurchaser:
      confirmed && (value.qualifiedPurchaser === true || value.qualifiedPurchaser === false)
        ? value.qualifiedPurchaser
        : null,
    declined,
  };
}

export function readAccreditation(prefs?: UserPreferences | null): AccreditationRecord | null {
  const raw = prefs?.accreditation;
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.attested_at !== 'string' || !raw.attested_at.trim()) return null;
  if (raw.accredited === true && isAccreditationBasis(raw.basis)) {
    return {
      accredited: true,
      basis: raw.basis,
      qualified_purchaser: raw.qualified_purchaser === true,
      attested_at: raw.attested_at,
    };
  }
  if (raw.accredited === false) {
    return {
      accredited: false,
      basis: null,
      qualified_purchaser: false,
      attested_at: raw.attested_at,
    };
  }
  return null;
}

export function draftFromAccreditation(record: AccreditationRecord | null): AccreditationDraft {
  if (!record) return emptyAccreditationDraft();
  if (!record.accredited) {
    return {
      confirmed: false,
      basis: null,
      qualifiedPurchaser: null,
      declined: true,
    };
  }
  return {
    confirmed: true,
    basis: record.basis,
    qualifiedPurchaser: record.qualified_purchaser,
    declined: false,
  };
}

export function accreditationBasisLabel(basis: AccreditationBasis | null): string {
  return ACCREDITATION_BASES.find((option) => option.id === basis)?.label ?? '';
}

/** Preferences patch for a completed attestation. Incomplete drafts return null. */
export function accreditationPreferences(
  draft: AccreditationDraft,
  attestedAt = new Date().toISOString()
): Pick<UserPreferences, 'accredited_investor' | 'accreditation'> | null {
  if (!isAccreditationDraftComplete(draft)) return null;
  if (draft.declined) {
    return {
      accredited_investor: 'No',
      accreditation: {
        accredited: false,
        basis: null,
        qualified_purchaser: false,
        attested_at: attestedAt,
      },
    };
  }
  return {
    accredited_investor: 'Yes',
    accreditation: {
      accredited: true,
      basis: draft.basis,
      qualified_purchaser: draft.qualifiedPurchaser === true,
      attested_at: attestedAt,
    },
  };
}
