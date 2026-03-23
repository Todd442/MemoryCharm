import { useNavigate, useLocation } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import accountIcon from "../../assets/account.png";
import backIcon from "../../assets/back.png";
import shoppingIcon from "../../assets/shopping.png";
import "./AppNav.css";

export function AppNav() {
  const nav = useNavigate();
  const location = useLocation();
  const { accounts } = useMsal();

  const isAuthed = accounts.length > 0;
  const isHome = location.pathname === "/";
  const isAccount = location.pathname.startsWith("/account");
  const isStore = location.pathname.startsWith("/store");

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

      {/* My Charms */}
      <button
        className={`te-nav__slot${isAccount ? " is-active" : ""}${!isAuthed ? " is-dim" : ""}`}
        onClick={() => nav("/account")}
        type="button"
        disabled={!isAuthed}
        aria-label="My Charms"
      >
        <span className="te-nav__icon--glyph" aria-hidden="true">☆</span>
        <span className="te-nav__label">Charms</span>
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
