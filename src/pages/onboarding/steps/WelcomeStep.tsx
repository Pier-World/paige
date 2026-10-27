interface WelcomeStepProps {
  firstName: string;
  onNext: () => void;
  busy?: boolean;
}

export function WelcomeStep({ firstName, onNext, busy }: WelcomeStepProps) {
  return (
    <div className="flex flex-1 flex-col justify-center py-8">
      <p className="eyebrow mb-4">Welcome</p>
      <h1 className="font-display text-[40px] leading-[0.95] tracking-[-0.02em] text-ink sm:text-[48px]">
        {firstName ? `Welcome, ${firstName}.` : 'Welcome to Pier.'}
      </h1>
      <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-slate">
        Pier is a private community of fund managers and allocators — dinners, context, and
        introductions, not a public directory.
      </p>
      <p className="mt-3 text-[14px] text-slate/80">This takes about a minute.</p>
      <button
        type="button"
        onClick={onNext}
        disabled={busy}
        className="mt-10 inline-flex h-11 w-fit items-center rounded-[8px] bg-ink px-6 text-[14px] text-parchment hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Begin
      </button>
    </div>
  );
}
