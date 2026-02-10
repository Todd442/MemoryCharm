import React from "react";
import type { MemoryType, ContentFile } from "../features/playback/types";

export function PlayerPanel(props: { files: ContentFile[]; memoryType: MemoryType }) {
  if (props.files.length === 0) return null;

  if (props.memoryType === "video") {
    return (
      <div>
        <video className="te-video" src={props.files[0].url} controls playsInline autoPlay />
      </div>
    );
  }

  if (props.memoryType === "image") {
    return (
      <div>
        {props.files.map((f, i) => (
          <img key={i} className="te-image" src={f.url} alt={f.name || "Memory"} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <audio className="te-audio" src={props.files[0].url} controls autoPlay />
    </div>
  );
}
