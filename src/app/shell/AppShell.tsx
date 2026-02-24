import { Outlet } from "react-router-dom";
import { FixedStage } from "./FixedStage";
import { StatusProvider } from "../providers/StatusProvider";
import { StatusBar } from "./StatusBar";
import "./shell.css";

export function AppShell() {
  return (
    <FixedStage width={900} height={1600} fit="contain" background="#0b0a08">
      <div className="te-stage">
        {/* Static background art */}
        <div className="te-bg" />

        {/* Top / middle / bottom layout */}
        <StatusProvider>
          <div className="te-layout">
            <StatusBar />

            {/* This is the only scrolling area */}
            <main className="te-scroll">
              <Outlet />
            </main>

            <footer className="te-commands" id="te-footer" />
          </div>
        </StatusProvider>
      </div>
    </FixedStage>
  );
}
