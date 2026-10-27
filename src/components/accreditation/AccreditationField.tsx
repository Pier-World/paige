import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  accreditationBasisLabel,
  accreditationPreferences,
  draftFromAccreditation,
  isAccreditationDraftComplete,
  readAccreditation,
} from '../../lib/accreditation';
import type { AccreditationDraft } from '../../types/onboarding';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { AccreditationForm } from './AccreditationForm';

function AccreditationDialog({
  initial,
  saving,
  error,
  onClose,
  onConfirm,
}: {
  initial: AccreditationDraft;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (draft: AccreditationDraft) => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const savingRef = useRef(saving);
  const [draft, setDraft] = useState(initial);
  const canConfirm = isAccreditationDraftComplete(draft);
  onCloseRef.current = onClose;
  savingRef.current = saving;

  useEffect(() => {
    panelRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !savingRef.current) onCloseRef.current();
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-ink/70 backdrop-blur-sm">
      <div
        className="flex min-h-full items-center justify-center px-4 py-8"
        onClick={() => {
          if (!saving) onClose();
        }}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="w-full max-w-lg rounded-pier-md border border-border bg-parchment p-6 shadow-2xl outline-none sm:p-8"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow mb-2">Accreditation</p>
              <h2
                id={titleId}
                className="font-display text-[28px] leading-none tracking-[-0.02em] text-ink"
              >
                Confirm your status
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-slate hover:border-ink/30 hover:text-ink disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <AccreditationForm value={draft} onChange={setDraft} />

          {error ? (
            <p className="mt-4 text-[13px] text-danger" role="alert">
              {error}
            </p>
          ) : !canConfirm && draft.confirmed && !draft.declined ? (
            <p className="mt-4 text-[12px] leading-relaxed text-slate">
              Select how you qualify, and whether you are a qualified purchaser.
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3 border-t border-border/60 pt-5">
            <Button type="button" loading={saving} disabled={!canConfirm} onClick={() => onConfirm(draft)}>
              Confirm
            </Button>
            <Button type="button" variant="secondary" disabled={saving} onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function AccreditationField({ className }: { className?: string }) {
  const { user, updateProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const openedFromOrientation = useRef(false);
  const [open, setOpen] = useState(() => searchParams.get('focus') === 'accreditation');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const record = readAccreditation(user?.preferences);

  useEffect(() => {
    if (openedFromOrientation.current) return;
    if (searchParams.get('focus') !== 'accreditation') return;
    openedFromOrientation.current = true;
    setOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete('focus');
    navigate(
      {
        pathname: location.pathname,
        search: next.toString(),
        hash: location.hash || '#accreditation',
      },
      { replace: true }
    );
  }, [location.hash, location.pathname, navigate, searchParams]);

  async function confirm(draft: AccreditationDraft) {
    if (!user) return;
    const patch = accreditationPreferences(draft);
    if (!patch) {
      setError('Confirm how you qualify, including whether you are a qualified purchaser.');
      return;
    }
    setSaving(true);
    setError(null);
    const { error: profileError } = await updateProfile({
      preferences: {
        ...user.preferences,
        ...patch,
      },
    });
    setSaving(false);
    if (profileError) {
      setError(profileError.message);
      return;
    }
    setOpen(false);
  }

  return (
    <div id="accreditation" className={cn('scroll-mt-6', className)}>
      <p className="eyebrow mb-1">Accredited investor</p>
      {record?.accredited ? (
        <>
          <p className="text-[14px] leading-snug text-ink">
            Verified · {accreditationBasisLabel(record.basis)}
          </p>
          {record.qualified_purchaser ? (
            <p className="mt-1 text-[13px] leading-snug text-slate">Qualified purchaser</p>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-2"
            onClick={() => {
              setError(null);
              setOpen(true);
            }}
          >
            Update
          </Button>
        </>
      ) : record ? (
        <>
          <p className="text-[14px] leading-snug text-ink">Not accredited</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-2"
            onClick={() => {
              setError(null);
              setOpen(true);
            }}
          >
            Update
          </Button>
        </>
      ) : (
        <>
          <p className="text-[14px] leading-snug text-slate">Not verified</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-2"
            onClick={() => {
              setError(null);
              setOpen(true);
            }}
          >
            Verify
          </Button>
        </>
      )}

      {open ? (
        <AccreditationDialog
          initial={draftFromAccreditation(record)}
          saving={saving}
          error={error}
          onClose={() => {
            if (!saving) setOpen(false);
          }}
          onConfirm={(draft) => void confirm(draft)}
        />
      ) : null}
    </div>
  );
}
