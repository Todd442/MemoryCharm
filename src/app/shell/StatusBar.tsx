import React from "react";

export function StatusBar() {
  // Later: wire this to global store/toasts/progress
  return (
    <div className="te-status">
      <div className="te-status-inner">Status: Ready</div>
    </div>
  );
}
