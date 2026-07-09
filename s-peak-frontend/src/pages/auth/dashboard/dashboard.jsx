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