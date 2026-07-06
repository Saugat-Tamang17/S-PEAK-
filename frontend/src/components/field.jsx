
export default function Field({ label, error, ...props }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input className="field-input" {...props} />
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}