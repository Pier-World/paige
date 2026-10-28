import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronUp, LogOut } from 'lucide-react';
import { PROFILE_SECTIONS } from '../../lib/profileSections';
import { cn } from '../../lib/utils';

type AccountMenuProps = {
  displayName: string;
  email?: string;
  tierLabel: string;
  initials: string;
  onSignOut: () => void;
  onNavigate?: () => void;
};

export function AccountMenu({
  displayName,
  email,
  tierLabel,
  initials,
  onSignOut,
  onNavigate,
}: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const onProfile = location.pathname.startsWith('/profile');

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;

    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'flex w-full items-center gap-3 rounded-[6px] px-3 py-2 text-left transition-colors hover:bg-ink/[0.05]',
          (open || onProfile) && 'bg-ink/[0.05]'
        )}
      >
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-midnight text-[12px] font-medium text-parchment">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-ink">{displayName}</p>
          <p className="truncate text-[10px] uppercase tracking-[0.12em] text-slate">{tierLabel}</p>
        </div>
        <ChevronUp
          className={cn(
            'h-3.5 w-3.5 flex-shrink-0 text-slate transition-transform',
            open ? 'rotate-0' : 'rotate-180'
          )}
        />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          className="absolute bottom-full left-0 right-0 z-20 mb-1 overflow-hidden rounded-[8px] border border-border bg-surface py-1 shadow-card"
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="truncate text-[13px] font-medium text-ink">{displayName}</p>
            {email ? <p className="truncate text-[12px] text-slate">{email}</p> : null}
          </div>
          {PROFILE_SECTIONS.map((section) => {
            const active = location.pathname === section.path;
            return (
              <Link
                key={section.id}
                role="menuitem"
                to={section.path}
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                }}
                className={cn(
                  'block px-3 py-2 text-[13px] transition-colors hover:bg-parchment',
                  active ? 'text-ink' : 'text-ink/75'
                )}
              >
                {section.label}
              </Link>
            );
          })}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void onSignOut();
            }}
            className="mt-1 flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-[13px] text-slate transition-colors hover:bg-parchment hover:text-ink"
          >
            <LogOut className="h-3.5 w-3.5 stroke-[1.25]" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
