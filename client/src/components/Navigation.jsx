import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  Receipt,
  Wallet,
  UserCheck,
  Settings,
  History,
  PlusCircle,
  LogOut,
  X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Navigation({ mobileOpen, setMobileOpen }) {
  const { user, workspaces, activeWorkspaceId, switchWorkspace, logout } = useAuth();
  const navigate = useNavigate();

  const navSections = [
    {
      title: "OVERVIEW",
      items: [
        { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { label: "Activity", path: "/activity", icon: History },
      ]
    },
    {
      title: "HOUSEHOLD",
      items: [
        { label: "Friends", path: "/friends", icon: Users },
        { label: "Meal Entries", path: "/entries", icon: UtensilsCrossed },
        { label: "Members", path: "/members", icon: UserCheck },
      ]
    },
    {
      title: "BILLING",
      items: [
        { label: "Invoices", path: "/invoices", icon: Receipt },
        { label: "Payments", path: "/payments", icon: Wallet },
      ]
    },
    {
      title: "PREFERENCES",
      items: [
        { label: "Settings", path: "/settings", icon: Settings },
      ]
    }
  ];

  const handleNavClick = () => {
    if (mobileOpen) setMobileOpen(false);
  };

  const handleLogout = () => {
    if (mobileOpen) setMobileOpen(false);
    logout();
    navigate("/login");
  };

  return (
    <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      {/* Brand Header */}
      <div
        style={{
          padding: "1.1rem 1.25rem",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--brown)",
              color: "var(--text-inverse)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "800",
              fontSize: "1.1rem",
            }}
          >
            T
          </div>
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "700", letterSpacing: "-0.02em", margin: 0, lineHeight: 1.1 }}>
              TiffinSplit
            </h2>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0 }}>
              Shared Household Billing
            </p>
          </div>
        </div>

        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "0.4rem",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            aria-label="Close Mobile Drawer"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Workspace Selector */}
      {workspaces.length > 0 && (
        <div
          style={{
            padding: "0.75rem 1.25rem",
            borderBottom: "1px solid var(--border)",
            backgroundColor: "var(--surface-muted)",
          }}
        >
          <label
            style={{
              fontSize: "0.65rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: "600",
              display: "block"
            }}
          >
            Household Workspace
          </label>
          <select
            className="select"
            style={{
              marginTop: "0.25rem",
              padding: "0.4rem 0.6rem",
              fontSize: "0.85rem",
              fontWeight: "500",
              minHeight: "38px"
            }}
            value={activeWorkspaceId || ""}
            onChange={(e) => switchWorkspace(e.target.value)}
          >
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Primary Action Button */}
      <div style={{ padding: "0.85rem 1.25rem 0.35rem 1.25rem" }}>
        <button
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center", fontWeight: "600" }}
          onClick={() => {
            navigate("/entries/new");
            handleNavClick();
          }}
        >
          <PlusCircle size={18} />
          <span>+ Add Meal</span>
        </button>
      </div>

      {/* Navigation List Grouped */}
      <nav style={{ flex: 1, padding: "0.5rem 1rem", overflowY: "auto" }}>
        {navSections.map((section, idx) => (
          <div key={section.title} style={{ marginBottom: idx === navSections.length - 1 ? "0.5rem" : "0.85rem" }}>
            <span
              style={{
                fontSize: "0.65rem",
                fontWeight: "700",
                color: "var(--text-muted)",
                letterSpacing: "0.06em",
                padding: "0 0.85rem",
                display: "block",
                marginBottom: "0.25rem"
              }}
            >
              {section.title}
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    style={({ isActive }) => ({
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.55rem 0.85rem",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.88rem",
                      fontWeight: isActive ? "600" : "500",
                      color: isActive ? "var(--brown)" : "var(--text)",
                      backgroundColor: isActive ? "var(--surface-muted)" : "transparent",
                      textDecoration: "none",
                      transition: "all 0.15s ease",
                      minHeight: "40px"
                    })}
                  >
                    <Icon size={18} style={{ opacity: 0.9, flexShrink: 0 }} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Mobile Drawer Footer: User Profile & Logout */}
      {user && (
        <div
          className="mobile-only-user-footer"
          style={{
            padding: "0.85rem 1.25rem",
            borderTop: "1px solid var(--border)",
            backgroundColor: "var(--surface-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", overflow: "hidden" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "var(--accent-payment)",
                color: "var(--accent-payment-text)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                fontSize: "0.85rem",
                flexShrink: 0
              }}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.name}
              </span>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.email}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              background: "none",
              border: "none",
              color: "var(--error-text)",
              cursor: "pointer",
              padding: "0.4rem",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "36px",
              minWidth: "36px"
            }}
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      )}
    </aside>
  );
}
