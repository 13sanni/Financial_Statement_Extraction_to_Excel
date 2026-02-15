import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import ExportsPage from "./pages/ExportsPage";
import LoginPage from "./pages/LoginPage";
import MaintenancePage from "./pages/MaintenancePage";
import ResearchPortalPage from "./pages/ResearchPortalPage";
import RegisterPage from "./pages/RegisterPage";
import PortalLayoutPage from "./pages/PortalLayoutPage";
import RunsPage from "./pages/RunsPage";
import { isAdmin, isAuthenticated } from "./services/authService";

function App() {
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated() ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated() ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<PortalLayoutPage />}>
          <Route path="/" element={<ResearchPortalPage />} />
          <Route path="/runs" element={<RunsPage />} />
          <Route path="/exports" element={<ExportsPage />} />
          <Route path="/maintenance" element={isAdmin() ? <MaintenancePage /> : <Navigate to="/" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated() ? "/" : "/login"} replace />} />
    </Routes>
  );
}

export default App;
