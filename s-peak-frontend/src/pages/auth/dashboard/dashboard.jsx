import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Briefcase, Plane, Coffee, Download, Play, ArrowRight, MessageCircle } from "lucide-react";
import SessionInProgress from "./sessionInProgress";
 import { clearToken, authFetch, getUserName } from "../../../lib/api";

const CONTEXTS = [
  { id: "daily", label: "Daily Routine", icon: Coffee },
  { id: "work", label: "Work", icon: Briefcase },
  { id: "travel", label: "Travel", icon: Plane },
];
 
const INITIAL_SESSIONS = [
  { icon: Briefcase, topic: "Work Meeting Prep", date: "Oct 24, 2024", duration: "12:45", score: 85 },
  { icon: Coffee, topic: "Ordering Coffee", date: "Oct 22, 2024", duration: "05:20", score: 92 },
  { icon: Plane, topic: "Airport Customs", date: "Oct 18, 2024", duration: "08:15", score: 74 },
];

const CONTEXT_ICON = { daily: Coffee, work: Briefcase, travel: Plane };
 
function RingStat({ label, value, iconColor }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="stat-card">
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">
          {value}
          <span className="stat-percent">%</span>
        </p>
      </div>
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={radius} fill="none" stroke="#e7e9ec" strokeWidth="5" />
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke={iconColor}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 28 28)"
        />
      </svg>
    </div>
  );
}
 
function formatToday() {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
 
function formatDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
 
function ScorePill({ score }) {
  const color = score >= 85 ? "#22c55e" : score >= 75 ? "#f59e0b" : "#ef4444";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 56,
        padding: "6px 10px",
        borderRadius: 999,
        background: "rgba(59, 130, 246, 0.08)",
        color,
        fontWeight: 700,
      }}
    >
      {score}
    </span>
  );
}

// DELETE the entire INITIAL_SESSIONS array — no longer needed

export default function SpeakDashboard() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("daily");
  const [topic, setTopic] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [showSession, setShowSession] = useState(false);
  const [sessions, setSessions] = useState([]);          // was: useState(INITIAL_SESSIONS)
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [highlightIndex, setHighlightIndex] = useState(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef(null);
  const userName = getUserName();

  useEffect(() => {
    authFetch("/api/v1/history")
      .then((res) => res.json())
      .then((rows) => {
        const mapped = rows.map((r) => ({
          icon: CONTEXT_ICON[r.mode] || MessageCircle,
          topic: r.topic || "Free Talk",
          date: new Date(r.created_at).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
          }),
          score: r.overall_score ?? null,
        }));
        setSessions(mapped);
      })
      .catch((err) => console.error("Failed to load history:", err))
      .finally(() => setLoadingHistory(false));
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTopic("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const startSession = () => {
    if (showSession) return;
    setShowSession(true);
  };

  const handleSessionEnd = (transcript, durationSeconds) => {
    setShowSession(false);

    const finalTopic = topic.trim() || transcript.trim() || "Free Talk";
    const Icon = CONTEXT_ICON[selected] || MessageCircle;
    const score = Math.floor(70 + Math.random() * 25);

    const newSession = {
      icon: Icon,
      topic: finalTopic,
      date: formatToday(),
      duration: formatDuration(durationSeconds || 1),
      score,
    };

    setSessions((prev) => [newSession, ...prev]);
    setHighlightIndex(0);
    setTopic("");
    window.setTimeout(() => setHighlightIndex(null), 1800);
  };

  const handleLogout = () => {
    clearToken();
    navigate("/login");
  };

  return (
    <div>
      <style>{`
        * { box-sizing: border-box; }
        .stat-card {
          background: #fff;
          border-radius: 16px;
          padding: 20px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 1px solid #edeef2;
        }
        .stat-label { font-size: 13px; color: #6b7280; margin: 0 0 6px 0; }
        .stat-value { font-size: 28px; font-weight: 700; margin: 0; color: #111827; }
        .stat-percent { font-size: 14px; font-weight: 500; color: #9ca3af; margin-left: 2px; }
        .context-card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          position: relative;
          transition: all 0.15s ease;
          background: #fff;
        }
        .context-card:hover { border-color: #cbd5e1; }
        .context-card.selected {
          background: #eef1fb;
          border-color: #94a3d8;
        }
        table.sessions { width: 100%; border-collapse: collapse; }
        table.sessions th {
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: none;
          padding: 14px 24px;
          border-bottom: 1px solid #eef0f3;
        }
        table.sessions td {
          padding: 16px 24px;
          border-bottom: 1px solid #f1f2f5;
          font-size: 14.5px;
        }
        table.sessions tr:last-child td { border-bottom: none; }
        .row-icon {
          width: 34px; height: 34px; border-radius: 999px;
          background: #eef1fb; display: flex; align-items: center; justify-content: center;
          color: #3f4f8f; flex-shrink: 0;
        }
        .new-row {
          animation: highlightRow 1.8s ease-out;
        }
        @keyframes highlightRow {
          0% { background-color: #fff6da; }
          100% { background-color: transparent; }
        }
        .topic-input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 14.5px;
          outline: none;
          font-family: inherit;
        }
        .topic-input:focus { border-color: #94a3d8; }
        .mic-btn {
          border: none;
          border-radius: 10px;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(220, 38, 38, 0); }
          100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
        .pulse { animation: pulse 1.5s infinite; }
      `}</style>

      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 40px",
          background: "#fff",
          borderBottom: "1px solid #eceef1",
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: "0.02em", color: "#1f3d34" }}>S-PEAK</div>
        <nav style={{ display: "flex", gap: 32, fontSize: 15 }}>
          <span style={{ fontWeight: 600, color: "#1f3d34", borderBottom: "2px solid #1f3d34", paddingBottom: 4 }}>
            Dashboard
          </span>
          <span style={{ color: "#6b7280", cursor: "pointer" }}>History</span>
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ color: "#374151", fontSize: 14.5, cursor: "pointer" }}>Profile</span>
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
            Logout
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "40px 24px 60px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 6px 0" }}>
  HOW'S THE DAY{userName ? `, ${userName}` : ""}.
</h1>
        <p style={{ color: "#6b7280", fontSize: 15.5, margin: "0 0 32px 0" }}>
          Ready to find your quiet confidence today?
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 40 }}>
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              padding: 32,
              border: "1px solid #edeef2",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <Mic size={20} color="#3d5c52" />
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>New Practice Session</h2>
            </div>
            <p style={{ color: "#6b7280", fontSize: 14.5, margin: "0 0 24px 0" }}>
              Select a context, then say what you'd like to talk about.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
              {CONTEXTS.map(({ id, label, icon: Icon }) => {
                const isSelected = selected === id;
                return (
                  <div
                    key={id}
                    className={`context-card${isSelected ? " selected" : ""}`}
                    onClick={() => setSelected(id)}
                  >
                    {isSelected && (
                      <div
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: "#3f4f8f",
                          color: "#fff",
                          fontSize: 11,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ✓
                      </div>
                    )}
                    <Icon size={26} color="#374151" strokeWidth={1.6} />
                    <span style={{ fontSize: 14.5, fontWeight: 500 }}>{label}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>
                Topic
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  className="topic-input"
                  type="text"
                  placeholder={isListening ? "Listening..." : "e.g. Negotiating rent with my landlord"}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={showSession}
                />
                <button
                  className={`mic-btn${isListening ? " pulse" : ""}`}
                  onClick={toggleListening}
                  disabled={!speechSupported || showSession}
                  style={{
                    background: isListening ? "#dc2626" : "#eef1fb",
                    color: isListening ? "#fff" : "#3f4f8f",
                  }}
                  title={speechSupported ? "Speak your topic" : "Speech recognition not supported in this browser"}
                >
                  <Mic size={18} />
                </button>
              </div>
              {!speechSupported && (
                <p style={{ fontSize: 12.5, color: "#9ca3af", marginTop: 6 }}>
                  Voice input isn't supported in this browser — type your topic instead.
                </p>
              )}
            </div>

            <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={startSession}
                disabled={showSession}
                style={{
                  background: "#3d5c52",
                  color: "#fff",
                  border: "none",
                  borderRadius: 999,
                  padding: "12px 26px",
                  fontSize: 14.5,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: showSession ? "not-allowed" : "pointer",
                  opacity: showSession ? 0.6 : 1,
                }}
              >
                <Play size={14} fill="#fff" /> Start Session
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="stat-card">
              <div>
                <p className="stat-label">Total Sessions</p>
                <p className="stat-value">{sessions.length}</p>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "#eef1fb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Download size={18} color="#3f4f8f" />
              </div>
            </div>
            <RingStat label="Avg. Grammar" value={88} iconColor="#3d5c52" />
            <RingStat label="Avg. Fluency" value={76} iconColor="#1f3d34" />
          </div>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 16px 0" }}>Recent Sessions</h2>
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #edeef2", overflow: "hidden" }}>
          <table className="sessions">
            <thead>
              <tr>
                <th>Topic</th>
                <th>Date</th>
                <th>Duration</th>
                <th style={{ textAlign: "right" }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, i) => (
                <tr key={`${s.topic}-${s.date}-${i}`} className={i === highlightIndex ? "new-row" : ""}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div className="row-icon">
                        <s.icon size={16} />
                      </div>
                      <span style={{ fontWeight: 500 }}>{s.topic}</span>
                    </div>
                  </td>
                  <td style={{ color: "#4b5563" }}>{s.date}</td>
                  <td style={{ color: "#4b5563" }}>{s.duration}</td>
                  <td style={{ textAlign: "right" }}>
                    <ScorePill score={s.score} />
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "16px 24px" }}>
                  <span
                    style={{
                      color: "#374151",
                      fontSize: 14,
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                    }}
                  >
                    View Full History <ArrowRight size={14} />
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
      <footer
        style={{
          borderTop: "1px solid #eceef1",
          padding: "24px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 13.5,
          color: "#6b7280",
        }}
      >
        <span>S-PEAK © 2024 S-PEAK. Find your quiet confidence.</span>
        <div style={{ display: "flex", gap: 24 }}>
          <span style={{ textDecoration: "underline", cursor: "pointer" }}>Privacy Policy</span>
          <span style={{ textDecoration: "underline", cursor: "pointer" }}>Terms of Service</span>
          <span style={{ cursor: "pointer" }}>Support</span>
        </div>
      </footer>

      {showSession && (
        <SessionInProgress
          onClose={() => setShowSession(false)}
          onEnd={handleSessionEnd}
        />
      )}
    </div>
  );
}
