import { Link } from "react-router-dom";
import { Mic, BarChart2, History, MessageSquare, ArrowRight } from "lucide-react";
import heroImg from "../assets/hero.png";

function Waveform() {
  const bars = [6, 14, 22, 12, 26, 18, 30, 16, 22, 10, 20, 14, 26, 8, 18, 12, 24, 16, 10, 20];
  return (
    <div className="flex h-24 items-end gap-1 rounded-xl bg-[#22322A] px-4 py-4">
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-1.5 rounded-full bg-[#8AAB98]/70"
          style={{ height: `${h * 3}px` }}
        />
      ))}
    </div>
  );
}
function ProgressRing({ percent = 85, size = 96, stroke = 8 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);
 
  return (
    <svg width={size} height={size} className="mx-auto -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#E4E7E3"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#33493D"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        transform={`rotate(90 ${size / 2} ${size / 2})`}
        className="fill-[#161F1B] text-[15px] font-semibold"
      >
        {percent}%
      </text>
    </svg>
  );
}

function BlobPanel() {
  return (
    <div className="relative h-full min-h-[220px] overflow-hidden rounded-2xl bg-gradient-to-br from-[#EDF1EC] to-[#CFDBD1]">
      <span className="absolute left-6 top-8 h-20 w-20 rounded-full bg-white/50 blur-[1px]" />
      <span className="absolute right-10 top-16 h-12 w-12 rounded-full bg-white/60" />
      <span className="absolute bottom-8 left-16 h-16 w-16 rounded-full bg-white/40" />
      <span className="absolute inset-0 m-auto h-40 w-40 rounded-full border border-[#33493D]/15" />
    </div>
  );
}