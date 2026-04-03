import { useEffect } from "react";
import { useStatus } from "../../../app/providers/StatusProvider";
import "../../account/pages/PurchasePage.css";

export function StorePage() {
  const { setStatus } = useStatus();

  useEffect(() => {
    setStatus({ text: "The Store", subtitle: "Charms, made in small batches." });
  }, [setStatus]);

  return (
    <div className="tePurchaseWrap">
      <div className="tePurchasePanel">

        <div className="tePurchaseSection">
          <div className="tePurchaseSectionTitle">Coming Soon</div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-label)", opacity: 0.75, lineHeight: 1.6, margin: 0 }}>
            Charms are made in small batches from Central Minnesota.
            The store is not yet open — join the waitlist on the home page
            and we'll reach out when the next ones are ready.
          </p>
        </div>

        <div className="tePurchaseSection">
          <div className="tePurchaseSectionTitle">What's Coming</div>
          <div className="tePurchaseOptions">
            <div className="tePurchaseCard">
              <div className="tePurchaseCardTitle">The Original Charm</div>
              <div className="tePurchaseCardDesc">
                A handcrafted NFC charm. Holds one memory — video, photos, or audio —
                for a decade or more. Paid once, no subscription.
              </div>
              <button className="tePurchaseCardBtn" disabled type="button">Coming Soon</button>
            </div>

            <div className="tePurchaseCard">
              <div className="tePurchaseCardTitle">Gift a Charm</div>
              <div className="tePurchaseCardDesc">
                Purchase a charm for someone else. They activate it, bind their memory,
                and carry it with them.
              </div>
              <button className="tePurchaseCardBtn" disabled type="button">Coming Soon</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
