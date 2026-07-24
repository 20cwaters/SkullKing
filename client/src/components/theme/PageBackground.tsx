import type { ReactNode } from 'react';

export function PageBackground({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-parchment-page relative overflow-hidden">
      {/* darkened, worn edges */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_110px_45px_rgba(70,46,16,0.45)]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
