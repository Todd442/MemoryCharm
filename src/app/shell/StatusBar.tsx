import React from "react";
import { useStatus } from "../providers/StatusProvider";

export function StatusBar() {
  let text = "Ready";

  try {
    const { status } = useStatus();
    text = status.text;
  } catch {
    // Provider missing; keep default so app still renders
  }

  return (
    <div className="te-status">
      <div className="te-status-inner">Status: {text}</div>
    </div>
  );
}
