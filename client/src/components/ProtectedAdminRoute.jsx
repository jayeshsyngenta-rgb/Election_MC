import { Navigate } from "react-router-dom";

export default function ProtectedAdminRoute({
  children,
  tokenKey = "adminToken",
  redirectTo = "/admin/login",
}) {
  const token = localStorage.getItem(tokenKey);
  if (!token) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
}