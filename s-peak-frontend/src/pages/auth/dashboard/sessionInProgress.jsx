import React, { useState, useRef, useEffect } from "react";
import { X, Mic } from "lucide-react";

function formatDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}




export default function SessionInProgress({ onClose, onEnd }) {
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const pausedRef = useRef(false);
  const endedRef = useRef(false);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  // Timer
  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isPaused]);

  // Speech recognition — continuous, restarts itself if it times out
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalChunk += text + " ";
        } else {
          interimChunk += text;
        }
      }
      if (finalChunk) {
        finalTranscriptRef.current += finalChunk;
        setTranscript(finalTranscriptRef.current);
      }
      setInterim(interimChunk);
    };

    recognition.onend = () => {
      // auto-restart unless the user paused/ended intentionally
      if (!pausedRef.current && !endedRef.current) {
        try {
          recognition.start();
        } catch (e) {
          /* already started */
        }
      }
    };
    recognition.onerror = () => {};

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      /* ignore */
    }

    return () => {
      endedRef.current = true;
      recognition.stop();
    };
  }, []);

  const togglePause = () => {
    setIsPaused((prev) => !prev);
    if (!isPaused) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (e) {
        /* already started */
      }
    }
  };

  const handleEnd = () => {
    endedRef.current = true;
    clearInterval(timerRef.current);
    recognitionRef.current?.stop();
    const finalText = (finalTranscriptRef.current + interim).trim();
    onEnd(finalText, elapsed);
  };

  const handleClose = () => {
    endedRef.current = true;
    clearInterval(timerRef.current);
    recognitionRef.current?.stop();
    onClose();
  };

  const displayText = (transcript + interim).trim();

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#f5f6f9",
        fontFamily: "'Inter', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <style>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .cursor-bar {
          display: inline-block;
          width: 2px;
          height: 26px;
          background: #94a3b8;
          margin-left: 4px;
          vertical-align: middle;
          animation: blink 1s step-start infinite;
        }
        @keyframes micPulse {
          0% { box-shadow: 0 0 0 0 rgba(61, 92, 82, 0.35); }
          70% { box-shadow: 0 0 0 18px rgba(61, 92, 82, 0); }
          100% { box-shadow: 0 0 0 0 rgba(61, 92, 82, 0); }
        }
        .mic-pulse { animation: micPulse 1.8s infinite; }
      `}</style>

      {/* Close */}
      <button
        onClick={handleClose}
        style={{
          position: "absolute",
          top: 28,
          left: 28,
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "#fff",
          border: "none",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <X size={20} color="#374151" />
      </button>

      {/* Title */}
      <div style={{ marginTop: 30, fontSize: 15, fontWeight: 600, color: "#3f5568" }}>
        Session in Progress
      </div>

      {/* Transcript */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 80px",
          maxWidth: 900,
        }}
      >
        <p
          style={{
            fontSize: 30,
            fontStyle: "italic",
            color: "#6b7684",
            textAlign: "center",
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          "{displayText || PLACEHOLDER}
          {displayText && <span className="cursor-bar" />}"
        </p>
      </div>

      {/* Mic + status */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 90 }}>
        <button
          onClick={togglePause}
          className={isPaused ? "" : "mic-pulse"}
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: isPaused ? "#9ca3af" : "#3d5c52",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
          }}
          title={isPaused ? "Resume" : "Pause"}
        >
          <Mic size={34} color="#fff" />
        </button>

        <div style={{ marginTop: 24, fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", color: "#3f5568" }}>
          {isPaused ? "PAUSED" : "RECORDING"}
        </div>
        <div style={{ marginTop: 6, fontSize: 20, color: "#1c2530", fontWeight: 500 }}>
          {formatDuration(elapsed)}
        </div>

        {!supported && (
          <p style={{ fontSize: 12.5, color: "#9ca3af", marginTop: 12, textAlign: "center", maxWidth: 320 }}>
            Live transcription isn't supported in this browser, but your session is still being timed.
          </p>
        )}

        <button
          onClick={handleEnd}
          style={{
            marginTop: 28,
            background: "transparent",
            border: "1px solid #d1d5db",
            color: "#374151",
            borderRadius: 999,
            padding: "10px 26px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          End Session
        </button>
      </div>
    </div>
  );
}