import React from "react";
import type { MemoryType } from "../features/playback/types";

export function PlayerPanel(props: { playbackUrl: string; memoryType: MemoryType }) {
  if (props.memoryType === "video") {
    return (
      <div>
        <video className="te-video" src={props.playbackUrl} controls playsInline autoPlay />
      </div>
    );
  }

  if (props.memoryType === "image") {
    return (
      <div>
        <img className="te-image" src={props.playbackUrl} alt="Memory" />
      </div>
    );
  }

  return (
    <div>
      <audio className="te-audio" src={props.playbackUrl} controls autoPlay />
    </div>
  );
}
