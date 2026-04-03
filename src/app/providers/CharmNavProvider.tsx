import React, { createContext, useContext, useMemo, useState } from "react";

type Ctx = {
  canOpenCharm: boolean;
  setCanOpenCharm: (v: boolean) => void;
};

const CharmNavContext = createContext<Ctx | null>(null);

export function CharmNavProvider({ children }: { children: React.ReactNode }) {
  const [canOpenCharm, setCanOpenCharm] = useState(false);
  const value = useMemo(() => ({ canOpenCharm, setCanOpenCharm }), [canOpenCharm]);
  return <CharmNavContext.Provider value={value}>{children}</CharmNavContext.Provider>;
}

export function useCharmNav() {
  const ctx = useContext(CharmNavContext);
  if (!ctx) throw new Error("useCharmNav must be used within CharmNavProvider");
  return ctx;
}
