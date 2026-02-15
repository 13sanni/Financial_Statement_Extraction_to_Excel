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
        <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.04em] text-slate-500">
          Email
          <input
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:border-blue-400 focus:ring-4"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.04em] text-slate-500">
          Password
          <input
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:border-blue-400 focus:ring-4"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
        </label>
        <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.04em] text-slate-500">
          Confirm Password
          <input
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:border-blue-400 focus:ring-4"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={8}
            required
          />
        </label>
        {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`mt-4 w-full rounded-lg px-3 py-2 text-sm font-medium text-white ${
            isSubmitting ? "cursor-not-allowed bg-slate-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isSubmitting ? "Creating account..." : "Register"}
        </button>
      </form>
      <Link className="mt-3 block text-center text-sm font-medium text-blue-700 hover:underline" to="/login">
        Already have an account? Go to Login
      </Link>
    </AuthCard>
  );
}

export default RegisterPage;
