import type { ReactNode } from "react";
import "./InfoPanel.css";

interface InfoPanelProps {
  question: string;
  children: ReactNode;
}

export function InfoPanel({ question, children }: InfoPanelProps) {
  return (
    <details className="teInfoPanel">
      <summary>{question}</summary>
      <div className="teInfoPanelBody">{children}</div>
    </details>
  );
}
