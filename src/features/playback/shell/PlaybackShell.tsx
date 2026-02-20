import React from "react";
import { Outlet } from "react-router-dom";
import { NebulaBackground } from "../components/NebulaBackground";
import "./PlaybackShell.css";

/**
 * Immersive viewport-filling shell for content playback.
 * The nebula + starfield fill edge-to-edge in any orientation.
 * Content floats centred within, scaling responsively.
 */
export function PlaybackShell() {
  return (
    <div className="pb-shell">
      <NebulaBackground />

      <main className="pb-content">
        <Outlet />
      </main>
    </div>
  );
}
