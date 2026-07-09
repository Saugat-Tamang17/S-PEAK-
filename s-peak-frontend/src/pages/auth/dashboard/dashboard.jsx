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
 