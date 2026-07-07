import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * FormField
 * Single labeled input. Pass type="password" to get an
 * automatic show/hide toggle.
 */
export default function FormField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
  required = true,
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-[13px] font-medium text-[#2B362F]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          name={id}
          type={resolvedType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className={`w-full rounded-xl border bg-white px-4 py-3 text-[14.5px] text-[#1B241F]
            placeholder:text-[#A6ADA8] outline-none transition
            focus:border-[#3F5D50] focus:ring-2 focus:ring-[#3F5D50]/15
            ${error ? "border-[#C4574B]" : "border-[#DEE4DF]"}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A9490] hover:text-[#2B362F]"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-[12.5px] text-[#C4574B]">{error}</p>}
    </div>
  );
}