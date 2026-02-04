import React from "react";
import { useStatus } from "../providers/StatusProvider";

export function StatusBar() {
  const { status } = useStatus();

  return (
    <div className="te-status">
      <div className="te-statusText">{status.text}</div>
      {status.subtitle && <div className="te-statusSub">{status.subtitle}</div>}
    </div>
  );
}
