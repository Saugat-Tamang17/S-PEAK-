import { Link } from "react-router-dom";

/**
 * AuthLayout
 * Split-screen shell shared by /login and /signup.
 * Left: the form (passed in as children).
 * Right: brand panel, quiet and slow-moving — echoes the
 * "Find Your Quiet Stillness" panel from the dashboard hero.
 */
export default function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}) {
  return (
    <div className="min-h-screen w-full bg-[#F7F8F6] flex">
      {/* Left: form column */}
      <div className="flex w-full flex-col justify-between lg:w-[46%] px-8 py-10 sm:px-16">
        <Link
          to="/"
          className="text-[19px] tracking-tight text-[#233029] font-medium"
        >
          S-PEAK
        </Link>

        <div className="mx-auto w-full max-w-[380px]">
          {eyebrow && (
            <p className="mb-3 text-[11px] font-medium tracking-[0.18em] text-[#6C8577] uppercase">
              {eyebrow}
            </p>
          )}
          <h1 className="font-serif text-[34px] leading-[1.15] text-[#1B241F]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-[15px] leading-relaxed text-[#5B6660]">
              {subtitle}
            </p>
          )}

          <div className="mt-9">{children}</div>
        </div>

        <p className="mx-auto w-full max-w-[380px] text-[13px] text-[#8A9490]">
          {footer}
        </p>
      </div>

      {/* Right: brand / stillness panel */}
      <div className="relative hidden overflow-hidden lg:block lg:w-[54%]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#EDF1EC] via-[#E4EBE3] to-[#CFDBD1]" />

        {/* soft concentric ripples, matching the dashboard hero motif */}
        <svg
          className="absolute inset-0 h-full w-full opacity-70"
          viewBox="0 0 800 900"
          fill="none"
          aria-hidden="true"
        >
          {[120, 200, 280, 360].map((r) => (
            <circle
              key={r}
              cx="500"
              cy="420"
              r={r}
              stroke="#9DB0A2"
              strokeOpacity="0.35"
              strokeWidth="1"
            />
          ))}
          <circle cx="420" cy="300" r="46" fill="#F5F8F4" fillOpacity="0.7" />
          <circle cx="580" cy="360" r="70" fill="#EEF3ED" fillOpacity="0.55" />
          <circle cx="520" cy="500" r="30" fill="#F5F8F4" fillOpacity="0.8" />
        </svg>

        <div className="relative flex h-full flex-col justify-end p-16">
          <p className="text-[11px] font-medium tracking-[0.18em] text-[#4B5F52] uppercase">
            Cognitive Stillness
          </p>
          <h2 className="mt-3 max-w-[420px] font-serif text-[30px] leading-[1.2] text-[#1B241F]">
            Real growth happens in a calm mind.
          </h2>
          <p className="mt-4 max-w-[380px] text-[15px] leading-relaxed text-[#455049]">
            Every session is scored gently and privately — designed to build
            fluency without the pressure of being judged.
          </p>
        </div>
      </div>
    </div>
  );
}