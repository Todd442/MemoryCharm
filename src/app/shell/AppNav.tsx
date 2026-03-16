import { useNavigate, useLocation } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import homeIcon from "../../assets/Home.png";
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

      {/* Far-left circle: Back */}
      <button
        className="te-nav__slot te-nav__slot--circle te-nav__slot--pos1"
        onClick={goBack}
        type="button"
        aria-label="Go back"
      >
        <img className="te-nav__icon" src={backIcon} alt="" />
        <span className="te-nav__label">Back</span>
      </button>

      {/* Left rect: My Charms */}
      <button
        className={`te-nav__slot te-nav__slot--rect te-nav__slot--pos2${isAccount ? " is-active" : ""}${!isAuthed ? " is-dim" : ""}`}
        onClick={() => nav("/account")}
        type="button"
        disabled={!isAuthed}
        aria-label="My Charms"
      >
        <span className="te-nav__label">Charms</span>
      </button>

      {/* Center circle: Home */}
      <button
        className={`te-nav__slot te-nav__slot--circle te-nav__slot--center te-nav__slot--pos3${isHome ? " is-active" : ""}`}
        onClick={() => nav("/")}
        type="button"
        aria-label="Home"
      >
        <img className="te-nav__icon" src={homeIcon} alt="" />
        <span className="te-nav__label">Home</span>
      </button>

      {/* Right rect: Store */}
      <button
        className={`te-nav__slot te-nav__slot--rect te-nav__slot--pos4${isStore ? " is-active" : ""}`}
        onClick={() => nav("/store")}
        type="button"
        aria-label="Store"
      >
        <img className="te-nav__icon" src={shoppingIcon} alt="" />
        <span className="te-nav__label">Store</span>
      </button>

      {/* Far-right circle: Account */}
      <button
        className={`te-nav__slot te-nav__slot--circle te-nav__slot--pos5${isAccount ? " is-active" : ""}${!isAuthed ? " is-dim" : ""}`}
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
