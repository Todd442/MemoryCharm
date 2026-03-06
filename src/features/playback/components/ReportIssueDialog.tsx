import { useState } from "react";
import { reportIssue } from "../api";
import { checkUrlAudioCodec } from "../utils/codecDetection";

type Props = {
  code: string;
  videoUrl: string;
  onClose: () => void;
};

type Phase = "prompt" | "submitting" | "done" | "declined";

export function ReportIssueDialog({ code, videoUrl, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("prompt");
  const [note, setNote] = useState("");

  async function handleConsent() {
    setPhase("submitting");

    // Run codec detection from the SAS URL via range requests
    const codecResult = await checkUrlAudioCodec(videoUrl);
    const detectedCodec =
      codecResult.ok === false ? codecResult.codec : undefined;

    await reportIssue(code, {
      consentGranted: true,
      userNote: note.trim() || undefined,
      detectedCodec,
    }).catch(() => {
      // swallow — report failure is non-fatal for the user
    });

    setPhase("done");
  }

  function handleDecline() {
    setPhase("declined");
    setTimeout(onClose, 1200);
  }

  return (
    <div className="pb-report-overlay" role="dialog" aria-modal="true">
      <div className="pb-report-dialog">
        <button
          className="pb-report-close"
          onClick={onClose}
          aria-label="Close"
          type="button"
        >
          <svg viewBox="0 0 10 10" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="1" y1="1" x2="9" y2="9" />
            <line x1="9" y1="1" x2="1" y2="9" />
          </svg>
        </button>
        {phase === "prompt" && (
          <>
            <p className="pb-report-title">Is this video not playing correctly?</p>
            <p className="pb-report-body">
              Can we take a look? We'll only access this memory to diagnose the problem.
            </p>
            <textarea
              className="pb-report-note"
              placeholder="Describe what you're seeing (optional)"
              maxLength={500}
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="pb-report-actions">
              <button className="pb-report-btn-primary" onClick={handleConsent}>
                Yes, please investigate
              </button>
              <button className="pb-report-btn-secondary" onClick={handleDecline}>
                No thanks
              </button>
            </div>
          </>
        )}

        {phase === "submitting" && (
          <p className="pb-report-body">Sending report…</p>
        )}

        {phase === "done" && (
          <>
            <p className="pb-report-title">Thank you</p>
            <p className="pb-report-body">We'll take a look and be in touch if we need anything.</p>
            <div className="pb-report-actions">
              <button className="pb-report-btn-secondary" onClick={onClose}>Close</button>
            </div>
          </>
        )}

        {phase === "declined" && (
          <p className="pb-report-body">No problem.</p>
        )}
      </div>
    </div>
  );
}
