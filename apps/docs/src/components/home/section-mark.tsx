/** Hairline + small end label. */
export function SectionMark({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-8 flex items-center gap-3">
      <span className="h-px flex-1 bg-hairline" />
      <span className="mono-label">{children}</span>
    </div>
  );
}
