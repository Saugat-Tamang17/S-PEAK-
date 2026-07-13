import { Link } from "react-router-dom";
import { Mic, BarChart2, History, MessageSquare } from "lucide-react";

function NavBar() {
  return (
    <header className="border-b border-[#E4E7E3] bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-lg font-semibold text-[#161F1B]">
          S-PEAK
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm text-[#33423A] hover:text-[#161F1B]">
            Log in
          </Link>
          <Link
            to="/signup"
            className="rounded-lg bg-[#33493D] px-4 py-2 text-sm font-medium text-white hover:bg-[#28392F]"
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
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 text-xs text-[#6B7A70] md:flex-row">
        <p>© {new Date().getFullYear()} S-PEAK</p>
        <div className="flex gap-6">
          <a href="#" className="hover:underline">Privacy</a>
          <a href="#" className="hover:underline">Terms</a>
          <a href="#" className="hover:underline">Support</a>
        </div>
      </div>
    </footer>
  );
}

const FEATURES = [
  {
    icon: BarChart2,
    title: "Real-time AI Evaluations",
    description:
      "Get feedback on pronunciation, pacing, and clarity while you speak.",
  },
  {
    icon: History,
    title: "History Tracking",
    description: "Review past sessions and track your progress over time.",
  },
  {
    icon: MessageSquare,
    title: "Personalized Topics",
    description: "Practice with topics tailored to your goals and interests.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F6F7F5]">
      <NavBar />

      <main className="mx-auto max-w-4xl px-6 py-20">
        <section className="text-center">
          <h1 className="text-4xl font-semibold text-[#161F1B] sm:text-5xl">
            Find your quiet confidence.
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-[#5B6961]">
            Practice English speaking with real-time AI feedback.
          </p>

          <Link
            to="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#33493D] px-6 py-3 text-[15px] font-medium text-white hover:bg-[#28392F]"
          >
            <Mic size={18} />
            Start Speaking
          </Link>
        </section>

        <section className="mt-24">
          <h2 className="text-center text-xl font-semibold text-[#161F1B]">Features</h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-lg border border-[#E4E7E3] bg-white p-6"
              >
                <Icon size={20} className="text-[#33493D]" />
                <h3 className="mt-3 text-[15px] font-semibold text-[#161F1B]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5B6961]">{description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
