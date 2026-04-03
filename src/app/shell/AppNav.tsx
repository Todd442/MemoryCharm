import { useNavigate, useLocation } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { useCharmNav } from "../providers/CharmNavProvider";
import accountIcon from "../../assets/account.png";
import backIcon from "../../assets/back.png";
import shoppingIcon from "../../assets/shopping.png";
import "./AppNav.css";

function EyeIcon() {
  return (
    <svg
      className="te-nav__icon--svg"
      viewBox="0 0 52 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4 26 C12 13, 40 13, 48 26 C40 39, 12 39, 4 26Z"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <circle cx="26" cy="26" r="7.5" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="26" cy="26" r="2.8" fill="currentColor" />
    </svg>
  );
}

export function AppNav() {
  const nav = useNavigate();
  const location = useLocation();
  const { accounts } = useMsal();

  const { canOpenCharm } = useCharmNav();

  const isAuthed = accounts.length > 0;
  const isHome = location.pathname === "/";
  const isAccount = location.pathname.startsWith("/account");
  const isStore = location.pathname.startsWith("/store");

  // Extract charm code from charm detail, purchase, or claim pages
  const charmCodeMatch = location.pathname.match(/^\/account\/charms\/([^/]+)/) ??
                         location.pathname.match(/^\/claim\/([^/]+)/);
  const currentCharmCode = charmCodeMatch ? decodeURIComponent(charmCodeMatch[1]) : null;

  function goBack() {
    if (window.history.length > 1) {
      nav(-1);
    } else {
      nav("/");
    }
  }

  return (
    <nav className="te-nav" aria-label="Main navigation">

      {/* Back */}
      <button
        className="te-nav__slot"
        onClick={goBack}
        type="button"
        aria-label="Go back"
      >
        <img className="te-nav__icon" src={backIcon} alt="" />
        <span className="te-nav__label">Back</span>
      </button>

      {/* Open Charm / My Charms */}
      <button
        className={`te-nav__slot${isAccount ? " is-active" : ""}${(!isAuthed || !currentCharmCode || !canOpenCharm) ? " is-dim" : ""}`}
        onClick={() => currentCharmCode
          ? nav(`/c/${encodeURIComponent(currentCharmCode)}`, { state: { isOwner: true } })
          : nav("/account")
        }
        type="button"
        disabled={!isAuthed || !currentCharmCode || !canOpenCharm}
        aria-label="Open charm"
      >
        <EyeIcon />
        <span className="te-nav__label">Open</span>
      </button>

      {/* Home — centre medallion */}
      <button
        className={`te-nav__slot te-nav__slot--center${isHome ? " is-active" : ""}`}
        onClick={() => nav("/")}
        type="button"
        aria-label="Home"
      >
        <div className="te-nav__medallion" aria-hidden="true">M</div>
        <span className="te-nav__label">Home</span>
      </button>

      {/* Store */}
      <button
        className={`te-nav__slot${isStore ? " is-active" : ""}`}
        onClick={() => nav("/store")}
        type="button"
        aria-label="Store"
      >
        <img className="te-nav__icon" src={shoppingIcon} alt="" />
        <span className="te-nav__label">Store</span>
      </button>

      {/* Account */}
      <button
        className={`te-nav__slot${isAccount ? " is-active" : ""}${!isAuthed ? " is-dim" : ""}`}
        onClick={() => nav("/account")}
        type="button"
        disabled={!isAuthed}
        aria-label="Account"
      >
        <img className="te-nav__icon" src={accountIcon} alt="" />
        <span className="te-nav__label">Account</span>
      </button>

    </nav>
  );
}
