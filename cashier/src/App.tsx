import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import SignInPage from "./pages/SignIn";
import PosPage from "./pages/Pos";
import AppLayout from "./layout/AppLayout";
import ProtectedRoute, { GuestRoute } from "./components/auth/ProtectedRoute";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/signin" element={<SignInPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<PosPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
