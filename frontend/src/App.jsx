import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import ResearchPortalPage from "./pages/ResearchPortalPage";
import RegisterPage from "./pages/RegisterPage";
import PortalLayoutPage from "./pages/PortalLayoutPage";
import { isAuthenticated } from "./services/authService";

function App() {
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated() ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated() ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<PortalLayoutPage />}>
          <Route path="/" element={<ResearchPortalPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated() ? "/" : "/login"} replace />} />
    </Routes>
  );
}

export default App;
