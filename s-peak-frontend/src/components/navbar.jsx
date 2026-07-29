import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { clearToken } from "../lib/api";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    clearToken();
    navigate("/login");
  };

  const linkStyle = (path) => ({
    fontWeight: location.pathname === path ? 600 : 400,
    color: location.pathname === path ? "#1f3d34" : "#6b7280",
    borderBottom: location.pathname === path ? "2px solid #1f3d34" : "2px solid transparent",
    paddingBottom: 4,
    textDecoration: "none",
    cursor: "pointer",
  });

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 40px",
        background: "#fff",
        borderBottom: "1px solid #12ba9b",
      }}
    >
      <Link
        to="/"
        style={{ fontWeight: 800, fontSize: 20, letterSpacing: "0.02em", color: "#1f3d34", textDecoration: "none" }}
      >
        S-PEAK
      </Link>
      <nav style={{ display: "flex", gap: 32, fontSize: 15 }}>
        <Link to="/dashboard" style={linkStyle("/dashboard")}>Dashboard</Link>
        <Link to="/history" style={linkStyle("/history")}>History</Link>
      </nav>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Link to="/profile" style={{ color: "#374151", fontSize: 14.5, textDecoration: "none" }}>
          Profile
        </Link>
        <button
          onClick={handleLogout}
          style={{
            background: "#3d5c52",
            color: "#fff",
            border: "none",
            borderRadius: 999,
            padding: "9px 20px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          LOGOUT
        </button>
      </div>
    </header>
  );
}
      
 
      
