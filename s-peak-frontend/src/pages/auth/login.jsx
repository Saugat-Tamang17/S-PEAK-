import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../layout/AuthLayout";
import FormField from "../../components/auth/formfield";
import { login } from "../../lib/api";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
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
    if (!form.email.trim()) next.email = "Enter your email.";
    if (!form.password) next.password = "Enter your password.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
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
      eyebrow="Welcome back"
      title="Find your quiet confidence."
      subtitle="Sign in to pick up your practice where you left off."
      footer={
        <>
          By continuing, you agree to S-PEAK's{" "}
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
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
        />

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-[13px] font-medium text-[#2B362F]"
            >
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-[12.5px] text-[#3F5D50] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <FormField
            id="password"
            label={null}
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />
        </div>

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
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-8 text-center text-[14px] text-[#5B6660]">
        New to S-PEAK?{" "}
        <Link to="/signup" className="font-medium text-[#2F4A3F] hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}