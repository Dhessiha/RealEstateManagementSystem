import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import PreferencesMenu from "./PreferencesMenu";
import ChatbotWidget from "./ChatbotWidget";
import {
  IconBuilding,
  IconCrane,
  IconGrid,
  IconLogout,
  IconUsers,
  IconCalendar,
  IconClipboard,
  IconBox,
  IconChartBar,
  IconFolder,
  IconUser,
  IconWallet,
  IconHardHat,
} from "./Icons";
import "./DashboardLayout.css";

const ROLE_LABEL = {
  admin: "Administrator",
  engineer: "Site Engineer",
  client: "Client",
};

// Every role sees a different set of modules — decided here, once, from
// the signed-in account's role. Nobody navigates to a page their role
// doesn't grant; it simply isn't in the list.
const NAV_BY_ROLE = {
  admin: [
    { to: "/projects", label: "Projects & Units", icon: IconGrid },
    { to: "/construction", label: "Construction", icon: IconCrane },
    { to: "/workforce", label: "Workforce", icon: IconUsers },
    { to: "/team", label: "Team & Access", icon: IconHardHat },
    { to: "/attendance", label: "Attendance", icon: IconCalendar },
    { to: "/daily-log", label: "Daily Log", icon: IconClipboard },
    { to: "/materials", label: "Materials", icon: IconBox },
    { to: "/reports", label: "Reports", icon: IconChartBar },
    { to: "/documents", label: "Documents", icon: IconFolder },
    { to: "/requests", label: "Client Requests", icon: IconUser },
    { to: "/financial", label: "Financials", icon: IconWallet },
  ],
  engineer: [
    { to: "/construction", label: "Construction", icon: IconCrane },
    { to: "/workforce", label: "Workforce", icon: IconUsers },
    { to: "/attendance", label: "Attendance", icon: IconCalendar },
    { to: "/daily-log", label: "Daily Log", icon: IconClipboard },
    { to: "/materials", label: "Materials", icon: IconBox },
    { to: "/documents", label: "Documents", icon: IconFolder },
  ],
  client: [
    { to: "/client-dashboard", label: "My Dashboard", icon: IconUser },
    { to: "/financial", label: "Payments", icon: IconWallet },
    { to: "/documents", label: "Documents", icon: IconFolder },
  ],
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const navItems = NAV_BY_ROLE[user?.role] ?? [];

  return (
    <div className="layout">
      <aside className="layout__sidebar">
        <div className="layout__brand">
          <span className="layout__brand-mark">
            <IconBuilding />
          </span>
          <span className="layout__brand-name">{t("appName")}</span>
        </div>

        <nav className="layout__nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `layout__nav-link ${isActive ? "is-active" : ""}`}
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button type="button" className="layout__logout" onClick={handleLogout}>
          <IconLogout />
          <span>{t("nav_logout")}</span>
        </button>
      </aside>

      <div className="layout__main">
        <header className="layout__topbar">
          <div className="layout__topbar-welcome">
            <p className="layout__eyebrow">
              {t("welcomeBack")} · <span className="layout__role-tag">{ROLE_LABEL[user?.role]}</span>
            </p>
            <h1>{user?.name}</h1>
          </div>
          <div className="layout__topbar-actions">
            <PreferencesMenu align="right" />
          </div>
        </header>

        <main className="layout__content">
          <Outlet />
        </main>
      </div>

      <ChatbotWidget />
    </div>
  );
}
