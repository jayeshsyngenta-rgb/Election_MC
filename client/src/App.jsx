import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import "./status-colors.css";

function App() {
  return (
    <Routes>
      {/* Voter search login is the default landing page */}
      <Route path="/" element={<Login />} />

      {/* Separate admin login, reached via the Admin button in the header */}
      <Route path="/admin/login" element={<AdminLogin />} />

      <Route
        path="/voter-search"
        element={
          <ProtectedAdminRoute tokenKey="voterToken" redirectTo="/">
            <Dashboard />
          </ProtectedAdminRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedAdminRoute tokenKey="adminDashToken" redirectTo="/admin/login">
            <AdminDashboard />
          </ProtectedAdminRoute>
        }
      />
    </Routes>
  );
}

export default App;