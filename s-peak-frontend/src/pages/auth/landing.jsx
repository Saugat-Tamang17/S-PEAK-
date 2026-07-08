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
