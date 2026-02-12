import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";

import { useStatus } from "../../../app/providers/StatusProvider";
import { detect, probeAndRefine, type DetectionResult, type DeviceFamily } from "../nfcDetect";
import { MANUFACTURER_DATA, WIZARD_TEXT } from "../nfcData";
import { PhoneSvg } from "../components/PhoneSvg";

import "../../claim/pages/ClaimCharmPage.css"; // shared .teBtn, .teCard, .tePill, etc.
import "./NfcCheckPage.css";

type Step = "detect" | "results" | "enable" | "antenna" | "test";

export function NfcCheckPage() {
  const { setStatus } = useStatus();

  const [step, setStep] = useState<Step>("detect");
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<DeviceFamily>("android");
  const [tapStatus, setTapStatus] = useState<"idle" | "waiting" | "success" | "failed">("idle");
  const [footerEl, setFooterEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setFooterEl(document.getElementById("te-footer"));
  }, []);

  // History-backed step navigation ------------------------------------------------
  function setInitialStep(s: Step) {
    setStep(s);
    window.history.replaceState({ step: s }, "");
  }

  function advanceTo(s: Step) {
    setStep(s);
    window.history.pushState({ step: s }, "");
  }

  function goBack() {
    window.history.back();
  }

  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      if (e.state?.step) {
        setStep(e.state.step as Step);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  // -------------------------------------------------------------------------------

  // Status bar sync
  useEffect(() => {
    const titles: Record<Step, { text: string; subtitle: string }> = {
      detect:  WIZARD_TEXT.statusDetect,
      results: WIZARD_TEXT.statusResults,
      enable:  WIZARD_TEXT.statusEnable,
      antenna: WIZARD_TEXT.statusAntenna,
      test:    WIZARD_TEXT.statusTest,
    };
    setStatus(titles[step]);
  }, [step, setStatus]);

  // Auto-detection on mount
  useEffect(() => {
    const result = detect();
    setDetection(result);
    setSelectedFamily(result.deviceFamily);

    if (result.platform === "desktop") {
      setInitialStep("results");
      return;
    }

    probeAndRefine(result).then((refined) => {
      setDetection(refined);
      setInitialStep("results");
    });
  }, []);

  // Tap test handler
  const handleStartTapTest = useCallback(async () => {
    if (!("NDEFReader" in window)) {
      setTapStatus("failed");
      return;
    }
    setTapStatus("waiting");

    try {
      const ndef = new (window as any).NDEFReader();
      const ac = new AbortController();

      const timeout = setTimeout(() => {
        ac.abort();
        setTapStatus("failed");
      }, 30000);

      ndef.addEventListener("reading", () => {
        clearTimeout(timeout);
        ac.abort();
        setTapStatus("success");
      }, { once: true });

      await ndef.scan({ signal: ac.signal });
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setTapStatus("failed");
      }
    }
  }, []);

  const info = MANUFACTURER_DATA[selectedFamily];
  const isDesktop = detection?.platform === "desktop";

  const stepTitle: Record<Step, string> = {
    detect:  "DETECTING",
    results: "DEVICE REPORT",
    enable:  "ENABLE NFC",
    antenna: "ANTENNA GUIDE",
    test:    "TAP TEST",
  };

  return (
    <>
      <div className="teNfcWrap">
        <div className="teNfcPanel">
          <div className="teCard">
            <div className="teCardHeader">
              <div className="teCardHeaderLine" />
              <div className="teCardHeaderTitle">{stepTitle[step]}</div>
              <div className="teCardHeaderLine" />
            </div>

            {/* STEP: DETECT */}
            {step === "detect" && (
              <div className="teCardBody">
                <div className="teNfcDetecting">
                  <div className="teNfcSpinner" />
                  <div className="teHint">Reading your device\u2026</div>
                </div>
              </div>
            )}

            {/* STEP: RESULTS */}
            {step === "results" && (
              <div className="teCardBody">
                {isDesktop ? (
                  <div className="teNfcDesktopMsg">
                    <div className="teNfcIcon">&#x2726;</div>
                    <p>{WIZARD_TEXT.desktopMessage}</p>
                  </div>
                ) : (
                  <div className="teGrid">
                    <div className="teNfcInfoRow">
                      <span className="teNfcInfoLabel">Device</span>
                      <span className="teNfcInfoValue">{info.displayName}</span>
                    </div>
                    <div className="teNfcInfoRow">
                      <span className="teNfcInfoLabel">Platform</span>
                      <span className="teNfcInfoValue">{detection?.platform}</span>
                    </div>
                    <div className="teNfcInfoRow">
                      <span className="teNfcInfoLabel">NFC</span>
                      <span className="teNfcInfoValue">
                        {detection?.nfcStatus === "supported" && "Supported"}
                        {detection?.nfcStatus === "not_detected" && "Not detected"}
                        {detection?.nfcStatus === "unknown" && (
                          detection?.platform === "ios"
                            ? "Unknown \u2014 most iPhones support NFC"
                            : "Unknown"
                        )}
                      </span>
                    </div>

                    <div>
                      {detection?.nfcStatus === "supported" ? (
                        <div className="teNfcBadge teNfcBadge--ok">NFC Ready</div>
                      ) : (
                        <div className="teNfcBadge teNfcBadge--warn">NFC may need attention</div>
                      )}
                    </div>

                    <div className="teBtnsRow">
                      {detection?.nfcStatus !== "supported" && (
                        <button
                          className="teBtn teBtnPrimary"
                          onClick={() => advanceTo("enable")}
                          type="button"
                        >
                          Enable NFC
                        </button>
                      )}
                      <button
                        className="teBtn teBtnGhost"
                        onClick={() => advanceTo("antenna")}
                        type="button"
                      >
                        Find Antenna
                      </button>
                      {detection?.canRunTapTest && (
                        <button
                          className="teBtn teBtnGhost"
                          onClick={() => advanceTo("test")}
                          type="button"
                        >
                          Tap Test
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP: ENABLE */}
            {step === "enable" && (
              <div className="teCardBody">
                <div className="teGrid">
                  <div className="teNfcStepTitle">{info.displayName}</div>

                  <ol className="teNfcHints">
                    {info.enableHints.map((hint, i) => (
                      <li key={i}>{hint}</li>
                    ))}
                  </ol>

                  {info.quickSettingsTip && (
                    <div className="teNfcTip">
                      <strong>Quick tip:</strong> {info.quickSettingsTip}
                    </div>
                  )}

                  {info.controlCenterTip && (
                    <div className="teNfcTip">
                      <strong>Older models:</strong> {info.controlCenterTip}
                    </div>
                  )}

                  <div className="teNfcLinks">
                    <a
                      href={info.supportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="teBtn teBtnGhost teNfcLinkBtn"
                    >
                      Official Support &#x2197;
                    </a>
                    <a
                      href={info.youtubeSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="teBtn teBtnGhost teNfcLinkBtn"
                    >
                      Video Guide &#x25B6;
                    </a>
                  </div>

                  <div className="teActionsRow">
                    <button
                      className="teBtn teBtnPrimary"
                      onClick={() => advanceTo("antenna")}
                      type="button"
                    >
                      Find Antenna
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP: ANTENNA */}
            {step === "antenna" && (
              <div className="teCardBody">
                <div className="teGrid">
                  <div>
                    <div className="teFieldLabel">Your device</div>
                    <div className="tePills tePillsWrap">
                      {(["apple", "samsung", "pixel", "android"] as DeviceFamily[]).map((f) => (
                        <button
                          key={f}
                          className={"tePill " + (selectedFamily === f ? "isActive" : "")}
                          onClick={() => setSelectedFamily(f)}
                          type="button"
                        >
                          {MANUFACTURER_DATA[f].displayName.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <div className="teHint" style={{ marginTop: 8 }}>
                      If auto-detection was wrong, select your device above.
                    </div>
                  </div>

                  <div className="teNfcPhoneWrap">
                    <PhoneSvg deviceFamily={selectedFamily} />
                    <div className="teNfcPhoneCaption">
                      Hold your charm near the highlighted area on the <strong>back</strong> of your phone.
                    </div>
                  </div>

                  <div className="teActionsRow">
                    {detection?.canRunTapTest ? (
                      <button
                        className="teBtn teBtnPrimary"
                        onClick={() => advanceTo("test")}
                        type="button"
                      >
                        Try a Tap Test
                      </button>
                    ) : (
                      <div className="teNfcManualTestHint">
                        Hold your charm near the highlighted area. If your screen shows content, NFC is working!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP: TEST */}
            {step === "test" && (
              <div className="teCardBody">
                <div className="teGrid">
                  {detection?.canRunTapTest ? (
                    <div className="teNfcTestArea">
                      {tapStatus === "idle" && (
                        <button
                          className="teBtn teBtnPrimary"
                          onClick={handleStartTapTest}
                          type="button"
                        >
                          Begin Tap Test
                        </button>
                      )}
                      {tapStatus === "waiting" && (
                        <div className="teNfcWaiting">
                          <div className="teNfcSpinner" />
                          <div>Hold any NFC tag or charm near your phone\u2026</div>
                        </div>
                      )}
                      {tapStatus === "success" && (
                        <div className="teNfcSuccess">
                          <div className="teNfcSuccessIcon">&#x2714;</div>
                          <div className="teNfcStepTitle">NFC is working!</div>
                          <div className="teHint">
                            Your device detected an NFC tag. You\u2019re ready to use Memory Charm.
                          </div>
                        </div>
                      )}
                      {tapStatus === "failed" && (
                        <div className="teNfcFailed">
                          <div>NFC scan could not complete.</div>
                          <div className="teHint">
                            Check that NFC is enabled in your device settings, then try again.
                          </div>
                          <button
                            className="teBtn teBtnGhost"
                            onClick={() => setTapStatus("idle")}
                            type="button"
                          >
                            Retry
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="teNfcManualTest">
                      <PhoneSvg deviceFamily={selectedFamily} className="teNfcPhoneSmall" />
                      <div className="teHint">
                        Hold your charm near the highlighted area on the back of your phone.
                        If your screen shows content, NFC is working!
                      </div>
                      {detection?.platform === "ios" && (
                        <div className="teNfcTip">
                          On older iPhones, you may need to open the NFC Tag Reader from Control Center first.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="teNfcFooter">
            <Link to="/">Home</Link>
          </div>
        </div>
      </div>

      {/* Footer portal: Back button */}
      {footerEl && createPortal(
        <div className="te-footerActions">
          {step !== "detect" && step !== "results" && (
            <button
              className="teBtn teBtnSm teBtnGhost"
              onClick={goBack}
              type="button"
            >
              &larr; Back
            </button>
          )}
        </div>,
        footerEl
      )}
    </>
  );
}
