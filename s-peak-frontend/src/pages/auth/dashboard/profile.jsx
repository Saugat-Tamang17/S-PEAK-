// NEW FILE: minimal profile page reachable at /profile.
// Built from data already available client-side (name in localStorage + /api/v1/history),
// since there's currently no dedicated backend /me endpoint.
import React, { useState, useEffect } from "react";
import Navbar from "../../../components/Navbar";
import { authFetch, getUserName } from "../../../lib/api";

export default function Profile() {
  const [stats, setStats] = useState({ total: 0, avgOverall: 0 });
  const userName = getUserName();

  useEffect(() => {
    authFetch("/api/v1/history")
      .then((res) => res.json())
      .then((rows) => {
        const graded = rows.filter((r) => r.overall_score !== null);
        const avgOverall = graded.length
          ? Math.round((graded.reduce((sum, r) => sum + r.overall_score, 0) / graded.length) * 10) / 10
          : 0;
        setStats({ total: rows.length, avgOverall });
      })
      .catch((err) => console.error("Failed to load profile stats:", err));
  }, []);

  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 700, margin: "0 auto", padding: "40px 24px 60px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>Profile</h1>
        <div style={{ background: "#fff", border: "1px solid #edeef2", borderRadius: 16, padding: 28 }}>
          <p style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px 0" }}>{userName || "S-PEAK User"}</p>
          <p style={{ color: "#6b7280", margin: "0 0 20px 0" }}>Practicing since your first session</p>
          <div style={{ display: "flex", gap: 32 }}>
            <div>
              <p style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>{stats.total}</p>
              <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Total Sessions</p>
            </div>
            <div>
              <p style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>{stats.avgOverall}/10</p>
              <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Avg. Overall Score</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}