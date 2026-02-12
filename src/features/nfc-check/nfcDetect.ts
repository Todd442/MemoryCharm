export type Platform = "ios" | "android" | "desktop" | "unknown";
export type DeviceFamily = "apple" | "samsung" | "pixel" | "android";
export type NfcStatus = "supported" | "not_detected" | "unknown";

export interface DetectionResult {
  platform: Platform;
  deviceFamily: DeviceFamily;
  nfcStatus: NfcStatus;
  webNfcAvailable: boolean;
  canRunTapTest: boolean;
  rawUA: string;
}

function detectPlatform(ua: string): Platform {
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Windows|Macintosh|Linux/.test(ua)) return "desktop";
  return "unknown";
}

function detectDeviceFamily(ua: string, platform: Platform): DeviceFamily {
  if (platform === "ios") return "apple";
  if (/Samsung|SM-/i.test(ua)) return "samsung";
  if (/Pixel/i.test(ua)) return "pixel";
  return "android";
}

function detectNfcStatus(platform: Platform, webNfc: boolean): NfcStatus {
  if (webNfc) return "supported";
  if (platform === "ios") return "unknown";
  if (platform === "android") return "not_detected";
  return "unknown";
}

export function detect(): DetectionResult {
  const ua = navigator.userAgent;
  const platform = detectPlatform(ua);
  const deviceFamily = detectDeviceFamily(ua, platform);
  const webNfcAvailable = "NDEFReader" in window;
  const nfcStatus = detectNfcStatus(platform, webNfcAvailable);

  return {
    platform,
    deviceFamily,
    nfcStatus,
    webNfcAvailable,
    canRunTapTest: webNfcAvailable,
    rawUA: ua,
  };
}

export type ProbeResult = "enabled" | "disabled_or_absent" | "permission_denied" | "unavailable";

export async function runNfcProbe(): Promise<ProbeResult> {
  if (!("NDEFReader" in window)) return "unavailable";

  try {
    const ndef = new (window as any).NDEFReader();
    const ac = new AbortController();
    await ndef.scan({ signal: ac.signal });
    ac.abort();
    return "enabled";
  } catch (err: any) {
    if (err.name === "NotAllowedError") return "permission_denied";
    if (err.name === "NotSupportedError") return "disabled_or_absent";
    return "unavailable";
  }
}

export async function probeAndRefine(result: DetectionResult): Promise<DetectionResult> {
  if (!result.webNfcAvailable) return result;

  const probe = await runNfcProbe();
  if (probe === "disabled_or_absent") {
    return { ...result, nfcStatus: "not_detected", canRunTapTest: false };
  }
  if (probe === "permission_denied") {
    return { ...result, nfcStatus: "not_detected" };
  }
  return { ...result, nfcStatus: "supported" };
}
