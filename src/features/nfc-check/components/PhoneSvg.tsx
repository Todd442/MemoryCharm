import type { DeviceFamily } from "../nfcDetect";
import { MANUFACTURER_DATA } from "../nfcData";

interface PhoneSvgProps {
  deviceFamily: DeviceFamily;
  className?: string;
}

export function PhoneSvg({ deviceFamily, className }: PhoneSvgProps) {
  const { antennaSvgConfig } = MANUFACTURER_DATA[deviceFamily];

  // Convert percentage-based config to SVG viewBox coordinates (200 x 400)
  const cx = (antennaSvgConfig.cx / 100) * 200;
  const cy = (antennaSvgConfig.cy / 100) * 400;
  const r = (antennaSvgConfig.r / 100) * 400;

  return (
    <svg
      viewBox="0 0 200 400"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={`Phone diagram showing NFC antenna location for ${MANUFACTURER_DATA[deviceFamily].displayName}`}
    >
      {/* Phone body — 176×382 gives ~1:2.17 ratio, matching a real smartphone */}
      <rect
        x="12" y="9" width="176" height="382" rx="28" ry="28"
        fill="rgba(15,10,6,0.6)"
        stroke="rgba(210,170,110,0.45)"
        strokeWidth="2"
      />

      {/* Screen */}
      <rect
        x="19" y="34" width="162" height="332" rx="10" ry="10"
        fill="rgba(30,20,12,0.4)"
        stroke="rgba(210,170,110,0.15)"
        strokeWidth="1"
      />

      {/* Camera — center punch hole */}
      <circle
        cx="100" cy="22" r="5"
        fill="rgba(210,170,110,0.15)"
        stroke="rgba(210,170,110,0.3)"
        strokeWidth="1"
      />

      {/* NFC highlight — pulsing outer ring */}
      <g style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <circle
          cx={cx} cy={cy} r={r}
          fill="rgba(210,170,110,0.12)"
          stroke="rgba(210,170,110,0.35)"
          strokeWidth="1.5"
          className="teNfcHighlight"
        />
      </g>

      {/* NFC highlight — solid inner zone */}
      <circle
        cx={cx} cy={cy} r={r * 0.55}
        fill="rgba(210,170,110,0.2)"
        stroke="rgba(210,170,110,0.55)"
        strokeWidth="1.5"
      />

      {/* Label */}
      <text
        x={cx} y={cy + r + 18}
        textAnchor="middle"
        fill="rgba(210,170,110,0.7)"
        fontSize="14"
        fontFamily="Cinzel, serif"
        letterSpacing="2"
      >
        NFC
      </text>

      {/* "BACK" label at bottom */}
      <text
        x="100" y="403"
        textAnchor="middle"
        fill="rgba(210,170,110,0.35)"
        fontSize="11"
        fontFamily="Cinzel, serif"
        letterSpacing="1.5"
      >
        BACK OF PHONE
      </text>
    </svg>
  );
}
