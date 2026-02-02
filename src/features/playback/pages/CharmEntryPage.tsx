import React, { useEffect, useMemo, useReducer, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { MemoryType } from "../types";
import { entryByCode, entryByToken, getPlaybackUrl, verifyGlyph } from "../api";
import { GlyphAuthPanel } from "../../../components/GlyphAuthPanel";
import { PlayerPanel } from "../../../components/PlayerPanel";

type State =
  | { s: "boot"; message?: string }
  | { s: "needsAuth"; code: string; attemptsLeft: number }
  | { s: "fetchingMedia"; code: string }
  | { s: "playing"; code: string; playbackUrl: string; memoryType: MemoryType }
  | { s: "notFound" }
  | { s: "expired" }
  | { s: "blocked" }
  | { s: "error"; message: string };

type Event =
  | { e: "boot" }
  | { e: "need_auth"; code: string; attemptsLeft: number }
  | { e: "fetch_media"; code: string }
  | { e: "media_ready"; code: string; playbackUrl: string; memoryType: MemoryType }
  | { e: "not_found" }
  | { e: "expired" }
  | { e: "blocked" }
  | { e: "fail"; message: string };

function reduce(state: State, ev: Event): State {
  switch (ev.e) {
    case "boot":
      return { s: "boot" };
    case "need_auth":
      return { s: "needsAuth", code: ev.code, attemptsLeft: ev.attemptsLeft };
    case "fetch_media":
      return { s: "fetchingMedia", code: ev.code };
    case "media_ready":
      return { s: "playing", code: ev.code, playbackUrl: ev.playbackUrl, memoryType: ev.memoryType };
    case "not_found":
      return { s: "notFound" };
    case "expired":
      return { s: "expired" };
    case "blocked":
      return { s: "blocked" };
    case "fail":
      return { s: "error", message: ev.message };
    default:
      return state;
  }
}

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

// Token storage choice: sessionStorage (survives route changes; dies when tab closes)
const tokenKey = (code: string) => `charm.token.${code}`;

export function CharmEntryPage() {
  const nav = useNavigate();
  const params = useParams<{ code?: string }>();
  const query = useQuery();

  const urlToken = query.get("token") ?? undefined;
  const urlCode = params.code ?? undefined;

  const [state, dispatch] = useReducer(reduce, { s: "boot" });
  const [glyphBusy, setGlyphBusy] = useState(false);

  // 1) Bootstrap: if token exists, resolve to a code and clean the URL
  useEffect(() => {
    let cancelled = false;

    async function bootstrapFromToken(token: string) {
      try {
        const entry = await entryByToken(token);
        if (cancelled) return;

        if (entry.kind === "not_found") return dispatch({ e: "not_found" });
        if (entry.kind === "expired") return dispatch({ e: "expired" });

        // entry.kind is unclaimed or claimed and includes canonical `code`
        const code = entry.code;

        // store token for this tab/session (optional; may not be needed if server sets cookie)
        sessionStorage.setItem(tokenKey(code), token);

        // CLEAN URL (remove ?token=...) without a reload
        nav(`/c/${encodeURIComponent(code)}`, { replace: true });

        // Continue flow using the entry we already have
        await handleEntry(entry);
      } catch (err: any) {
        dispatch({ e: "fail", message: err?.message ?? "Bootstrap failed." });
      }
    }

    async function bootstrapFromCode(code: string) {
      try {
        const entry = await entryByCode(code);
        if (cancelled) return;
        await handleEntry(entry);
      } catch (err: any) {
        dispatch({ e: "fail", message: err?.message ?? "Lookup failed." });
      }
    }

    async function handleEntry(entry: Awaited<ReturnType<typeof entryByCode>>) {
      if (entry.kind === "not_found") return dispatch({ e: "not_found" });
      if (entry.kind === "expired") return dispatch({ e: "expired" });

      if (entry.kind === "unclaimed") {
        // Charm not registered/claimed yet -> kick off owner onboarding
        nav(`/claim/${encodeURIComponent(entry.code)}`, { replace: true });
        return;
      }

      // claimed
      if (!entry.configured) {
        // In your model, "registered" might include configured; you can decide:
        // - redirect owner to claim/setup
        // - show a public "not configured" message
        nav(`/claim/${encodeURIComponent(entry.code)}`, { replace: true });
        return;
      }

      // configured and claimed -> auth gate or media
      if (entry.authMode === "glyph") {
        dispatch({ e: "need_auth", code: entry.code, attemptsLeft: entry.attemptsLeft ?? 3 });
        return;
      }

      dispatch({ e: "fetch_media", code: entry.code });
    }

    dispatch({ e: "boot" });

    // precedence: token bootstrap if present, else code
    if (urlToken) bootstrapFromToken(urlToken);
    else if (urlCode) bootstrapFromCode(urlCode);
    else dispatch({ e: "fail", message: "Missing charm token/code." });

    return () => {
      cancelled = true;
    };
  }, [urlToken, urlCode, nav]);

  // 2) When fetchingMedia, request a playback URL and start playing
  useEffect(() => {
    let cancelled = false;

    async function fetchMedia(code: string) {
      try {
        const media = await getPlaybackUrl(code);
        if (cancelled) return;
        dispatch({ e: "media_ready", code, playbackUrl: media.playbackUrl, memoryType: media.memoryType });
      } catch (err: any) {
        dispatch({ e: "fail", message: err?.message ?? "Failed to load media." });
      }
    }

    if (state.s === "fetchingMedia") fetchMedia(state.code);

    return () => {
      cancelled = true;
    };
  }, [state]);

  async function onSubmitGlyph(glyph: string) {
    if (state.s !== "needsAuth") return;
    setGlyphBusy(true);
    try {
      const res = await verifyGlyph(state.code, glyph);
      if (res.ok) {
        dispatch({ e: "fetch_media", code: state.code });
      } else {
        if (res.attemptsLeft <= 0) dispatch({ e: "blocked" });
        else dispatch({ e: "need_auth", code: state.code, attemptsLeft: res.attemptsLeft });
      }
    } catch (err: any) {
      dispatch({ e: "fail", message: err?.message ?? "Auth failed." });
    } finally {
      setGlyphBusy(false);
    }
  }

  // Render panels (inside your ornate frame)
  switch (state.s) {
    case "boot":
      return <div className="te-center">Checking charm…</div>;

    case "needsAuth":
      return (
        <GlyphAuthPanel
          attemptsLeft={state.attemptsLeft}
          busy={glyphBusy}
          onSubmit={onSubmitGlyph}
        />
      );

    case "fetchingMedia":
      return <div className="te-center">Awakening the memory…</div>;

    case "playing":
      return <PlayerPanel playbackUrl={state.playbackUrl} memoryType={state.memoryType} />;

    case "expired":
      return <div className="te-center">This charm’s memory has faded.</div>;

    case "notFound":
      return <div className="te-center">This charm cannot be found.</div>;

    case "blocked":
      return <div className="te-center">The charm rejects this attempt.</div>;

    case "error":
      return <div className="te-center">Error: {state.message}</div>;
  }
}
