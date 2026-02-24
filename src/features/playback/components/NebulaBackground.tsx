import { useDeviceOrientation } from "../hooks/useDeviceOrientation";
import "./NebulaBackground.css";

/**
 * Animated nebula + starfield background with device-orientation parallax.
 *
 * Three star layers at different depths drift slowly for parallax.
 * Five soft gradient blobs drift on long keyframe cycles.
 * The entire layer shifts with device tilt for physical depth.
 *
 * Fills whatever container it's placed in (viewport-filling via PlaybackShell).
 */
export function NebulaBackground() {
  const tilt = useDeviceOrientation(35);

  // Parallax: shift the whole nebula layer by up to ±20px
  const tx = tilt.x * 20;
  const ty = tilt.y * 20;

  return (
    <div
      className="nebula"
      style={{
        transform: `translate(${tx}px, ${ty}px)`,
      }}
    >
      {/* Starfield — three depth layers */}
      <div className="nebula-stars">
        <div className="nebula-stars__layer nebula-stars__layer--1" />
        <div className="nebula-stars__layer nebula-stars__layer--2" />
        <div className="nebula-stars__layer nebula-stars__layer--3" />
      </div>

      {/* Gas cloud blobs */}
      <div className="nebula-blob nebula-blob--1" />
      <div className="nebula-blob nebula-blob--2" />
      <div className="nebula-blob nebula-blob--3" />
      <div className="nebula-blob nebula-blob--4" />
      <div className="nebula-blob nebula-blob--5" />
    </div>
  );
}
