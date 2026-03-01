import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface PwaInstallState {
  /** True on Android/Chrome when the browser is ready to show an install prompt. */
  canInstall: boolean;
  /** True on iOS (iPhone/iPad) running in Safari (not already installed). */
  isIos: boolean;
  /** True when already running as an installed PWA (standalone mode). */
  isStandalone: boolean;
  /** Trigger the native browser install prompt (no-op if canInstall is false). */
  triggerInstall(): Promise<void>;
}

export function usePwaInstall(): PwaInstallState {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  const isIos =
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !(navigator as any).standalone;

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true;

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setPromptEvent(null);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") setPromptEvent(null);
  }, [promptEvent]);

  return {
    canInstall: !!promptEvent && !isStandalone,
    isIos: isIos && !isStandalone,
    isStandalone,
    triggerInstall,
  };
}
