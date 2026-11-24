export function BlurredTerm() {
  return (
    <span className="relative inline-flex items-center">
      <span className="sr-only">Hidden on Standard. Included with Pier+.</span>
      <span
        aria-hidden
        className="inline-block select-none font-mono-data text-[13px] tracking-[0.18em] text-ink blur-[5px]"
      >
        ••••••
      </span>
    </span>
  );
}
