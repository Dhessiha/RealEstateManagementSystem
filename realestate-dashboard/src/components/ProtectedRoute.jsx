import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * Gate a route by auth, and optionally by role.
 * - Not signed in -> bounced to /login.
 * - Signed in but role isn't in `roles` -> bounced to their own home
 *   (never a role picker; the account already carries its role).
 */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, role, homeRoute } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (roles && !roles.includes(role)) {
    return <Navigate to={homeRoute} replace />;
  }
  return children;
}
