import React, { useState, useRef, useEffect } from "react";
import { Mic, Briefcase, Plane, Coffee, Download, Play, ArrowRight, Square, MessageCircle } from "lucide-react";
 

const CONTEXTS = [
  { id: "daily", label: "Daily Routine", icon: Coffee },
  { id: "work", label: "Work", icon: Briefcase },
  { id: "travel", label: "Travel", icon: Plane },
];
 