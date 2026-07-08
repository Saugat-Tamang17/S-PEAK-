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

function NavBar() {
  return (
    <header className="sticky top-0 z-10 border-b border-[#E4E7E3] bg-[#F6F7F5]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="/" className="font-serif text-lg font-bold tracking-wide text-[#161F1B]">
          S-PEAK
        </a>
 
        <nav className="hidden gap-8 text-sm text-[#33423A] md:flex">
          <a href="#features" className="hover:text-[#33493D]">Features</a>
          <a href="#how-it-works" className="hover:text-[#33493D]">How it works</a>
        </nav>
 
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-[#33423A] hover:text-[#33493D]">
            Log in
          </Link>
          <Link
            to="/signup"
            className="rounded-full bg-[#33493D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#28392F]"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#E4E7E3] px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-[#6B7A70] md:flex-row">
        <p>
          <span className="font-serif font-semibold text-[#161F1B]">S-PEAK</span>
          {"  ·  "}© {new Date().getFullYear()} S-PEAK. Find your quiet confidence.
        </p>
        <div className="flex gap-6">
          <a href="#" className="underline-offset-2 hover:underline">Privacy Policy</a>
          <a href="#" className="underline-offset-2 hover:underline">Terms of Service</a>
          <a href="#" className="underline-offset-2 hover:underline">Support</a>
        </div>
      </div>
    </footer>
  );
}


export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F6F7F5]">
      <NavBar />
 
      {/* Hero */}
      <section className="bg-[radial-gradient(circle_at_50%_0%,rgba(143,171,152,0.18),transparent_60%)] px-6 pb-16 pt-20 text-center">
        <h1 className="mx-auto max-w-2xl font-serif text-4xl font-bold leading-[1.15] text-[#161F1B] sm:text-5xl">
          Find Your Quiet{" "}
          <span className="text-[#33493D] underline decoration-[#8AAB98] decoration-2 underline-offset-4">
            Confidence.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-[#5B6961]">
          Master English speaking with real-time AI feedback and personalized
          tutoring in a space designed for focus, clarity, and growth.
        </p>
 
        <Link
          to="/signup"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#33493D]
            px-6 py-3 text-[15px] font-semibold text-white shadow-sm transition hover:bg-[#28392F]"
        >
          <Mic size={18} />
          Start Speaking
        </Link>
 
        <div className="relative mx-auto mt-16 max-w-3xl overflow-hidden rounded-3xl shadow-xl">
          <img src={heroImg} alt="" className="h-[340px] w-full object-cover sm:h-[400px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#161F1B]/25 via-transparent to-transparent" />
          <div className="absolute left-8 top-8 max-w-xs text-left">
            <p className="text-xs font-semibold tracking-[0.14em] text-[#33493D]">S-PEAK</p>
            <p className="mt-2 font-serif text-2xl font-bold leading-tight text-[#161F1B]">
              Find your stillness.
            </p>
            <p className="mt-2 text-sm text-[#33423A]">
              Discover cognitive calm and focused clarity with mindful soundscapes.
            </p>
          </div>
        </div>
      </section>
 
      {/* Features */}
      <section id="features" className="px-6 py-20">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6B7A70]">
            Cognitive stillness
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-[#161F1B]">
            Designed for deep practice.
          </h2>
        </div>
 
        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-7 shadow-[0_8px_30px_rgba(20,30,25,0.06)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E4EEE8]">
              <BarChart2 size={18} className="text-[#33493D]" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[#161F1B]">
              Real-time AI Evaluations
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#5B6961]">
              Immediate, gentle, and precise feedback on pronunciation, pacing,
              and clarity without breaking your flow.
            </p>
            <div className="mt-5">
              <Waveform />
            </div>
          </div>
 
          <div className="rounded-2xl bg-white p-7 shadow-[0_8px_30px_rgba(20,30,25,0.06)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E4E9F0]">
              <History size={18} className="text-[#33493D]" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[#161F1B]">
              History Tracking
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#5B6961]">
              Visualize your progress over time with calm, encouraging metrics
              that celebrate consistency.
            </p>
            <div className="mt-6 flex items-center justify-center">
              <ProgressRing percent={85} />
            </div>
          </div>
 
          <div className="rounded-2xl bg-white p-7 shadow-[0_8px_30px_rgba(20,30,25,0.06)] lg:col-span-2">
            <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E4EEE8]">
                  <MessageSquare size={18} className="text-[#33493D]" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#161F1B]">
                  Personalized Topics
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5B6961]">
                  Engage in conversations that matter to you. The AI adapts to
                  your professional field, interests, and current skill level,
                  creating a truly bespoke learning environment.
                </p>
                <a
                  href="#"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#33493D] hover:underline"
                >
                  Explore Topics <ArrowRight size={15} />
                </a>
              </div>
              <BlobPanel />
            </div>
          </div>
        </div>
      </section>
 
      <Footer />
    </div>
  );
}