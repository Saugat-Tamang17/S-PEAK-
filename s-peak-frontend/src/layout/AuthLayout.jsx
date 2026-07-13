import { Link } from "react-router-dom";

export default function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}) {
  return (
    <div className="min-h-screen w-full bg-[#F7F8F6] flex flex-col px-6 py-10">
      <Link
        to="/"
        className="mx-auto w-full max-w-[380px] text-lg font-semibold text-[#233029]"
      >
        S-PEAK
      </Link>

      <div className="mx-auto mt-16 w-full max-w-[380px] flex-1">
        {eyebrow && (
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[#6C8577]">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-semibold leading-tight text-[#1B241F]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 text-[15px] leading-relaxed text-[#5B6660]">
            {subtitle}
          </p>
        )}

        <div className="mt-8">{children}</div>
      </div>

      <p className="mx-auto w-full max-w-[380px] text-[13px] text-[#8A9490]">
        {footer}
      </p>
    </div>
  );
}
