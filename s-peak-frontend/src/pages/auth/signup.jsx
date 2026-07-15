import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../layout/AuthLayout";
import FormField from "../../components/auth/formfield";
import { login, register } from "../../lib/api";

export default function SignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((err) => ({ ...err, [name]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Enter your name.";
    if (!form.email.trim()) next.email = "Enter your email.";
    if (form.password.length < 8)
      next.password = "Use at least 8 characters.";
    if (!agreed) next.agreed = "Accept the terms to continue.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register(form.name,form.email, form.password);
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setFormError(err.message || "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Get started"
      title="Begin your practice."
      subtitle="Create an account to get real-time feedback tailored to you."
      footer={
        <>
          By creating an account, you agree to S-PEAK's{" "}
          <Link to="/terms" className="underline underline-offset-2">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <FormField
          id="name"
          label="Full name"
          autoComplete="name"
          placeholder="Alex Rivera"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
        />

        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
        />

        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
        />

        <label className="flex items-start gap-2.5 text-[13px] leading-relaxed text-[#5B6660]">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => {
              setAgreed(e.target.checked);
              setErrors((err) => ({ ...err, agreed: undefined }));
            }}
            className="mt-0.5 h-4 w-4 rounded border-[#DEE4DF] text-[#2F4A3F] focus:ring-[#3F5D50]/30"
          />
          I agree to the Terms of Service and Privacy Policy.
        </label>
        {errors.agreed && (
          <p className="-mt-3 text-[12.5px] text-[#C4574B]">{errors.agreed}</p>
        )}

        {formError && (
          <p className="rounded-lg bg-[#FBEEED] px-3.5 py-2.5 text-[13px] text-[#C4574B]">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-[#2F4A3F] py-3 text-[14.5px] font-medium text-white
            transition hover:bg-[#25392F] disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-8 text-center text-[14px] text-[#5B6660]">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-[#2F4A3F] hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}