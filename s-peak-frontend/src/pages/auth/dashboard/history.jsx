// NEW FILE: full session history with per-skill scores and AI feedback, reachable at /history
import React, { useState, useEffect } from "react";
import Navbar from "../../../components/Navbar";
import { authFetch } from "../../../lib/api";

export default function History() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null); // which row's feedback is expanded

  useEffect(() => {
    authFetch("/api/v1/history")
      .then((res) => res.json())
      .then(setRows)
      .catch((err) => console.error("Failed to load history:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 60px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>Session History</h1>

        {loading && <p style={{ color: "#6b7280" }}>Loading…</p>}
        {!loading && rows.length === 0 && (
          <p style={{ color: "#6b7280" }}>No sessions yet.</p>
        )}

        {rows.map((r) => (
          <div
            key={r.session_id}
            style={{ background: "#fff", border: "1px solid #edeef2", borderRadius: 14, padding: 20, marginBottom: 14 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>{r.topic || "Free Talk"}</strong>
                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  {new Date(r.created_at).toLocaleString()} · {r.mode}
                </div>
              </div>
              {r.overall_score !== null && (
                <div style={{ textAlign: "right", fontSize: 13, color: "#374151" }}>
                  Overall: <strong>{r.overall_score}/10</strong><br />
                  Grammar {r["grammer-score"]} · Fluency {r.fluency_score} · Content {r.content_score}
                </div>
              )}
            </div>

            {r.feedback && (
              <>
                <button
                  onClick={() => setOpenId(openId === r.session_id ? null : r.session_id)}
                  style={{
                    marginTop: 10, background: "none", border: "none", color: "#3f4f8f",
                    fontSize: 13.5, fontWeight: 600, cursor: "pointer", padding: 0,
                  }}
                >
                  {openId === r.session_id ? "Hide feedback ▲" : "View feedback ▼"}
                </button>
                {openId === r.session_id && (
                  <p style={{ marginTop: 8, color: "#374151", lineHeight: 1.6, fontSize: 14.5 }}>
                    {r.feedback}
                  </p>
                )}
              </>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}