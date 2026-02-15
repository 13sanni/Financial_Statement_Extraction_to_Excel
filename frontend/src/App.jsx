import { useState } from "react";
import AppShell from "./components/AppShell";
import ResearchPortalPage from "./pages/ResearchPortalPage";
import { clearAuthToken, isAuthenticated, login } from "./services/authService";

function App() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event) {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      setError("");
      await login({ email, password });
      setAuthed(true);
    } catch (loginError) {
      setError(loginError?.response?.data?.error || loginError.message || "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLogout() {
    clearAuthToken();
    setAuthed(false);
  }

  if (!authed) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
        <form
          onSubmit={handleLogin}
          className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(28,53,84,0.08)]"
        >
          <h1 className="text-2xl font-semibold text-slate-900">Portal Login</h1>
          <p className="mt-1 text-sm text-slate-600">Sign in to access extraction tools and run data.</p>
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
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <AppShell
      headerActions={
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
        >
          Logout
        </button>
      }
    >
      <ResearchPortalPage />
    </AppShell>
  );
}

export default App;
