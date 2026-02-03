import React from "react";
import { Outlet } from "react-router-dom";
import { FixedStage } from "./FixedStage";
import "./shell.css";

export function AppShell() {
  return (
    <FixedStage width={900} height={1600} fit="contain" background="#0b0a08">
      <div className="te-stage">
        {/* Static background art */}
        <div className="te-bg" />

        {/* Top / middle / bottom layout */}
        <div className="te-layout">
          <header className="te-status">
            {/* Temporary status text until we wire StatusProvider */}
            <div className="te-statusText">Status: Ready</div>
          </header>

          {/* This is the only scrolling area */}
          <main className="te-scroll">
            <Outlet />
          </main>

          {/* Global bottom commands (optional).
              For now leave empty; individual pages can render their own command bars
              OR you can keep a global footer here later. */}
          <footer className="te-commands">
            {/* Placeholder: you can remove this once pages supply their own command rows */}
            <div className="te-commandHint"> </div>
          </footer>
        </div>
      </div>
    </FixedStage>
  );
}
