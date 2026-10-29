// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _ph: any = null;

export function track(event: string, props?: Record<string, unknown>) {
  _ph?.capture(event, props);
}

export function identify(userId: string) {
  _ph?.identify(userId);
}

export async function initAnalytics() {
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  if (!key) return;
  const { default: posthog } = await import("posthog-js");
  posthog.init(key, {
    api_host: (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? "https://us.i.posthog.com",
    autocapture: false,
    capture_pageview: true,
  });
  _ph = posthog;
}
