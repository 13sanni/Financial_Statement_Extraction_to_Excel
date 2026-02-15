import { Navigate, Outlet, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import PortalNavbar from "../components/PortalNavbar";
import { clearAuthToken, isAdmin, isAuthenticated } from "../services/authService";

function PortalLayoutPage() {
  const navigate = useNavigate();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  const canSeeAdmin = isAdmin();

  function handleLogout() {
    clearAuthToken();
    navigate("/login", { replace: true });
  }

  return (
    <AppShell
      headerMiddle={<PortalNavbar showAdmin={canSeeAdmin} />}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 shadow-[0_6px_16px_rgba(2,6,23,0.55)] hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      }
    >
      <div className="mt-6">
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </AppShell>
  );
}

export default PortalLayoutPage;
