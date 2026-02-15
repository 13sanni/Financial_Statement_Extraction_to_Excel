import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import { register } from "../services/authService";

function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await register({ email, password });
      navigate("/login", { replace: true, state: { message: "Registration successful. Please sign in." } });
    } catch (registerError) {
      setError(registerError?.response?.data?.error || registerError.message || "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Create Account"
      subtitle="Register an account to access extraction tools and run data."
    >
      <form onSubmit={handleSubmit}>
        <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.04em] text-slate-400">
          Email
          <input
            className="mt-1 block w-full rounded-lg border border-slate-600 bg-black px-3 py-2 text-sm text-white outline-none ring-white/20 transition focus:border-white focus:ring-4"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.04em] text-slate-400">
          Password
          <input
            className="mt-1 block w-full rounded-lg border border-slate-600 bg-black px-3 py-2 text-sm text-white outline-none ring-white/20 transition focus:border-white focus:ring-4"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
        </label>
        <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.04em] text-slate-400">
          Confirm Password
          <input
            className="mt-1 block w-full rounded-lg border border-slate-600 bg-black px-3 py-2 text-sm text-white outline-none ring-white/20 transition focus:border-white focus:ring-4"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={8}
            required
          />
        </label>
        {error ? <p className="mt-3 text-sm font-medium text-white">{error}</p> : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`mt-4 w-full rounded-lg px-3 py-2 text-sm font-semibold ${
            isSubmitting
              ? "cursor-not-allowed bg-slate-600 text-slate-300"
              : "bg-white text-black hover:bg-slate-200"
          }`}
        >
          {isSubmitting ? "Creating account..." : "Register"}
        </button>
      </form>
      <Link className="mt-3 block text-center text-sm font-medium text-white hover:underline" to="/login">
        Already have an account? Go to Login
      </Link>
    </AuthCard>
  );
}

export default RegisterPage;
