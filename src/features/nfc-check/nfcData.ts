import type { DeviceFamily } from "./nfcDetect";

export interface AntennaPosition {
  /** Y offset as percentage from top of phone (0–100) */
  cy: number;
  /** X offset as percentage from left (0–100) */
  cx: number;
  /** Radius of highlight zone as percentage of phone height */
  r: number;
}

export interface ManufacturerInfo {
  family: DeviceFamily;
  displayName: string;
  supportUrl: string;
  youtubeSearchUrl: string;
  enableHints: string[];
  quickSettingsTip: string | null;
  controlCenterTip: string | null;
  antennaSvgConfig: AntennaPosition;
}

export const MANUFACTURER_DATA: Record<DeviceFamily, ManufacturerInfo> = {
  apple: {
    family: "apple",
    displayName: "Apple iPhone",
    supportUrl: "https://support.apple.com/en-us/HT212227",
    youtubeSearchUrl: "https://www.youtube.com/results?search_query=how+to+enable+NFC+on+iPhone",
    enableHints: [
      "iPhone 12 and later: NFC is always on — no action needed.",
      "iPhone XS / XR / 11: NFC reads tags automatically when the screen is on.",
      "iPhone 7 / 8 / X: Open Control Center and tap the NFC Tag Reader icon.",
    ],
    quickSettingsTip: null,
    controlCenterTip:
      "On iPhone 7, 8, or X: go to Settings \u2192 Control Center and add \u201cNFC Tag Reader\u201d if the icon isn\u2019t showing.",
    antennaSvgConfig: { cy: 12, cx: 50, r: 10 },
  },
  samsung: {
    family: "samsung",
    displayName: "Samsung Galaxy",
    supportUrl: "https://www.samsung.com/us/support/troubleshooting/TSG01203568/",
    youtubeSearchUrl: "https://www.youtube.com/results?search_query=how+to+enable+NFC+Samsung+Galaxy",
    enableHints: [
      "Open Settings \u2192 Connections.",
      "Toggle NFC and contactless payments ON.",
    ],
    quickSettingsTip:
      "Swipe down from the top of the screen and look for the NFC tile in Quick Settings.",
    controlCenterTip: null,
    antennaSvgConfig: { cy: 45, cx: 50, r: 12 },
  },
  pixel: {
    family: "pixel",
    displayName: "Google Pixel",
    supportUrl: "https://support.google.com/pixelphone/answer/7157629",
    youtubeSearchUrl: "https://www.youtube.com/results?search_query=how+to+enable+NFC+Google+Pixel",
    enableHints: [
      "Open Settings \u2192 Connected devices \u2192 Connection preferences.",
      "Toggle NFC ON.",
    ],
    quickSettingsTip:
      "Swipe down from the top of the screen and look for the NFC tile in Quick Settings.",
    controlCenterTip: null,
    antennaSvgConfig: { cy: 25, cx: 50, r: 11 },
  },
  android: {
    family: "android",
    displayName: "Android Phone",
    supportUrl: "https://support.google.com/android",
    youtubeSearchUrl: "https://www.youtube.com/results?search_query=how+to+enable+NFC+on+Android",
    enableHints: [
      "Open Settings and look for Connected devices, Connections, or More.",
      "Find NFC and toggle it ON.",
    ],
    quickSettingsTip:
      "Swipe down from the top of the screen and look for the NFC tile in Quick Settings \u2014 often the fastest way.",
    controlCenterTip: null,
    antennaSvgConfig: { cy: 25, cx: 50, r: 12 },
  },
};

export const WIZARD_TEXT = {
  statusDetect:  { text: "NFC Divination",  subtitle: "The Mechanism reads your device." },
  statusResults: { text: "NFC Divination",  subtitle: "Your device\u2019s capabilities revealed." },
  statusEnable:  { text: "NFC Divination",  subtitle: "Awaken the signal within your device." },
  statusAntenna: { text: "NFC Divination",  subtitle: "Know where the charm must touch." },
  statusTest:    { text: "NFC Divination",  subtitle: "Prove the connection." },
  desktopMessage:
    "The Mechanism requires a mobile device. Visit this page from your phone or tablet.",
};
