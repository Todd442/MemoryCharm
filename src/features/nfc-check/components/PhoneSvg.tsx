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
      {/* Phone body */}
      <rect
        x="30" y="10" width="140" height="380" rx="24" ry="24"
        fill="rgba(15,10,6,0.6)"
        stroke="rgba(210,170,110,0.45)"
        strokeWidth="2"
      />

      {/* Screen */}
      <rect
        x="38" y="30" width="124" height="340" rx="8" ry="8"
        fill="rgba(30,20,12,0.4)"
        stroke="rgba(210,170,110,0.15)"
        strokeWidth="1"
      />

      {/* Camera notch */}
      <ellipse
        cx="100" cy="22" rx="18" ry="4"
        fill="rgba(210,170,110,0.12)"
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
        x="100" y="390"
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
