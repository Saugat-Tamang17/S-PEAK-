import "./auth.css";

export default function AuthLayout({ eyebrow, title, subtitle, children }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <span className="auth-eyebrow">{eyebrow}</span>
        <h1 className="auth-title">{title}</h1>
        {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        <div className="auth-body">{children}</div>
      </div>
    </div>
  );
}