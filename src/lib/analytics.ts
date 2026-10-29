import type { PostHog, CaptureResult } from "posthog-js";

// PostHog loads lazily after MSAL bootstrap, so anything captured before then is
// queued and flushed on init. Without a key (VITE_POSTHOG_KEY) everything is a no-op.
let _ph: PostHog | null = null;
let _disabled = false;
const MAX_QUEUE = 100;
type Pending = { kind: "event"; name: string; props?: Record<string, unknown> } | { kind: "error"; error: unknown; props?: Record<string, unknown> };
const _queue: Pending[] = [];

function enqueue(item: Pending) {
  if (_disabled) return;
  // Pin the section now — by flush time the user may have navigated elsewhere
  item.props = { ...item.props, app_section: sectionFor(window.location.pathname) };
  if (_queue.length < MAX_QUEUE) _queue.push(item);
}

export function track(event: string, props?: Record<string, unknown>) {
  if (_ph) _ph.capture(event, props);
  else enqueue({ kind: "event", name: event, props });
}

export function captureError(error: unknown, props?: Record<string, unknown>) {
  if (_ph) _ph.captureException(error, props);
  else enqueue({ kind: "error", error, props });
}

export function identify(userId: string) {
  _ph?.identify(userId);
}

// ── Scrubbing ───────────────────────────────────────────────────────────────
// Charm codes and NFC tokens act as access keys, and signed storage URLs grant
// read/write access — none of them may leave the browser.

// SPA routes (/c, /claim, /account/charms) and storage keys (charms/{code}/…)
const PATH_CODE = /\/(c|claim|charms)\/[^/?#\s"']+/gi;
// Query and hash params: NFC token, storage SAS / S3 signatures, and the MSAL
// redirect response (#code=…&state=…&client_info=…) after sign-in
const SECRET_PARAM = /([?&#](?:token|code|state|client_info|session_state|id_token|access_token|sig|se|sp|sv|sr|st|skoid|sktid|X-Amz-[A-Za-z-]+))=[^&#\s"']*/gi;

export function scrubText(s: string): string {
  return s.replace(PATH_CODE, "/$1/:code").replace(SECRET_PARAM, "$1=REDACTED");
}

function scrubDeep(value: unknown, depth = 0): unknown {
  if (typeof value === "string") return scrubText(value);
  if (depth > 6 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(v => scrubDeep(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) out[k] = scrubDeep(v, depth + 1);
  return out;
}

// ── App section ─────────────────────────────────────────────────────────────
// A readable name for where the user is, attached to every event and exception
// so errors can be grouped by area without decoding (scrubbed) URLs.

const SECTIONS: [RegExp, string][] = [
  [/^\/c(\/|$)/, "playback"],
  [/^\/claim\//, "claim"],
  [/^\/account\/charms\/[^/]+\/purchase/, "charm_purchase"],
  [/^\/account\/charms\//, "charm_detail"],
  [/^\/account/, "account"],
  [/^\/store/, "store"],
  [/^\/terms/, "legal"],
  [/^\/faq/, "faq"],
  [/^\/nfc-check/, "nfc_check"],
  [/^\/$/, "home"],
];

export function sectionFor(pathname: string): string {
  for (const [re, name] of SECTIONS) if (re.test(pathname)) return name;
  return "other";
}

function beforeSend(event: CaptureResult | null): CaptureResult | null {
  if (!event) return event;
  event.properties = {
    ...event.properties,
    app_section: event.properties?.app_section ?? sectionFor(window.location.pathname),
  };
  event.properties = scrubDeep(event.properties) as CaptureResult["properties"];
  if (event.$set) event.$set = scrubDeep(event.$set) as CaptureResult["$set"];
  if (event.$set_once) event.$set_once = scrubDeep(event.$set_once) as CaptureResult["$set_once"];
  return event;
}

// ── Early error capture ─────────────────────────────────────────────────────
// Installed synchronously at startup so errors during bootstrap are queued.
// PostHog's own exception autocapture takes over once it loads.

function onEarlyError(e: ErrorEvent) {
  captureError(e.error ?? e.message, { source: "window.onerror" });
}
function onEarlyRejection(e: PromiseRejectionEvent) {
  captureError(e.reason, { source: "unhandledrejection" });
}

// MSAL's silent token renewal loads the app in a hidden iframe. Analytics there
// would start a second PostHog sharing the same storage — logging phantom
// pageviews and a $pageleave when MSAL removes the frame, which splits sessions.
const inIframe = window.self !== window.top;

export function installEarlyErrorCapture() {
  if (!import.meta.env.VITE_POSTHOG_KEY || inIframe) return;
  window.addEventListener("error", onEarlyError);
  window.addEventListener("unhandledrejection", onEarlyRejection);
}

export async function initAnalytics() {
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  if (!key || inIframe) {
    _disabled = true;
    _queue.length = 0;
    return;
  }
  const { default: posthog } = await import("posthog-js");
  posthog.init(key, {
    api_host: (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? "https://us.i.posthog.com",
    autocapture: false,
    // SPA: `true` only captures the initial load; this also captures router navigations
    capture_pageview: "history_change",
    capture_exceptions: true,
    // Replay would record private memories (and non-expiring R2 media URLs)
    disable_session_recording: true,
    person_profiles: "identified_only",
    before_send: beforeSend,
  });

  window.removeEventListener("error", onEarlyError);
  window.removeEventListener("unhandledrejection", onEarlyRejection);

  _ph = posthog;
  for (const item of _queue.splice(0)) {
    if (item.kind === "event") posthog.capture(item.name, item.props);
    else posthog.captureException(item.error, item.props);
  }
}
