import { useEffect, useRef, useState } from "react";

export interface OrientationOffset {
  /** Horizontal shift, -1 … +1 (left tilt → negative) */
  x: number;
  /** Vertical shift, -1 … +1 (forward tilt → negative) */
  y: number;
}

const ZERO: OrientationOffset = { x: 0, y: 0 };

/**
 * Returns a normalised tilt offset suitable for parallax.
 * Falls back to {0,0} on desktop or if permission is denied.
 *
 * `range` controls the max tilt angle (degrees) that maps to ±1.
 * Larger = less sensitive. Default 30°.
 */
export function useDeviceOrientation(range = 30): OrientationOffset {
  const [offset, setOffset] = useState<OrientationOffset>(ZERO);
  const permitted = useRef(false);

  useEffect(() => {
    if (typeof DeviceOrientationEvent === "undefined") return;

    let mounted = true;

    async function requestAndListen() {
      // iOS 13+ requires explicit permission
      if (
        typeof (DeviceOrientationEvent as any).requestPermission === "function"
      ) {
        try {
          const result = await (
            DeviceOrientationEvent as any
          ).requestPermission();
          if (result !== "granted") return;
        } catch {
          return;
        }
      }

      permitted.current = true;

      const clamp = (v: number) => Math.max(-1, Math.min(1, v));

      function onOrientation(e: DeviceOrientationEvent) {
        if (!mounted) return;
        const gamma = e.gamma ?? 0; // left-right tilt, -90…90
        const beta = e.beta ?? 0; // front-back tilt, -180…180

        setOffset({
          x: clamp(gamma / range),
          y: clamp((beta - 45) / range), // 45° = phone held comfortably
        });
      }

      window.addEventListener("deviceorientation", onOrientation, {
        passive: true,
      });
    }

    requestAndListen();

    return () => {
      mounted = false;
      // clean up is fine even if listener was never added
      window.removeEventListener("deviceorientation", () => {});
    };
  }, [range]);

  return offset;
}
