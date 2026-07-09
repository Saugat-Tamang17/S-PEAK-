import React, { useState, useRef, useEffect } from "react";
import { Mic, Briefcase, Plane, Coffee, Download, Play, ArrowRight, Square, MessageCircle } from "lucide-react";
 

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
 
export default function SpeakDashboard() {
  const [selected, setSelected] = useState("daily");
  const [topic, setTopic] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [speechSupported, setSpeechSupported] = useState(true);
}

const recognitionRef = useRef(null);
const timerRef = useRef(null);
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }


    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
 

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setTopic(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
 
    recognitionRef.current = recognition;
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
    if (isRecording) return;
    setIsRecording(true);
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  };
 

  const endSession = () => {
    clearInterval(timerRef.current);
    setIsRecording(false);
 
    const finalTopic = topic.trim() || "Free Talk";
    const Icon = CONTEXT_ICON[selected] || MessageCircle;
    const score = Math.floor(70 + Math.random() * 25); // demo score
  }