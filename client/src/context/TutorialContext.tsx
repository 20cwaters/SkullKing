import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface TutorialContextValue {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  dismissed: Set<string>;
  dismiss: (tipId: string) => void;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const dismiss = (tipId: string) => setDismissed((prev) => new Set(prev).add(tipId));

  const value = useMemo(() => ({ enabled, setEnabled, dismissed, dismiss }), [enabled, dismissed]);

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
}

export function useTutorial(): TutorialContextValue {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error('useTutorial must be used within a TutorialProvider');
  return ctx;
}
