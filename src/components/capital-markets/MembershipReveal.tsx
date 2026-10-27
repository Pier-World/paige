import { useEffect, useRef, useState } from 'react';

const ENTER_MS = 2400;
const LEAVE_MS = 700;

export function MembershipReveal({ onComplete }: { onComplete: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const enter = window.setTimeout(() => setLeaving(true), reduce ? 1600 : ENTER_MS);
    return () => window.clearTimeout(enter);
  }, []);

  useEffect(() => {
    if (!leaving) return undefined;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const leave = window.setTimeout(() => onCompleteRef.current(), reduce ? 0 : LEAVE_MS);
    return () => window.clearTimeout(leave);
  }, [leaving]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setLeaving(true);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="membership-reveal-title"
      className={`pier-reveal ${leaving ? 'is-leaving' : ''}`}
      onClick={() => setLeaving(true)}
    >
      <p className="eyebrow pier-reveal-copy text-gilt">Pier</p>
      <div className="gilt-rule pier-reveal-line mx-auto my-6 w-12" />
      <h1
        id="membership-reveal-title"
        className="pier-reveal-copy font-display text-[44px] leading-[1.05] tracking-[-0.02em] text-ink sm:text-[52px]"
      >
        You’re in.
      </h1>
      <p className="pier-reveal-copy-late mt-4 max-w-sm text-[15px] leading-relaxed text-slate">
        The membership is open.
      </p>
    </div>
  );
}
