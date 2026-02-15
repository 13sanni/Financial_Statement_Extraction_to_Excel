import { Navigate, Outlet, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { clearAuthToken, isAuthenticated } from "../services/authService";

function PortalLayoutPage() {
  const navigate = useNavigate();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;

  function handleLogout() {
    clearAuthToken();
    navigate("/login", { replace: true });
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
      <Outlet />
    </AppShell>
  );
}

export default PortalLayoutPage;
