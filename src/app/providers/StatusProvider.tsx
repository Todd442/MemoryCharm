import React, { createContext, useContext, useMemo, useState } from "react";

type Status = { text: string; tone?: "neutral" | "warn" | "error" };

type Ctx = {
  status: Status;
  setStatus: (s: Status) => void;
};

const StatusContext = createContext<Ctx | null>(null);

export function StatusProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>({ text: "Ready", tone: "neutral" });
  const value = useMemo(() => ({ status, setStatus }), [status]);
  return <StatusContext.Provider value={value}>{children}</StatusContext.Provider>;
}

export function useStatus() {
  const ctx = useContext(StatusContext);
  if (!ctx) throw new Error("useStatus must be used within StatusProvider");
  return ctx;
}
