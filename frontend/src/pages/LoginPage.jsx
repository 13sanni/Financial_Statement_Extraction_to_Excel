import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import { login } from "../services/authService";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const successMessage = location.state?.message || "";

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      setError("");
      await login({ email, password });
      navigate("/", { replace: true });
    } catch (loginError) {
      setError(loginError?.response?.data?.error || loginError.message || "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Portal Login"
      subtitle="Sign in to access extraction tools and run data."
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
        {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}
        {successMessage ? <p className="mt-3 text-sm font-medium text-emerald-700">{successMessage}</p> : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`mt-4 w-full rounded-lg px-3 py-2 text-sm font-medium text-white ${
            isSubmitting ? "cursor-not-allowed bg-slate-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>
      <Link className="mt-3 block text-center text-sm font-medium text-blue-700 hover:underline" to="/register">
        Don&apos;t have an account? Register
      </Link>
    </AuthCard>
  );
}

export default LoginPage;
