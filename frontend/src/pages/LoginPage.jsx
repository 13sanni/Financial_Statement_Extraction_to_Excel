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
        {error ? <p className="mt-3 text-sm font-medium text-white">{error}</p> : null}
        {successMessage ? <p className="mt-3 text-sm font-medium text-white">{successMessage}</p> : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`mt-4 w-full rounded-lg px-3 py-2 text-sm font-semibold ${
            isSubmitting
              ? "cursor-not-allowed bg-slate-600 text-slate-300"
              : "bg-white text-black hover:bg-slate-200"
          }`}
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>
      <Link className="mt-3 block text-center text-sm font-medium text-white hover:underline" to="/register">
        Don&apos;t have an account? Register
      </Link>
    </AuthCard>
  );
}

export default LoginPage;
